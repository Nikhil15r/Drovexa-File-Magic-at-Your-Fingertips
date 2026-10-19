export type FileCategory = 'image' | 'pdf' | 'document' | 'unknown';

export interface FileMetadata {
  id: string;
  path: string;
  name: string;
  size: number;
  formattedSize: string;
  extension: string;
  category: FileCategory;
  mimeType: string;
  dimensions?: {
    width: number;
    height: number;
  };
  pageCount?: number;
  thumbnailData?: string;
  lastModified: number;
}

export type ImageActionType = 
  | 'crop' 
  | 'resize' 
  | 'compress' 
  | 'convert' 
  | 'background' 
  | 'adjustments' 
  | 'annotate' 
  | 'rotate'
  | 'metadata';

export type PdfActionType = 
  | 'pdf_preview'
  | 'pdf_convert_images' 
  | 'pdf_merge' 
  | 'pdf_split' 
  | 'pdf_extract' 
  | 'pdf_rotate' 
  | 'pdf_compress';

export type BatchActionType =
  | 'batch_convert'
  | 'batch_resize'
  | 'batch_compress'
  | 'batch_images_to_pdf';

export type ActionType = ImageActionType | PdfActionType | BatchActionType;

export interface RadialActionItem {
  id: ActionType;
  label: string;
  description: string;
  iconName: string;
  color: string;
  badge?: string;
  shortcut?: string;
}

// Editor Option Types
export interface CropOptions {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ResizeOptions {
  width: number;
  height: number;
  maintainAspectRatio: boolean;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

export interface CompressOptions {
  quality: number; // 1 - 100
  format?: 'original' | 'jpeg' | 'png' | 'webp' | 'avif';
  lossless?: boolean;
}

export interface ConvertOptions {
  targetFormat: 'png' | 'jpeg' | 'webp' | 'avif' | 'tiff' | 'bmp' | 'ico' | 'pdf';
  quality?: number;
}

export interface BackgroundOptions {
  type: 'solid' | 'gradient' | 'transparent';
  color?: string;
  gradient?: {
    from: string;
    to: string;
    angle: number;
  };
  padding: number;
  cornerRadius: number;
  shadowBlur: number;
  shadowColor: string;
  shadowOpacity: number;
  borderWidth: number;
  borderColor: string;
  targetCanvas?: {
    width: number;
    height: number;
  };
  removeOriginalBg?: boolean;
  colorTolerance?: number; // For knockout
}

export interface AdjustmentsOptions {
  brightness: number; // -100 to 100, 0 is normal
  contrast: number;   // -100 to 100, 0 is normal
  saturation: number; // -100 to 100, 0 is normal
  hue: number;        // -180 to 180, 0 is normal
  blur: number;       // 0 to 50
  sharpen: number;    // 0 to 10
  greyscale: boolean;
  sepia: boolean;
  invert: boolean;
}

export interface AnnotateOptions {
  textOverlays: Array<{
    text: string;
    x: number;
    y: number;
    fontSize: number;
    color: string;
    backgroundColor?: string;
    fontFamily?: string;
    fontWeight?: string;
  }>;
  watermark?: {
    text: string;
    opacity: number;
    fontSize: number;
    color: string;
    position?: 'center' | 'bottom-right' | 'diagonal' | 'custom';
    x?: number;
    y?: number;
    rotation?: number;
  };
}

export interface RotateOptions {
  angle: number; // 0, 90, 180, 270 or arbitrary
  flipH: boolean;
  flipV: boolean;
}

export interface PdfMergeOptions {
  inputPaths: string[];
}

export interface PdfSplitOptions {
  pages: string; // e.g., "1-3, 5, 7-10" or "each"
}

export interface PdfExtractOptions {
  pageNumbers: number[];
}

export interface PdfToImagesOptions {
  format: 'png' | 'jpeg' | 'webp';
  dpi: number; // 72, 150, 300
  pages?: number[]; // empty for all
}

export interface ImagesToPdfOptions {
  pageSize: 'fit' | 'a4' | 'letter';
  orientation: 'auto' | 'portrait' | 'landscape';
  margin: number;
}

export interface SaveResult {
  success: boolean;
  outputPath?: string;
  error?: string;
  outputSize?: number;
  formattedOutputSize?: string;
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  accentColor: string;
  defaultSaveBesideOriginal: boolean;
  customSaveDirectory?: string;
  openFolderAfterSave: boolean;
  defaultJpegQuality: number;
  defaultWebpQuality: number;
  menuLayout: 'radial' | 'grid';
  showAnimations: boolean;
  floatingWidgetEnabled: boolean;
  floatingWidgetAlwaysOnTop: boolean;
  floatingWidgetPosition?: { x: number; y: number };
}

export interface BatchItem {
  id: string;
  file: FileMetadata;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  outputPath?: string;
  error?: string;
}
