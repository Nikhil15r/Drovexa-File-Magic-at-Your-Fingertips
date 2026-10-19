import { 
  FileMetadata, 
  CropOptions, 
  ResizeOptions, 
  CompressOptions, 
  ConvertOptions, 
  BackgroundOptions, 
  AdjustmentsOptions, 
  AnnotateOptions, 
  RotateOptions,
  PdfMergeOptions,
  PdfSplitOptions,
  PdfExtractOptions,
  PdfToImagesOptions,
  ImagesToPdfOptions,
  SaveResult,
  AppSettings
} from './index';

export interface ElectronAPI {
  // Window controls
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  isMaximized: () => Promise<boolean>;

  // File operations & Dialogs
  openFileDialog: (options?: { multiple?: boolean; filters?: { name: string; extensions: string[] }[] }) => Promise<string[] | null>;
  openFolderDialog: () => Promise<string | null>;
  getFileMetadata: (filePath: string) => Promise<FileMetadata>;
  showItemInFolder: (filePath: string) => Promise<void>;
  openPath: (filePath: string) => Promise<void>;
  readFileAsBase64: (filePath: string) => Promise<string>;

  // Image Processing
  cropImage: (filePath: string, options: CropOptions, outputOverride?: string) => Promise<SaveResult>;
  resizeImage: (filePath: string, options: ResizeOptions, outputOverride?: string) => Promise<SaveResult>;
  compressImage: (filePath: string, options: CompressOptions, outputOverride?: string) => Promise<SaveResult>;
  convertImage: (filePath: string, options: ConvertOptions, outputOverride?: string) => Promise<SaveResult>;
  applyBackground: (filePath: string, options: BackgroundOptions, outputOverride?: string) => Promise<SaveResult>;
  applyAdjustments: (filePath: string, options: AdjustmentsOptions, outputOverride?: string) => Promise<SaveResult>;
  applyAnnotations: (filePath: string, options: AnnotateOptions, outputOverride?: string) => Promise<SaveResult>;
  rotateImage: (filePath: string, options: RotateOptions, outputOverride?: string) => Promise<SaveResult>;
  getCompressedPreview: (filePath: string, options: CompressOptions) => Promise<{ dataUrl: string; estimatedSize: number }>;

  // PDF Operations
  imagesToPdf: (imagePaths: string[], options: ImagesToPdfOptions, outputOverride?: string) => Promise<SaveResult>;
  pdfToImages: (pdfPath: string, options: PdfToImagesOptions, outputDir?: string) => Promise<SaveResult>;
  mergePdfs: (pdfPaths: string[], outputOverride?: string) => Promise<SaveResult>;
  splitPdf: (pdfPath: string, options: PdfSplitOptions, outputDir?: string) => Promise<SaveResult>;
  extractPdfPages: (pdfPath: string, options: PdfExtractOptions, outputOverride?: string) => Promise<SaveResult>;
  rotatePdfPages: (pdfPath: string, pageNumbers: number[], angle: number, outputOverride?: string) => Promise<SaveResult>;
  getPdfPageCount: (pdfPath: string) => Promise<number>;
  renderPdfPage: (pdfPath: string, pageNumber: number) => Promise<string>; // returns base64 png dataUrl

  // Batch Processing
  processBatchItem: (type: string, filePath: string, options: any, outputDir?: string) => Promise<SaveResult>;

  // Settings & System
  getSettings: () => Promise<AppSettings>;
  saveSettings: (settings: Partial<AppSettings>) => Promise<boolean>;
  installContextMenu: () => Promise<{ success: boolean; message: string }>;
  uninstallContextMenu: () => Promise<{ success: boolean; message: string }>;

  // Floating Widget & Quick Actions
  toggleFloatingWidget: (show?: boolean) => Promise<boolean>;
  isFloatingWidgetVisible: () => Promise<boolean>;
  expandFloatingWidget: (width?: number, height?: number) => Promise<void>;
  collapseFloatingWidget: () => Promise<void>;
  openInMainWindow: (filePath: string, actionId?: string) => Promise<void>;
  hideFloatingWidget: () => Promise<void>;
  resetFloatingWidgetPosition: () => Promise<void>;

  // Event Listeners
  onCliOpenFile: (callback: (filePath: string) => void) => () => void;
  onOpenWithAction: (callback: (data: { filePath: string; actionId?: string }) => void) => () => void;
  onFloatingVisibilityChange: (callback: (visible: boolean) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
