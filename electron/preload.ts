import { contextBridge, ipcRenderer } from 'electron';
import { 
  CropOptions, 
  ResizeOptions, 
  CompressOptions, 
  ConvertOptions, 
  BackgroundOptions, 
  AdjustmentsOptions, 
  AnnotateOptions, 
  RotateOptions,
  PdfSplitOptions,
  PdfExtractOptions,
  PdfToImagesOptions,
  ImagesToPdfOptions,
  AppSettings
} from '../src/types';

contextBridge.exposeInMainWorld('electronAPI', {
  // Window Controls
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),

  // File operations & Dialogs
  openFileDialog: (options?: any) => ipcRenderer.invoke('file:openDialog', options),
  openFolderDialog: () => ipcRenderer.invoke('file:openFolderDialog'),
  getFileMetadata: (filePath: string) => ipcRenderer.invoke('file:getMetadata', filePath),
  showItemInFolder: (filePath: string) => ipcRenderer.invoke('file:showInFolder', filePath),
  openPath: (filePath: string) => ipcRenderer.invoke('file:openPath', filePath),
  readFileAsBase64: (filePath: string) => ipcRenderer.invoke('file:readBase64', filePath),

  // Image Processing
  cropImage: (filePath: string, options: CropOptions, outputOverride?: string) => 
    ipcRenderer.invoke('image:crop', filePath, options, outputOverride),
  resizeImage: (filePath: string, options: ResizeOptions, outputOverride?: string) => 
    ipcRenderer.invoke('image:resize', filePath, options, outputOverride),
  compressImage: (filePath: string, options: CompressOptions, outputOverride?: string) => 
    ipcRenderer.invoke('image:compress', filePath, options, outputOverride),
  convertImage: (filePath: string, options: ConvertOptions, outputOverride?: string) => 
    ipcRenderer.invoke('image:convert', filePath, options, outputOverride),
  applyBackground: (filePath: string, options: BackgroundOptions, outputOverride?: string) => 
    ipcRenderer.invoke('image:applyBackground', filePath, options, outputOverride),
  applyAdjustments: (filePath: string, options: AdjustmentsOptions, outputOverride?: string) => 
    ipcRenderer.invoke('image:applyAdjustments', filePath, options, outputOverride),
  applyAnnotations: (filePath: string, options: AnnotateOptions, outputOverride?: string) => 
    ipcRenderer.invoke('image:applyAnnotations', filePath, options, outputOverride),
  rotateImage: (filePath: string, options: RotateOptions, outputOverride?: string) => 
    ipcRenderer.invoke('image:rotate', filePath, options, outputOverride),
  getCompressedPreview: (filePath: string, options: CompressOptions) => 
    ipcRenderer.invoke('image:getCompressedPreview', filePath, options),

  // PDF Operations
  imagesToPdf: (imagePaths: string[], options: ImagesToPdfOptions, outputOverride?: string) => 
    ipcRenderer.invoke('pdf:imagesToPdf', imagePaths, options, outputOverride),
  pdfToImages: (pdfPath: string, options: PdfToImagesOptions, outputDir?: string) => 
    ipcRenderer.invoke('pdf:toImages', pdfPath, options, outputDir),
  mergePdfs: (pdfPaths: string[], outputOverride?: string) => 
    ipcRenderer.invoke('pdf:merge', pdfPaths, outputOverride),
  splitPdf: (pdfPath: string, options: PdfSplitOptions, outputDir?: string) => 
    ipcRenderer.invoke('pdf:split', pdfPath, options, outputDir),
  extractPdfPages: (pdfPath: string, options: PdfExtractOptions, outputOverride?: string) => 
    ipcRenderer.invoke('pdf:extractPages', pdfPath, options, outputOverride),
  rotatePdfPages: (pdfPath: string, pageNumbers: number[], angle: number, outputOverride?: string) => 
    ipcRenderer.invoke('pdf:rotatePages', pdfPath, pageNumbers, angle, outputOverride),
  getPdfPageCount: (pdfPath: string) => 
    ipcRenderer.invoke('pdf:getPageCount', pdfPath),
  renderPdfPage: (pdfPath: string, pageNumber: number) => 
    ipcRenderer.invoke('pdf:renderPage', pdfPath, pageNumber),

  // Batch Operations
  processBatchItem: (type: string, filePath: string, options: any, outputDir?: string) => 
    ipcRenderer.invoke('batch:processItem', type, filePath, options, outputDir),

  // Settings & System
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings: Partial<AppSettings>) => ipcRenderer.invoke('settings:save', settings),
  installContextMenu: () => ipcRenderer.invoke('registry:installMenu'),
  uninstallContextMenu: () => ipcRenderer.invoke('registry:uninstallMenu'),

  // Floating Widget & Quick Actions
  toggleFloatingWidget: (show?: boolean) => ipcRenderer.invoke('floating:toggle', show),
  isFloatingWidgetVisible: () => ipcRenderer.invoke('floating:isVisible'),
  expandFloatingWidget: (width?: number, height?: number) => ipcRenderer.invoke('floating:expand', width, height),
  collapseFloatingWidget: () => ipcRenderer.invoke('floating:collapse'),
  openInMainWindow: (filePath: string, actionId?: string) => ipcRenderer.invoke('floating:openInMain', filePath, actionId),
  hideFloatingWidget: () => ipcRenderer.invoke('floating:hide'),
  resetFloatingWidgetPosition: () => ipcRenderer.invoke('floating:resetPosition'),

  // Event Listeners
  onCliOpenFile: (callback: (filePath: string) => void) => {
    const listener = (_: any, path: string) => callback(path);
    ipcRenderer.on('cli:openFile', listener);
    return () => ipcRenderer.removeListener('cli:openFile', listener);
  },
  onOpenWithAction: (callback: (data: { filePath: string; actionId?: string }) => void) => {
    const listener = (_: any, data: { filePath: string; actionId?: string }) => callback(data);
    ipcRenderer.on('window:loadFileAndAction', listener);
    return () => ipcRenderer.removeListener('window:loadFileAndAction', listener);
  },
  onFloatingVisibilityChange: (callback: (visible: boolean) => void) => {
    const listener = (_: any, visible: boolean) => callback(visible);
    ipcRenderer.on('floating:visibilityChange', listener);
    return () => ipcRenderer.removeListener('floating:visibilityChange', listener);
  },
});
