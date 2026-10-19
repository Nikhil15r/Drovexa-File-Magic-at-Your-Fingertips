import '../setupEnv';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { dialog, shell, BrowserWindow } from 'electron';
import sharp from 'sharp';
import { FileMetadata, FileCategory, AppSettings } from '../../src/types';

export class FileService {
  private static formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  public static getFileCategory(ext: string): FileCategory {
    const cleanExt = ext.toLowerCase().replace(/^\./, '');
    const imageExtensions = ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'tiff', 'tif', 'ico', 'avif', 'gif', 'svg'];
    const pdfExtensions = ['pdf'];
    const docExtensions = ['docx', 'txt', 'rtf', 'md', 'json', 'csv'];

    if (imageExtensions.includes(cleanExt)) return 'image';
    if (pdfExtensions.includes(cleanExt)) return 'pdf';
    if (docExtensions.includes(cleanExt)) return 'document';
    return 'unknown';
  }

  public static getMimeType(ext: string): string {
    const cleanExt = ext.toLowerCase().replace(/^\./, '');
    const map: Record<string, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
      bmp: 'image/bmp',
      tiff: 'image/tiff',
      tif: 'image/tiff',
      ico: 'image/x-icon',
      avif: 'image/avif',
      gif: 'image/gif',
      svg: 'image/svg+xml',
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      txt: 'text/plain',
      rtf: 'application/rtf',
    };
    return map[cleanExt] || 'application/octet-stream';
  }

  public static async getFileMetadata(filePath: string): Promise<FileMetadata> {
    const stats = await fs.stat(filePath);
    const parsed = path.parse(filePath);
    const ext = parsed.ext.toLowerCase();
    const category = this.getFileCategory(ext);
    const mimeType = this.getMimeType(ext);

    let dimensions: { width: number; height: number } | undefined;
    let thumbnailData: string | undefined;

    if (category === 'image') {
      try {
        const metadata = await sharp(filePath).metadata();
        if (metadata.width && metadata.height) {
          dimensions = { width: metadata.width, height: metadata.height };
        }
        // Generate fast lightweight thumbnail (max 320px)
        const thumbBuffer = await sharp(filePath)
          .resize(320, 320, { fit: 'inside', withoutEnlargement: true })
          .toFormat('webp', { quality: 80 })
          .toBuffer();
        thumbnailData = `data:image/webp;base64,${thumbBuffer.toString('base64')}`;
      } catch (err) {
        console.warn(`Could not generate thumbnail for image: ${filePath}`, err);
      }
    } else if (category === 'pdf') {
      // PDF thumbnail and page count will be enriched by pdfService
    }

    return {
      id: `${filePath}-${stats.mtimeMs}`,
      path: filePath,
      name: parsed.name + parsed.ext,
      size: stats.size,
      formattedSize: this.formatBytes(stats.size),
      extension: ext,
      category,
      mimeType,
      dimensions,
      thumbnailData,
      lastModified: stats.mtimeMs,
    };
  }

  public static async readFileAsBase64(filePath: string): Promise<string> {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath);
    const mime = this.getMimeType(ext);
    return `data:${mime};base64,${data.toString('base64')}`;
  }

  public static resolveOutputPath(
    inputPath: string, 
    suffix: string, 
    newExt?: string, 
    settings?: Partial<AppSettings>, 
    customDirOverride?: string
  ): string {
    const parsed = path.parse(inputPath);
    const targetDir = customDirOverride || (
      settings?.defaultSaveBesideOriginal === false && settings?.customSaveDirectory
        ? settings.customSaveDirectory
        : parsed.dir
    );

    const ext = newExt ? (newExt.startsWith('.') ? newExt : `.${newExt}`) : parsed.ext;
    let targetFileName = `${parsed.name}_${suffix}${ext}`;
    let fullPath = path.join(targetDir, targetFileName);

    let counter = 1;
    while (fsSync.existsSync(fullPath)) {
      targetFileName = `${parsed.name}_${suffix}_(${counter})${ext}`;
      fullPath = path.join(targetDir, targetFileName);
      counter++;
    }

    return fullPath;
  }

  public static async openFileDialog(
    parentWindow: BrowserWindow,
    options?: { multiple?: boolean; filters?: { name: string; extensions: string[] }[] }
  ): Promise<string[] | null> {
    const result = await dialog.showOpenDialog(parentWindow, {
      title: 'Select File(s)',
      properties: options?.multiple ? ['openFile', 'multiSelections'] : ['openFile'],
      filters: options?.filters || [
        { 
          name: 'All Supported Files', 
          extensions: ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'tiff', 'tif', 'ico', 'avif', 'gif', 'pdf', 'docx', 'txt', 'rtf'] 
        },
        { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'tiff', 'tif', 'ico', 'avif', 'gif'] },
        { name: 'PDF Documents', extensions: ['pdf'] },
        { name: 'Documents', extensions: ['docx', 'txt', 'rtf'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (result.canceled || !result.filePaths.length) return null;
    return result.filePaths;
  }

  public static async openFolderDialog(parentWindow: BrowserWindow): Promise<string | null> {
    const result = await dialog.showOpenDialog(parentWindow, {
      title: 'Select Destination Folder',
      properties: ['openDirectory', 'createDirectory']
    });

    if (result.canceled || !result.filePaths.length) return null;
    return result.filePaths[0];
  }

  public static async showItemInFolder(filePath: string): Promise<void> {
    if (fsSync.existsSync(filePath)) {
      shell.showItemInFolder(filePath);
    }
  }

  public static async openPath(filePath: string): Promise<void> {
    if (fsSync.existsSync(filePath)) {
      await shell.openPath(filePath);
    }
  }
}
