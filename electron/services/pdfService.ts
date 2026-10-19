import '../setupEnv';
import { PDFDocument, degrees, PageSizes } from 'pdf-lib';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import sharp from 'sharp';
import { 
  ImagesToPdfOptions, 
  PdfSplitOptions, 
  PdfExtractOptions, 
  PdfToImagesOptions, 
  SaveResult 
} from '../../src/types';
import { FileService } from './fileService';

export class PdfService {
  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  public static async getPdfPageCount(pdfPath: string): Promise<number> {
    const bytes = await fs.readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    return pdfDoc.getPageCount();
  }

  public static async imagesToPdf(
    imagePaths: string[], 
    options: ImagesToPdfOptions, 
    outputOverride?: string
  ): Promise<SaveResult> {
    try {
      if (!imagePaths.length) throw new Error('No images provided for PDF conversion');
      const firstPath = imagePaths[0];
      const outputPath = outputOverride || FileService.resolveOutputPath(firstPath, 'combined', '.pdf');

      const pdfDoc = await PDFDocument.create();

      for (const imgPath of imagePaths) {
        const imageBytes = await fs.readFile(imgPath);
        const ext = path.extname(imgPath).toLowerCase();

        let embeddedImage;
        if (ext === '.jpg' || ext === '.jpeg') {
          embeddedImage = await pdfDoc.embedJpg(imageBytes);
        } else {
          const pngBuf = await sharp(imageBytes).png().toBuffer();
          embeddedImage = await pdfDoc.embedPng(pngBuf);
        }

        const imgWidth = embeddedImage.width;
        const imgHeight = embeddedImage.height;

        let pageWidth = imgWidth;
        let pageHeight = imgHeight;
        const margin = options.margin || 0;

        if (options.pageSize === 'a4') {
          pageWidth = PageSizes.A4[0];
          pageHeight = PageSizes.A4[1];
        } else if (options.pageSize === 'letter') {
          pageWidth = PageSizes.Letter[0];
          pageHeight = PageSizes.Letter[1];
        }

        // Handle orientation
        if (options.orientation === 'landscape' && pageWidth < pageHeight) {
          const tmp = pageWidth;
          pageWidth = pageHeight;
          pageHeight = tmp;
        } else if (options.orientation === 'portrait' && pageWidth > pageHeight) {
          const tmp = pageWidth;
          pageWidth = pageHeight;
          pageHeight = tmp;
        }

        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        if (options.pageSize === 'fit') {
          page.drawImage(embeddedImage, {
            x: margin,
            y: margin,
            width: imgWidth,
            height: imgHeight,
          });
        } else {
          // Scale to fit page with margin
          const availW = pageWidth - margin * 2;
          const availH = pageHeight - margin * 2;
          const scale = Math.min(availW / imgWidth, availH / imgHeight, 1);
          const scaledW = imgWidth * scale;
          const scaledH = imgHeight * scale;
          const posX = margin + (availW - scaledW) / 2;
          const posY = margin + (availH - scaledH) / 2;

          page.drawImage(embeddedImage, {
            x: posX,
            y: posY,
            width: scaledW,
            height: scaledH,
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      await fs.writeFile(outputPath, pdfBytes);

      const stats = await fs.stat(outputPath);
      return {
        success: true,
        outputPath,
        outputSize: stats.size,
        formattedOutputSize: this.formatBytes(stats.size),
      };
    } catch (err: any) {
      console.error('Error in imagesToPdf:', err);
      return { success: false, error: err.message };
    }
  }

  public static async mergePdfs(pdfPaths: string[], outputOverride?: string): Promise<SaveResult> {
    try {
      if (pdfPaths.length < 2) throw new Error('At least two PDF files are required for merging');
      const outputPath = outputOverride || FileService.resolveOutputPath(pdfPaths[0], 'merged', '.pdf');

      const mergedDoc = await PDFDocument.create();

      for (const p of pdfPaths) {
        const fileBytes = await fs.readFile(p);
        const doc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
        const copiedPages = await mergedDoc.copyPages(doc, doc.getPageIndices());
        copiedPages.forEach((page) => mergedDoc.addPage(page));
      }

      const mergedBytes = await mergedDoc.save();
      await fs.writeFile(outputPath, mergedBytes);

      const stats = await fs.stat(outputPath);
      return {
        success: true,
        outputPath,
        outputSize: stats.size,
        formattedOutputSize: this.formatBytes(stats.size),
      };
    } catch (err: any) {
      console.error('Error in mergePdfs:', err);
      return { success: false, error: err.message };
    }
  }

  public static async splitPdf(
    pdfPath: string, 
    options: PdfSplitOptions, 
    outputDir?: string
  ): Promise<SaveResult> {
    try {
      const fileBytes = await fs.readFile(pdfPath);
      const srcDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
      const totalPages = srcDoc.getPageCount();

      const parsed = path.parse(pdfPath);
      const targetDir = outputDir || parsed.dir;

      if (options.pages.toLowerCase() === 'each' || !options.pages.trim()) {
        // Split every single page into its own PDF
        for (let i = 0; i < totalPages; i++) {
          const newDoc = await PDFDocument.create();
          const [copiedPage] = await newDoc.copyPages(srcDoc, [i]);
          newDoc.addPage(copiedPage);

          const outPath = path.join(targetDir, `${parsed.name}_page_${i + 1}.pdf`);
          const outBytes = await newDoc.save();
          await fs.writeFile(outPath, outBytes);
        }

        return {
          success: true,
          outputPath: targetDir,
        };
      } else {
        // Parse custom ranges: "1-3, 5, 7-10"
        const chunks = options.pages.split(',').map((s) => s.trim());
        let partIndex = 1;

        for (const chunk of chunks) {
          const pageIndices: number[] = [];
          if (chunk.includes('-')) {
            const [startStr, endStr] = chunk.split('-');
            const start = parseInt(startStr, 10);
            const end = parseInt(endStr, 10);
            if (!isNaN(start) && !isNaN(end)) {
              for (let p = Math.max(1, start); p <= Math.min(totalPages, end); p++) {
                pageIndices.push(p - 1);
              }
            }
          } else {
            const p = parseInt(chunk, 10);
            if (!isNaN(p) && p >= 1 && p <= totalPages) {
              pageIndices.push(p - 1);
            }
          }

          if (pageIndices.length) {
            const newDoc = await PDFDocument.create();
            const copiedPages = await newDoc.copyPages(srcDoc, pageIndices);
            copiedPages.forEach((cp) => newDoc.addPage(cp));

            const outPath = path.join(targetDir, `${parsed.name}_part_${partIndex}_pages_${chunk.replace(/\s+/g, '')}.pdf`);
            const outBytes = await newDoc.save();
            await fs.writeFile(outPath, outBytes);
            partIndex++;
          }
        }

        return {
          success: true,
          outputPath: targetDir,
        };
      }
    } catch (err: any) {
      console.error('Error in splitPdf:', err);
      return { success: false, error: err.message };
    }
  }

  public static async extractPdfPages(
    pdfPath: string, 
    options: PdfExtractOptions, 
    outputOverride?: string
  ): Promise<SaveResult> {
    try {
      const fileBytes = await fs.readFile(pdfPath);
      const srcDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
      const totalPages = srcDoc.getPageCount();

      const outputPath = outputOverride || FileService.resolveOutputPath(
        pdfPath, 
        `extracted_p${options.pageNumbers.join('_')}`, 
        '.pdf'
      );

      const indices = options.pageNumbers
        .filter((p) => p >= 1 && p <= totalPages)
        .map((p) => p - 1);

      if (!indices.length) throw new Error('No valid pages specified for extraction');

      const newDoc = await PDFDocument.create();
      const copiedPages = await newDoc.copyPages(srcDoc, indices);
      copiedPages.forEach((p) => newDoc.addPage(p));

      const outBytes = await newDoc.save();
      await fs.writeFile(outputPath, outBytes);

      const stats = await fs.stat(outputPath);
      return {
        success: true,
        outputPath,
        outputSize: stats.size,
        formattedOutputSize: this.formatBytes(stats.size),
      };
    } catch (err: any) {
      console.error('Error in extractPdfPages:', err);
      return { success: false, error: err.message };
    }
  }

  public static async rotatePdfPages(
    pdfPath: string, 
    pageNumbers: number[], 
    angle: number, 
    outputOverride?: string
  ): Promise<SaveResult> {
    try {
      const fileBytes = await fs.readFile(pdfPath);
      const doc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
      const totalPages = doc.getPageCount();

      const outputPath = outputOverride || FileService.resolveOutputPath(pdfPath, `rotated_${angle}deg`, '.pdf');

      const targetPages = pageNumbers.length 
        ? pageNumbers.map((p) => p - 1)
        : Array.from({ length: totalPages }, (_, i) => i);

      for (const idx of targetPages) {
        if (idx >= 0 && idx < totalPages) {
          const page = doc.getPage(idx);
          const currentRotation = page.getRotation().angle;
          page.setRotation(degrees((currentRotation + angle) % 360));
        }
      }

      const outBytes = await doc.save();
      await fs.writeFile(outputPath, outBytes);

      const stats = await fs.stat(outputPath);
      return {
        success: true,
        outputPath,
        outputSize: stats.size,
        formattedOutputSize: this.formatBytes(stats.size),
      };
    } catch (err: any) {
      console.error('Error in rotatePdfPages:', err);
      return { success: false, error: err.message };
    }
  }
}
