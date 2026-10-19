import { app, BrowserWindow, ipcMain, shell, Tray, Menu, screen, nativeImage } from 'electron';
import path from 'path';
import fs from 'fs';
import { FileService } from './services/fileService';
import { ImageService } from './services/imageService';
import { PdfService } from './services/pdfService';
import { SettingsService } from './services/settingsService';
import { RegistryService } from './services/registryService';

let mainWindow: BrowserWindow | null = null;
let floatingWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, commandLine) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
    const args = commandLine.slice(isDev ? 2 : 1);
    const validFileArg = args.find((arg) => !arg.startsWith('--') && !arg.startsWith('-'));
    if (validFileArg && mainWindow) {
      setTimeout(() => {
        mainWindow?.webContents.send('cli:openFile', validFileArg);
      }, 500);
    }
  });
}

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
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Intercept window close to keep tray & floating drop target active
  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow?.hide();
      updateTrayMenu();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function createFloatingWindow() {
  if (floatingWindow && !floatingWindow.isDestroyed()) {
    floatingWindow.show();
    updateTrayMenu();
    return;
  }

  const settings = await SettingsService.getSettings();
  if (settings.floatingWidgetEnabled === false) return;

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  const defaultW = 240;
  const defaultH = 80;

  let x = screenWidth - defaultW - 24;
  let y = screenHeight - defaultH - 30;

  if (settings.floatingWidgetPosition && typeof settings.floatingWidgetPosition.x === 'number') {
    const px = settings.floatingWidgetPosition.x;
    const py = settings.floatingWidgetPosition.y;
    if (px >= 0 && px < screenWidth - 40 && py >= 0 && py < screenHeight - 40) {
      x = px;
      y = py;
    }
  }

  floatingWindow = new BrowserWindow({
    width: defaultW,
    height: defaultH,
    x,
    y,
    frame: false,
    transparent: true,
    alwaysOnTop: settings.floatingWidgetAlwaysOnTop ?? true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    focusable: true,
    title: 'Universal File Toolkit - Floating Target',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    show: false,
  });

  floatingWindow.once('ready-to-show', () => {
    floatingWindow?.show();
    updateTrayMenu();
  });

  let moveTimeout: NodeJS.Timeout | null = null;
  floatingWindow.on('moved', () => {
    if (floatingWindow && !floatingWindow.isDestroyed() && floatingWindow.getBounds().width <= 300) {
      if (moveTimeout) clearTimeout(moveTimeout);
      moveTimeout = setTimeout(() => {
        if (floatingWindow && !floatingWindow.isDestroyed()) {
          const [curX, curY] = floatingWindow.getPosition();
          SettingsService.saveSettings({ floatingWidgetPosition: { x: curX, y: curY } });
        }
      }, 500);
    }
  });

  floatingWindow.on('closed', () => {
    floatingWindow = null;
    updateTrayMenu();
  });

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    floatingWindow.loadURL(process.env.VITE_DEV_SERVER_URL + '#floating');
  } else {
    floatingWindow.loadFile(path.join(__dirname, '../dist/index.html'), { hash: 'floating' });
  }
}

function expandFloatingWindow(targetW = 580, targetH = 580) {
  if (!floatingWindow || floatingWindow.isDestroyed()) return;

  const currentBounds = floatingWindow.getBounds();
  const currentDisplay = screen.getDisplayMatching(currentBounds);
  const { width: screenW, height: screenH, x: displayX, y: displayY } = currentDisplay.workArea;

  const centerX = currentBounds.x + currentBounds.width / 2;
  const centerY = currentBounds.y + currentBounds.height / 2;

  let newX = Math.round(centerX - targetW / 2);
  let newY = Math.round(centerY - targetH / 2);

  if (newX < displayX + 10) newX = displayX + 10;
  if (newX + targetW > displayX + screenW - 10) newX = displayX + screenW - targetW - 10;
  if (newY < displayY + 10) newY = displayY + 10;
  if (newY + targetH > displayY + screenH - 10) newY = displayY + screenH - targetH - 10;

  floatingWindow.setBounds({ x: newX, y: newY, width: targetW, height: targetH }, true);
}

function collapseFloatingWindow() {
  if (!floatingWindow || floatingWindow.isDestroyed()) return;

  const currentBounds = floatingWindow.getBounds();
  const currentDisplay = screen.getDisplayMatching(currentBounds);
  const { width: screenW, height: screenH, x: displayX, y: displayY } = currentDisplay.workArea;

  const targetW = 240;
  const targetH = 80;

  const centerX = currentBounds.x + currentBounds.width / 2;
  const centerY = currentBounds.y + currentBounds.height / 2;

  let newX = Math.round(centerX - targetW / 2);
  let newY = Math.round(centerY - targetH / 2);

  if (newX < displayX + 10) newX = displayX + 10;
  if (newX + targetW > displayX + screenW - 10) newX = displayX + screenW - targetW - 10;
  if (newY < displayY + 10) newY = displayY + 10;
  if (newY + targetH > displayY + screenH - 10) newY = displayY + screenH - targetH - 10;

  floatingWindow.setBounds({ x: newX, y: newY, width: targetW, height: targetH }, true);
}

async function toggleFloatingWindow(forceShow?: boolean): Promise<boolean> {
  if (!floatingWindow || floatingWindow.isDestroyed()) {
    await createFloatingWindow();
    updateTrayMenu();
    return true;
  }

  const shouldShow = forceShow !== undefined ? forceShow : !floatingWindow.isVisible();
  if (shouldShow) {
    collapseFloatingWindow();
    floatingWindow.show();
  } else {
    floatingWindow.hide();
  }

  await SettingsService.saveSettings({ floatingWidgetEnabled: shouldShow });
  updateTrayMenu();

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('floating:visibilityChange', shouldShow);
  }

  return shouldShow;
}

function createTray() {
  if (tray) return;

  let iconPath = path.join(__dirname, '../build/icon.ico');
  if (!fs.existsSync(iconPath)) {
    iconPath = path.join(__dirname, '../build/icon.png');
  }

  try {
    tray = new Tray(iconPath);
  } catch (err) {
    console.warn('Could not load tray icon from file, generating placeholder', err);
    const img = nativeImage.createEmpty();
    tray = new Tray(img);
  }

  updateTrayMenu();

  tray.setToolTip('Universal File Toolkit - Quick Actions');
  tray.on('double-click', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    } else {
      createWindow();
    }
  });
}

function updateTrayMenu() {
  if (!tray) return;

  const isFloatingVisible = floatingWindow ? floatingWindow.isVisible() : false;

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Universal File Toolkit', enabled: false },
    { type: 'separator' },
    {
      label: 'Open Main Studio',
      click: () => {
        if (mainWindow) {
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.show();
          mainWindow.focus();
        } else {
          createWindow();
        }
      },
    },
    {
      label: 'Floating Drop Target',
      type: 'checkbox',
      checked: isFloatingVisible,
      click: async () => {
        await toggleFloatingWindow();
      },
    },
    {
      label: 'Always on Top (Drop Target)',
      type: 'checkbox',
      checked: floatingWindow ? floatingWindow.isAlwaysOnTop() : true,
      click: (item) => {
        if (floatingWindow) {
          floatingWindow.setAlwaysOnTop(item.checked);
          SettingsService.saveSettings({ floatingWidgetAlwaysOnTop: item.checked });
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Quit Universal File Toolkit',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
}

app.whenReady().then(async () => {
  setupIpcHandlers();
  createWindow();
  createTray();
  await createFloatingWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('window-all-closed', () => {
  // If floating widget is disabled or quitting, quit the app
  if (isQuitting || process.platform !== 'win32') {
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

  // Floating Drop Target & Quick Actions
  ipcMain.handle('floating:toggle', async (_, show?: boolean) => {
    return await toggleFloatingWindow(show);
  });

  ipcMain.handle('floating:isVisible', () => {
    return floatingWindow ? floatingWindow.isVisible() : false;
  });

  ipcMain.handle('floating:expand', (_, width?: number, height?: number) => {
    expandFloatingWindow(width, height);
  });

  ipcMain.handle('floating:collapse', () => {
    collapseFloatingWindow();
  });

  ipcMain.handle('floating:hide', () => {
    toggleFloatingWindow(false);
  });

  ipcMain.handle('floating:openInMain', async (_, filePath: string, actionId?: string) => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      createWindow();
    }

    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();

      setTimeout(() => {
        mainWindow?.webContents.send('window:loadFileAndAction', { filePath, actionId });
      }, 300);
    }

    collapseFloatingWindow();
  });

  ipcMain.handle('floating:resetPosition', async () => {
    if (floatingWindow && !floatingWindow.isDestroyed()) {
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
      const defaultW = 240;
      const defaultH = 80;
      const x = screenWidth - defaultW - 24;
      const y = screenHeight - defaultH - 30;
      floatingWindow.setBounds({ x, y, width: defaultW, height: defaultH }, true);
      await SettingsService.saveSettings({ floatingWidgetPosition: { x, y } });
    }
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
    const result = await SettingsService.saveSettings(newSettings);
    updateTrayMenu();
    return result;
  });

  // Registry
  ipcMain.handle('registry:installMenu', async () => {
    return await RegistryService.installContextMenu();
  });

  ipcMain.handle('registry:uninstallMenu', async () => {
    return await RegistryService.uninstallContextMenu();
  });
}
