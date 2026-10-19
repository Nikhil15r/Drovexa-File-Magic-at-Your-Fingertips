import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import { FileService } from './services/fileService';
import { ImageService } from './services/imageService';
import { PdfService } from './services/pdfService';
import { SettingsService } from './services/settingsService';
import { RegistryService } from './services/registryService';

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 840,
    minWidth: 960,
    minHeight: 680,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0f172a',
    title: 'Universal File Toolkit',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();

    // Check if launched with a file argument from Windows shell
    const args = process.argv.slice(isDev ? 2 : 1);
    const validFileArg = args.find((arg) => !arg.startsWith('--') && !arg.startsWith('-'));
    if (validFileArg) {
      setTimeout(() => {
        mainWindow?.webContents.send('cli:openFile', validFileArg);
      }, 800);
    }
  });

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  setupIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function setupIpcHandlers() {
  // Window controls
  ipcMain.handle('window:minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.handle('window:close', () => {
    mainWindow?.close();
  });

  ipcMain.handle('window:isMaximized', () => {
    return mainWindow ? mainWindow.isMaximized() : false;
  });

  // File Operations
  ipcMain.handle('file:openDialog', async (_, options) => {
    if (!mainWindow) return null;
    return await FileService.openFileDialog(mainWindow, options);
  });

  ipcMain.handle('file:openFolderDialog', async () => {
    if (!mainWindow) return null;
    return await FileService.openFolderDialog(mainWindow);
  });

  ipcMain.handle('file:getMetadata', async (_, filePath: string) => {
    const meta = await FileService.getFileMetadata(filePath);
    if (meta.category === 'pdf') {
      try {
        meta.pageCount = await PdfService.getPdfPageCount(filePath);
      } catch (err) {
        console.warn('Could not read PDF page count:', err);
      }
    }
    return meta;
  });

  ipcMain.handle('file:showInFolder', async (_, filePath: string) => {
    await FileService.showItemInFolder(filePath);
  });

  ipcMain.handle('file:openPath', async (_, filePath: string) => {
    await FileService.openPath(filePath);
  });

  ipcMain.handle('file:readBase64', async (_, filePath: string) => {
    return await FileService.readFileAsBase64(filePath);
  });

  // Image Processing
  ipcMain.handle('image:crop', async (_, filePath, options, outputOverride) => {
    return await ImageService.cropImage(filePath, options, outputOverride);
  });

  ipcMain.handle('image:resize', async (_, filePath, options, outputOverride) => {
    return await ImageService.resizeImage(filePath, options, outputOverride);
  });

  ipcMain.handle('image:compress', async (_, filePath, options, outputOverride) => {
    return await ImageService.compressImage(filePath, options, outputOverride);
  });

  ipcMain.handle('image:convert', async (_, filePath, options, outputOverride) => {
    return await ImageService.convertImage(filePath, options, outputOverride);
  });

  ipcMain.handle('image:applyBackground', async (_, filePath, options, outputOverride) => {
    return await ImageService.applyBackground(filePath, options, outputOverride);
  });

  ipcMain.handle('image:applyAdjustments', async (_, filePath, options, outputOverride) => {
    return await ImageService.applyAdjustments(filePath, options, outputOverride);
  });

  ipcMain.handle('image:applyAnnotations', async (_, filePath, options, outputOverride) => {
    return await ImageService.applyAnnotations(filePath, options, outputOverride);
  });

  ipcMain.handle('image:rotate', async (_, filePath, options, outputOverride) => {
    return await ImageService.rotateImage(filePath, options, outputOverride);
  });

  ipcMain.handle('image:getCompressedPreview', async (_, filePath, options) => {
    return await ImageService.getCompressedPreview(filePath, options);
  });

  // PDF Operations
  ipcMain.handle('pdf:imagesToPdf', async (_, imagePaths, options, outputOverride) => {
    return await PdfService.imagesToPdf(imagePaths, options, outputOverride);
  });

  ipcMain.handle('pdf:merge', async (_, pdfPaths, outputOverride) => {
    return await PdfService.mergePdfs(pdfPaths, outputOverride);
  });

  ipcMain.handle('pdf:split', async (_, pdfPath, options, outputDir) => {
    return await PdfService.splitPdf(pdfPath, options, outputDir);
  });

  ipcMain.handle('pdf:extractPages', async (_, pdfPath, options, outputOverride) => {
    return await PdfService.extractPdfPages(pdfPath, options, outputOverride);
  });

  ipcMain.handle('pdf:rotatePages', async (_, pdfPath, pageNumbers, angle, outputOverride) => {
    return await PdfService.rotatePdfPages(pdfPath, pageNumbers, angle, outputOverride);
  });

  ipcMain.handle('pdf:getPageCount', async (_, pdfPath) => {
    return await PdfService.getPdfPageCount(pdfPath);
  });

  // Batch Processing
  ipcMain.handle('batch:processItem', async (_, type: string, filePath: string, options: any, outputDir?: string) => {
    const settings = await SettingsService.getSettings();
    const effectiveDir = outputDir || (settings.defaultSaveBesideOriginal ? undefined : settings.customSaveDirectory);

    switch (type) {
      case 'convert':
        return await ImageService.convertImage(filePath, options, effectiveDir ? FileService.resolveOutputPath(filePath, 'converted', `.${options.targetFormat}`, settings, effectiveDir) : undefined);
      case 'resize':
        return await ImageService.resizeImage(filePath, options, effectiveDir ? FileService.resolveOutputPath(filePath, `resized_${options.width}x${options.height}`, undefined, settings, effectiveDir) : undefined);
      case 'compress':
        return await ImageService.compressImage(filePath, options, effectiveDir ? FileService.resolveOutputPath(filePath, `compressed_q${options.quality}`, undefined, settings, effectiveDir) : undefined);
      case 'rotate':
        return await ImageService.rotateImage(filePath, options, effectiveDir ? FileService.resolveOutputPath(filePath, `rotated_${options.angle}deg`, undefined, settings, effectiveDir) : undefined);
      default:
        return { success: false, error: `Unknown batch action: ${type}` };
    }
  });

  // Settings
  ipcMain.handle('settings:get', async () => {
    return await SettingsService.getSettings();
  });

  ipcMain.handle('settings:save', async (_, newSettings) => {
    return await SettingsService.saveSettings(newSettings);
  });

  // Registry
  ipcMain.handle('registry:installMenu', async () => {
    return await RegistryService.installContextMenu();
  });

  ipcMain.handle('registry:uninstallMenu', async () => {
    return await RegistryService.uninstallContextMenu();
  });
}
