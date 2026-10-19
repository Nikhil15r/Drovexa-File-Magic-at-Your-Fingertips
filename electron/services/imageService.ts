import sharp from 'sharp';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { 
  CropOptions, 
  ResizeOptions, 
  CompressOptions, 
  ConvertOptions, 
  BackgroundOptions, 
  AdjustmentsOptions, 
  AnnotateOptions, 
  RotateOptions,
  SaveResult 
} from '../../src/types';
import { FileService } from './fileService';
import { PDFDocument } from 'pdf-lib';

export class ImageService {
  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  public static async cropImage(
    filePath: string, 
    options: CropOptions, 
    outputOverride?: string
  ): Promise<SaveResult> {
    try {
      const outputPath = outputOverride || FileService.resolveOutputPath(filePath, 'cropped');
      const metadata = await sharp(filePath).metadata();
      
      const left = Math.max(0, Math.round(options.x));
      const top = Math.max(0, Math.round(options.y));
      const width = Math.min(metadata.width ? metadata.width - left : options.width, Math.round(options.width));
      const height = Math.min(metadata.height ? metadata.height - top : options.height, Math.round(options.height));

      await sharp(filePath)
        .extract({ left, top, width, height })
        .toFile(outputPath);

      const stats = await fs.stat(outputPath);
      return {
        success: true,
        outputPath,
        outputSize: stats.size,
        formattedOutputSize: this.formatBytes(stats.size),
      };
    } catch (err: any) {
      console.error('Error in cropImage:', err);
      return { success: false, error: err.message };
    }
  }

  public static async resizeImage(
    filePath: string, 
    options: ResizeOptions, 
    outputOverride?: string
  ): Promise<SaveResult> {
    try {
      const outputPath = outputOverride || FileService.resolveOutputPath(
        filePath, 
        `resized_${options.width}x${options.height}`
      );

      const fitMode = options.maintainAspectRatio 
        ? (options.fit || 'inside') 
        : (options.fit || 'fill');

      await sharp(filePath)
        .resize({
          width: Math.round(options.width),
          height: Math.round(options.height),
          fit: fitMode,
          withoutEnlargement: false,
        })
        .toFile(outputPath);

      const stats = await fs.stat(outputPath);
      return {
        success: true,
        outputPath,
        outputSize: stats.size,
        formattedOutputSize: this.formatBytes(stats.size),
      };
    } catch (err: any) {
      console.error('Error in resizeImage:', err);
      return { success: false, error: err.message };
    }
  }

  public static async compressImage(
    filePath: string, 
    options: CompressOptions, 
    outputOverride?: string
  ): Promise<SaveResult> {
    try {
      const parsed = path.parse(filePath);
      const ext = (options.format && options.format !== 'original') 
        ? `.${options.format}` 
        : parsed.ext.toLowerCase();

      const outputPath = outputOverride || FileService.resolveOutputPath(filePath, `compressed_q${options.quality}`, ext);
      const buffer = await this.compressToBuffer(filePath, options, ext);

      await fs.writeFile(outputPath, buffer);

      const stats = await fs.stat(outputPath);
      return {
        success: true,
        outputPath,
        outputSize: stats.size,
        formattedOutputSize: this.formatBytes(stats.size),
      };
    } catch (err: any) {
      console.error('Error in compressImage:', err);
      return { success: false, error: err.message };
    }
  }

  public static async getCompressedPreview(
    filePath: string, 
    options: CompressOptions
  ): Promise<{ dataUrl: string; estimatedSize: number }> {
    const parsed = path.parse(filePath);
    const ext = (options.format && options.format !== 'original') ? `.${options.format}` : parsed.ext.toLowerCase();
    const buffer = await this.compressToBuffer(filePath, options, ext);
    const mime = FileService.getMimeType(ext);
    return {
      dataUrl: `data:${mime};base64,${buffer.toString('base64')}`,
      estimatedSize: buffer.length,
    };
  }

  private static async compressToBuffer(
    filePath: string, 
    options: CompressOptions, 
    ext: string
  ): Promise<Buffer> {
    const quality = Math.min(100, Math.max(1, options.quality));
    let pipeline = sharp(filePath);

    if (ext === '.jpg' || ext === '.jpeg') {
      pipeline = pipeline.jpeg({ quality, mozjpeg: true });
    } else if (ext === '.webp') {
      pipeline = pipeline.webp({ quality, lossless: !!options.lossless });
    } else if (ext === '.png') {
      // PNG uses compressionLevel 0-9 and optional palette quantization
      const compressionLevel = Math.round((100 - quality) / 10);
      pipeline = pipeline.png({ 
        compressionLevel: Math.min(9, Math.max(0, compressionLevel)),
        quality: quality 
      });
    } else if (ext === '.avif') {
      pipeline = pipeline.avif({ quality });
    } else {
      pipeline = pipeline.jpeg({ quality });
    }

    return await pipeline.toBuffer();
  }

  public static async convertImage(
    filePath: string, 
    options: ConvertOptions, 
    outputOverride?: string
  ): Promise<SaveResult> {
    try {
      const targetFormat = options.targetFormat.toLowerCase();
      const outputPath = outputOverride || FileService.resolveOutputPath(filePath, 'converted', `.${targetFormat}`);

      if (targetFormat === 'pdf') {
        // Convert Image to PDF
        return await this.singleImageToPdf(filePath, outputPath);
      }

      if (targetFormat === 'ico') {
        // Create standard Windows ICO from image
        const pngBuf = await sharp(filePath)
          .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer();
        
        // Wrap PNG in simple ICO container
        const icoBuffer = this.wrapPngInIco(pngBuf);
        await fs.writeFile(outputPath, icoBuffer);
      } else {
        let pipeline = sharp(filePath);
        const quality = options.quality || 90;

        switch (targetFormat) {
          case 'png':
            pipeline = pipeline.png({ quality });
            break;
          case 'jpeg':
          case 'jpg':
            pipeline = pipeline.jpeg({ quality, mozjpeg: true });
            break;
          case 'webp':
            pipeline = pipeline.webp({ quality });
            break;
          case 'avif':
            pipeline = pipeline.avif({ quality });
            break;
          case 'tiff':
            pipeline = pipeline.tiff({ quality });
            break;
          default:
            pipeline = pipeline.png();
        }

        await pipeline.toFile(outputPath);
      }

      const stats = await fs.stat(outputPath);
      return {
        success: true,
        outputPath,
        outputSize: stats.size,
        formattedOutputSize: this.formatBytes(stats.size),
      };
    } catch (err: any) {
      console.error('Error in convertImage:', err);
      return { success: false, error: err.message };
    }
  }

  private static wrapPngInIco(pngBuffer: Buffer): Buffer {
    const icoHeader = Buffer.alloc(6);
    icoHeader.writeUInt16LE(0, 0); // Reserved
    icoHeader.writeUInt16LE(1, 2); // Type 1 = ICO
    icoHeader.writeUInt16LE(1, 4); // Number of images

    const iconEntry = Buffer.alloc(16);
    iconEntry.writeUInt8(0, 0);   // Width 0 = 256
    iconEntry.writeUInt8(0, 1);   // Height 0 = 256
    iconEntry.writeUInt8(0, 2);   // Color palette
    iconEntry.writeUInt8(0, 3);   // Reserved
    iconEntry.writeUInt16LE(1, 4); // Color planes
    iconEntry.writeUInt16LE(32, 6); // Bits per pixel
    iconEntry.writeUInt32LE(pngBuffer.length, 8); // Image size in bytes
    iconEntry.writeUInt32LE(6 + 16, 12); // Offset of image data

    return Buffer.concat([icoHeader, iconEntry, pngBuffer]);
  }

  private static async singleImageToPdf(imagePath: string, outputPath: string): Promise<SaveResult> {
    const pdfDoc = await PDFDocument.create();
    const imageBytes = await fs.readFile(imagePath);
    const parsed = path.parse(imagePath);
    const ext = parsed.ext.toLowerCase();

    let embeddedImage;
    if (ext === '.jpg' || ext === '.jpeg') {
      embeddedImage = await pdfDoc.embedJpg(imageBytes);
    } else {
      // Convert to clean PNG buffer first to guarantee pdf-lib compatibility
      const pngBuffer = await sharp(imageBytes).png().toBuffer();
      embeddedImage = await pdfDoc.embedPng(pngBuffer);
    }

    const { width, height } = embeddedImage;
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width,
      height,
    });

    const pdfBytes = await pdfDoc.save();
    await fs.writeFile(outputPath, pdfBytes);

    const stats = await fs.stat(outputPath);
    return {
      success: true,
      outputPath,
      outputSize: stats.size,
      formattedOutputSize: this.formatBytes(stats.size),
    };
  }

  public static async rotateImage(
    filePath: string, 
    options: RotateOptions, 
    outputOverride?: string
  ): Promise<SaveResult> {
    try {
      const outputPath = outputOverride || FileService.resolveOutputPath(filePath, `rotated_${options.angle}deg`);
      let pipeline = sharp(filePath);

      if (options.angle !== 0) {
        pipeline = pipeline.rotate(options.angle, { background: { r: 0, g: 0, b: 0, alpha: 0 } });
      }

      if (options.flipH) {
        pipeline = pipeline.flop(); // Horizontal flip
      }

      if (options.flipV) {
        pipeline = pipeline.flip(); // Vertical flip
      }

      await pipeline.toFile(outputPath);

      const stats = await fs.stat(outputPath);
      return {
        success: true,
        outputPath,
        outputSize: stats.size,
        formattedOutputSize: this.formatBytes(stats.size),
      };
    } catch (err: any) {
      console.error('Error in rotateImage:', err);
      return { success: false, error: err.message };
    }
  }

  public static async applyAdjustments(
    filePath: string, 
    options: AdjustmentsOptions, 
    outputOverride?: string
  ): Promise<SaveResult> {
    try {
      const outputPath = outputOverride || FileService.resolveOutputPath(filePath, 'adjusted');
      let pipeline = sharp(filePath);

      // Brightness & Saturation modulation
      // 0 means 1.0 (unchanged), +50 means 1.5, -50 means 0.5
      const brightnessFactor = Math.max(0.1, 1 + options.brightness / 100);
      const saturationFactor = Math.max(0, 1 + options.saturation / 100);
      const hueShift = options.hue || 0;

      pipeline = pipeline.modulate({
        brightness: brightnessFactor,
        saturation: saturationFactor,
        hue: hueShift,
      });

      if (options.contrast !== 0) {
        // Linear contrast adjustment
        const contrastFactor = 1 + options.contrast / 100;
        pipeline = pipeline.linear(contrastFactor, -(128 * contrastFactor) + 128);
      }

      if (options.blur > 0) {
        pipeline = pipeline.blur(options.blur);
      }

      if (options.sharpen > 0) {
        pipeline = pipeline.sharpen(options.sharpen);
      }

      if (options.greyscale) {
        pipeline = pipeline.grayscale();
      }

      if (options.invert) {
        pipeline = pipeline.negate({ alpha: false });
      }

      if (options.sepia) {
        // Sepia recombination matrix
        pipeline = pipeline.recomb([
          [0.393, 0.769, 0.189],
          [0.349, 0.686, 0.168],
          [0.272, 0.534, 0.131],
        ]);
      }

      await pipeline.toFile(outputPath);

      const stats = await fs.stat(outputPath);
      return {
        success: true,
        outputPath,
        outputSize: stats.size,
        formattedOutputSize: this.formatBytes(stats.size),
      };
    } catch (err: any) {
      console.error('Error in applyAdjustments:', err);
      return { success: false, error: err.message };
    }
  }

  public static async applyBackground(
    filePath: string, 
    options: BackgroundOptions, 
    outputOverride?: string
  ): Promise<SaveResult> {
    try {
      const outputPath = outputOverride || FileService.resolveOutputPath(filePath, 'styled_bg', '.png');
      const meta = await sharp(filePath).metadata();
      const origW = meta.width || 800;
      const origH = meta.height || 600;

      let sourceBuffer = await sharp(filePath).png().toBuffer();

      // If rounded corners requested, apply SVG mask
      if (options.cornerRadius > 0) {
        const maskSvg = `<svg width="${origW}" height="${origH}">
          <rect x="0" y="0" width="${origW}" height="${origH}" rx="${options.cornerRadius}" ry="${options.cornerRadius}" fill="#ffffff"/>
        </svg>`;
        sourceBuffer = await sharp(sourceBuffer)
          .composite([{ input: Buffer.from(maskSvg), blend: 'dest-in' }])
          .png()
          .toBuffer();
      }

      const padding = options.padding || 0;
      const canvasW = options.targetCanvas?.width || (origW + padding * 2);
      const canvasH = options.targetCanvas?.height || (origH + padding * 2);

      // Create background canvas SVG
      let bgSvg = '';
      if (options.type === 'gradient' && options.gradient) {
        const { from, to, angle } = options.gradient;
        const rad = (angle * Math.PI) / 180;
        const x1 = Math.round(50 + Math.sin(rad) * 50);
        const y1 = Math.round(50 - Math.cos(rad) * 50);
        const x2 = Math.round(50 - Math.sin(rad) * 50);
        const y2 = Math.round(50 + Math.cos(rad) * 50);

        bgSvg = `<svg width="${canvasW}" height="${canvasH}">
          <defs>
            <linearGradient id="grad" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">
              <stop offset="0%" stop-color="${from}" />
              <stop offset="100%" stop-color="${to}" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grad)" />
        </svg>`;
      } else if (options.type === 'solid' && options.color) {
        bgSvg = `<svg width="${canvasW}" height="${canvasH}">
          <rect width="100%" height="100%" fill="${options.color}" />
        </svg>`;
      } else {
        // Transparent
        bgSvg = `<svg width="${canvasW}" height="${canvasH}"></svg>`;
      }

      const left = Math.round((canvasW - origW) / 2);
      const top = Math.round((canvasH - origH) / 2);

      const composites: sharp.OverlayOptions[] = [];

      // Shadow overlay if enabled
      if (options.shadowBlur > 0) {
        const shadowPadding = options.shadowBlur * 2;
        const shadowSvg = `<svg width="${canvasW}" height="${canvasH}">
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="8" stdDeviation="${options.shadowBlur / 2}" flood-color="${options.shadowColor || '#000000'}" flood-opacity="${options.shadowOpacity || 0.4}" />
          </filter>
          <rect x="${left}" y="${top}" width="${origW}" height="${origH}" rx="${options.cornerRadius}" ry="${options.cornerRadius}" fill="#000000" filter="url(#shadow)" />
        </svg>`;
        composites.push({ input: Buffer.from(shadowSvg), top: 0, left: 0 });
      }

      // Main image
      composites.push({ input: sourceBuffer, top, left });

      // Border overlay if enabled
      if (options.borderWidth > 0 && options.borderColor) {
        const borderSvg = `<svg width="${canvasW}" height="${canvasH}">
          <rect x="${left}" y="${top}" width="${origW}" height="${origH}" rx="${options.cornerRadius}" ry="${options.cornerRadius}" fill="none" stroke="${options.borderColor}" stroke-width="${options.borderWidth}" />
        </svg>`;
        composites.push({ input: Buffer.from(borderSvg), top: 0, left: 0 });
      }

      await sharp(Buffer.from(bgSvg))
        .composite(composites)
        .png()
        .toFile(outputPath);

      const stats = await fs.stat(outputPath);
      return {
        success: true,
        outputPath,
        outputSize: stats.size,
        formattedOutputSize: this.formatBytes(stats.size),
      };
    } catch (err: any) {
      console.error('Error in applyBackground:', err);
      return { success: false, error: err.message };
    }
  }

  public static async applyAnnotations(
    filePath: string, 
    options: AnnotateOptions, 
    outputOverride?: string
  ): Promise<SaveResult> {
    try {
      const outputPath = outputOverride || FileService.resolveOutputPath(filePath, 'annotated', '.png');
      const meta = await sharp(filePath).metadata();
      const w = meta.width || 800;
      const h = meta.height || 600;

      let overlaysSvg = `<svg width="${w}" height="${h}">`;

      // Text overlays
      if (options.textOverlays?.length) {
        for (const item of options.textOverlays) {
          const escText = item.text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
          
          if (item.backgroundColor) {
            overlaysSvg += `<rect x="${item.x - 6}" y="${item.y - item.fontSize}" width="${item.text.length * (item.fontSize * 0.6) + 12}" height="${item.fontSize + 10}" rx="4" fill="${item.backgroundColor}" />`;
          }

          overlaysSvg += `<text x="${item.x}" y="${item.y}" font-family="${item.fontFamily || 'sans-serif'}" font-size="${item.fontSize}px" font-weight="${item.fontWeight || 'normal'}" fill="${item.color}">${escText}</text>`;
        }
      }

      // Watermark
      if (options.watermark && options.watermark.text) {
        const wm = options.watermark;
        const escWm = wm.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const opacity = wm.opacity || 0.3;

        if (wm.position === 'diagonal') {
          overlaysSvg += `
            <g transform="translate(${w / 2}, ${h / 2}) rotate(-35)">
              <text text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="${wm.fontSize || 48}px" font-weight="bold" fill="${wm.color || '#ffffff'}" opacity="${opacity}">${escWm}</text>
            </g>
          `;
        } else if (wm.position === 'bottom-right') {
          overlaysSvg += `
            <text x="${w - 24}" y="${h - 24}" text-anchor="end" font-family="sans-serif" font-size="${wm.fontSize || 24}px" font-weight="600" fill="${wm.color || '#ffffff'}" opacity="${opacity}">${escWm}</text>
          `;
        } else {
          overlaysSvg += `
            <text x="${w / 2}" y="${h / 2}" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="${wm.fontSize || 36}px" font-weight="bold" fill="${wm.color || '#ffffff'}" opacity="${opacity}">${escWm}</text>
          `;
        }
      }

      overlaysSvg += `</svg>`;

      await sharp(filePath)
        .composite([{ input: Buffer.from(overlaysSvg), top: 0, left: 0 }])
        .png()
        .toFile(outputPath);

      const stats = await fs.stat(outputPath);
      return {
        success: true,
        outputPath,
        outputSize: stats.size,
        formattedOutputSize: this.formatBytes(stats.size),
      };
    } catch (err: any) {
      console.error('Error in applyAnnotations:', err);
      return { success: false, error: err.message };
    }
  }
}
