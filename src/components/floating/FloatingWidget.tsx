import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, 
  Wand2, 
  GripVertical, 
  X, 
  Maximize2, 
  FolderOpen, 
  ExternalLink, 
  FileText, 
  FileImage, 
  Check, 
  Sparkles,
  Crop,
  Scaling,
  Archive,
  ArrowLeftRight,
  Palette,
  SlidersHorizontal,
  Type,
  RotateCw,
  Eye,
  Layers,
  Split,
  Download,
  Info
} from 'lucide-react';
import { FileMetadata, RadialActionItem } from '../../types';

export const FloatingWidget: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeFile, setActiveFile] = useState<FileMetadata | null>(null);
  const [hoveredAction, setHoveredAction] = useState<RadialActionItem | null>(null);
  const [quickResult, setQuickResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const dragCounter = useRef(0);

  // Set transparent body on mount for floating window
  useEffect(() => {
    document.documentElement.classList.add('floating-mode');
    document.body.classList.add('bg-transparent');
    document.body.classList.remove('bg-slate-50', 'bg-slate-950');

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        handleCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    dragCounter.current = 0;

    const files = Array.from(e.dataTransfer.files);
    if (!files.length || !window.electronAPI) return;

    const filePath = (files[0] as any).path;
    if (!filePath) return;

    try {
      setIsProcessing(true);
      const meta = await window.electronAPI.getFileMetadata(filePath);
      setActiveFile(meta);
      setIsExpanded(true);
      setQuickResult(null);

      // Expand floating window to 580x580 centered around widget
      await window.electronAPI.expandFloatingWidget(580, 580);
    } catch (err) {
      console.error('Failed to inspect dropped file:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCollapse = async () => {
    setIsExpanded(false);
    setActiveFile(null);
    setHoveredAction(null);
    setQuickResult(null);
    if (window.electronAPI) {
      await window.electronAPI.collapseFloatingWidget();
    }
  };

  const handleOpenStudio = async (actionId?: string) => {
    if (!activeFile || !window.electronAPI) return;
    await window.electronAPI.openInMainWindow(activeFile.path, actionId);
    handleCollapse();
  };

  const handleOpenFolder = () => {
    if (activeFile && window.electronAPI) {
      window.electronAPI.showItemInFolder(quickResult || activeFile.path);
    }
  };

  // Quick 1-click format conversion without opening full window
  const handleQuickConvert = async (format: 'webp' | 'png' | 'jpeg' | 'pdf') => {
    if (!activeFile || !window.electronAPI) return;
    setIsProcessing(true);
    try {
      if (format === 'pdf' && activeFile.category === 'image') {
        const res = await window.electronAPI.imagesToPdf([activeFile.path], {
          pageSize: 'fit',
          orientation: 'auto',
          margin: 15,
        });
        if (res.success && res.outputPath) {
          setQuickResult(res.outputPath);
        }
      } else {
        const res = await window.electronAPI.convertImage(activeFile.path, {
          targetFormat: format,
          quality: 90,
        });
        if (res.success && res.outputPath) {
          setQuickResult(res.outputPath);
        }
      }
    } catch (err) {
      console.error('Quick convert error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Action sets
  const imageActions: RadialActionItem[] = [
    { id: 'crop', label: 'Crop', description: 'Interactive aspect ratio & custom crop', iconName: 'crop', color: 'from-emerald-500 to-teal-600', badge: 'C' },
    { id: 'resize', label: 'Resize', description: 'Scale resolution & custom dimensions', iconName: 'resize', color: 'from-sky-500 to-blue-600', badge: 'R' },
    { id: 'compress', label: 'Compress', description: 'Quality slider & file size reduction', iconName: 'compress', color: 'from-amber-500 to-orange-600', badge: 'Q' },
    { id: 'convert', label: 'Convert', description: 'Export to PNG, JPG, WEBP, AVIF, TIFF, ICO, PDF', iconName: 'convert', color: 'from-purple-500 to-indigo-600', badge: 'X' },
    { id: 'background', label: 'Background', description: 'Frame with gradients, solid colors & shadow', iconName: 'background', color: 'from-fuchsia-500 to-pink-600', badge: 'B' },
    { id: 'adjustments', label: 'Adjust', description: 'Refine brightness, contrast, hue & filters', iconName: 'adjustments', color: 'from-orange-500 to-rose-600', badge: 'A' },
    { id: 'annotate', label: 'Annotate', description: 'Text captions, badges & security watermark', iconName: 'annotate', color: 'from-indigo-500 to-cyan-600', badge: 'T' },
    { id: 'rotate', label: 'Rotate', description: 'Reorient 90°, mirror flip horizontal/vertical', iconName: 'rotate', color: 'from-rose-500 to-red-600', badge: 'F' },
  ];

  const pdfActions: RadialActionItem[] = [
    { id: 'pdf_preview', label: 'Preview', description: 'Interactive page viewer & reader', iconName: 'preview', color: 'from-sky-500 to-blue-600', badge: 'P' },
    { id: 'pdf_convert_images', label: 'To Images', description: 'Export pages as high-res PNG or JPG', iconName: 'pdf_convert_images', color: 'from-purple-500 to-indigo-600', badge: 'I' },
    { id: 'pdf_merge', label: 'Merge PDFs', description: 'Combine multiple PDF documents', iconName: 'pdf_merge', color: 'from-emerald-500 to-teal-600', badge: 'M' },
    { id: 'pdf_split', label: 'Split PDF', description: 'Split into separate pages or ranges', iconName: 'pdf_split', color: 'from-amber-500 to-orange-600', badge: 'S' },
    { id: 'pdf_extract', label: 'Extract', description: 'Extract specific pages to new PDF', iconName: 'pdf_extract', color: 'from-blue-500 to-cyan-600', badge: 'E' },
    { id: 'pdf_rotate', label: 'Rotate Pages', description: 'Rotate pages within document', iconName: 'pdf_rotate', color: 'from-rose-500 to-pink-600', badge: 'O' },
  ];

  const actions = activeFile?.category === 'pdf' ? pdfActions : imageActions;
  const radius = 205;

  const renderIcon = (name: string) => {
    switch (name) {
      case 'crop': return <Crop className="w-4 h-4" />;
      case 'resize': return <Scaling className="w-4 h-4" />;
      case 'compress': return <Archive className="w-4 h-4" />;
      case 'convert': return <ArrowLeftRight className="w-4 h-4" />;
      case 'background': return <Palette className="w-4 h-4" />;
      case 'adjustments': return <SlidersHorizontal className="w-4 h-4" />;
      case 'annotate': return <Type className="w-4 h-4" />;
      case 'rotate': return <RotateCw className="w-4 h-4" />;
      case 'preview': return <Eye className="w-4 h-4" />;
      case 'pdf_convert_images': return <FileImage className="w-4 h-4" />;
      case 'pdf_merge': return <Layers className="w-4 h-4" />;
      case 'pdf_split': return <Split className="w-4 h-4" />;
      case 'pdf_extract': return <Download className="w-4 h-4" />;
      case 'pdf_rotate': return <RotateCw className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  // State 1: Collapsed / Idle Floating Pill
  if (!isExpanded) {
    return (
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="w-[240px] h-[80px] select-none p-1.5 flex items-center justify-center overflow-hidden"
      >
        <div
          className={`w-full h-full rounded-2xl flex items-center justify-between px-3 py-2 transition-all duration-300 shadow-2xl backdrop-blur-xl border ${
            isDragOver
              ? 'bg-sky-500/25 border-sky-400 ring-2 ring-sky-400/50 scale-105 shadow-sky-500/30'
              : 'bg-white/95 dark:bg-slate-900/95 border-slate-200/90 dark:border-slate-700/80 shadow-slate-400/30 dark:shadow-black/70 hover:border-sky-400/70'
          }`}
        >
          {/* Drag Handle (Moves window around desktop) */}
          <div 
            style={{ WebkitAppRegion: 'drag' } as any}
            className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            title="Drag to move anywhere on desktop"
          >
            <GripVertical className="w-4 h-4" />
          </div>

          {/* Central Target Zone */}
          <div className="flex-1 flex items-center gap-2.5 px-1.5 min-w-0 pointer-events-none">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md transition-all ${
              isDragOver ? 'bg-sky-500 scale-110' : 'bg-gradient-to-tr from-sky-500 to-indigo-600'
            }`}>
              {isDragOver ? <UploadCloud className="w-5 h-5 animate-bounce" /> : <Wand2 className="w-4 h-4" />}
            </div>

            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                {isDragOver ? 'Release File Here' : 'Drop File Here'}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {isDragOver ? 'Inspect Quick Actions' : 'Radial Quick Tools'}
              </p>
            </div>
          </div>

          {/* Quick Controls */}
          <div style={{ WebkitAppRegion: 'no-drag' } as any} className="flex items-center gap-1">
            <button
              onClick={() => handleOpenStudio()}
              className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Open Universal File Toolkit Studio"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => window.electronAPI?.hideFloatingWidget()}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
              title="Hide to Windows System Tray"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // State 2: Expanded Radial Action Menu (580px x 580px)
  return (
    <div 
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="w-[580px] h-[580px] relative flex items-center justify-center select-none overflow-hidden"
    >
      {/* Top Floating Controls */}
      <div 
        style={{ WebkitAppRegion: 'no-drag' } as any} 
        className="absolute top-4 inset-x-8 z-40 flex items-center justify-between"
      >
        <div 
          style={{ WebkitAppRegion: 'drag' } as any}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 shadow-lg text-[11px] font-semibold text-slate-700 dark:text-slate-300 backdrop-blur-md cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-3 h-3 text-slate-400" />
          <span>Quick Actions</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenStudio()}
            className="px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 hover:bg-sky-50 dark:hover:bg-sky-950/50 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-1.5 transition-all shadow-md backdrop-blur-md"
            title="Open in Full Application Studio"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Studio</span>
          </button>

          <button
            onClick={handleCollapse}
            className="p-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 hover:bg-rose-50 dark:hover:bg-rose-500/20 text-slate-500 dark:text-slate-400 hover:text-rose-500 border border-slate-200 dark:border-slate-700 transition-all shadow-md backdrop-blur-md"
            title="Close Menu (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Orbit Rings Decoration */}
      <svg className="absolute w-[540px] h-[540px] pointer-events-none">
        <circle
          cx="270"
          cy="270"
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-slate-300 dark:text-slate-700/70"
          strokeWidth="1.5"
          strokeDasharray="4 6"
        />
        <circle
          cx="270"
          cy="270"
          r={radius - 35}
          fill="none"
          stroke="currentColor"
          className="text-slate-200 dark:text-slate-800"
          strokeWidth="1"
        />
      </svg>

      {/* Central File Information Hub */}
      <div className="z-20 relative flex flex-col items-center justify-center">
        <div className="w-60 p-4 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700/80 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center transition-all duration-300">
          {/* File Thumbnail Preview */}
          <div className="relative w-24 h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center overflow-hidden mb-2.5 shadow-inner">
            {activeFile?.thumbnailData ? (
              <img
                src={activeFile.thumbnailData}
                alt={activeFile.name}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : activeFile?.category === 'pdf' ? (
              <FileText className="w-10 h-10 text-rose-500" />
            ) : (
              <FileImage className="w-10 h-10 text-sky-500" />
            )}

            <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-white/90 dark:bg-slate-900/90 text-sky-600 dark:text-sky-400 border border-slate-200 dark:border-slate-700 shadow-sm">
              {activeFile?.extension.replace('.', '')}
            </span>
          </div>

          {/* Filename */}
          <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[200px] mb-0.5" title={activeFile?.name}>
            {activeFile?.name}
          </h3>

          {/* Dimensions & Size */}
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 mb-2.5">
            <span>{activeFile?.formattedSize}</span>
            {activeFile?.dimensions && (
              <>
                <span>•</span>
                <span>{activeFile.dimensions.width}×{activeFile.dimensions.height}</span>
              </>
            )}
            {activeFile?.pageCount && (
              <>
                <span>•</span>
                <span>{activeFile.pageCount} pgs</span>
              </>
            )}
          </div>

          {/* Quick Result Feedback or Hovered Action */}
          {quickResult ? (
            <div className="w-full py-1.5 px-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold flex items-center justify-between">
              <div className="flex items-center gap-1.5 truncate">
                <Check className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">Saved beside original</span>
              </div>
              <button
                onClick={handleOpenFolder}
                className="text-[10px] underline ml-1 font-bold flex-shrink-0"
              >
                Reveal
              </button>
            </div>
          ) : (
            <div className="w-full min-h-[38px] flex flex-col items-center justify-center py-1 px-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/40 text-[11px]">
              {hoveredAction ? (
                <div className="animate-fade-in text-center">
                  <p className="font-semibold text-sky-600 dark:text-sky-400 text-xs">{hoveredAction.label}</p>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 truncate max-w-[190px]">
                    {hoveredAction.description}
                  </p>
                </div>
              ) : (
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Select an operation to open
                </p>
              )}
            </div>
          )}

          {/* Quick 1-Click Convert Buttons for Images */}
          {activeFile?.category === 'image' && (
            <div className="w-full flex items-center justify-center gap-1.5 pt-2 mt-1 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => handleQuickConvert('webp')}
                disabled={isProcessing}
                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-sky-500 hover:text-white dark:bg-slate-800 dark:hover:bg-sky-500 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                title="Instant 1-click convert to modern WebP"
              >
                + WebP
              </button>
              <button
                onClick={() => handleQuickConvert('png')}
                disabled={isProcessing}
                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-sky-500 hover:text-white dark:bg-slate-800 dark:hover:bg-sky-500 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                title="Instant 1-click convert to PNG"
              >
                + PNG
              </button>
              <button
                onClick={() => handleQuickConvert('pdf')}
                disabled={isProcessing}
                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-rose-500 hover:text-white dark:bg-slate-800 dark:hover:bg-rose-500 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                title="Instant 1-click convert to PDF"
              >
                + PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Orbiting Radial Action Buttons */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {actions.map((action, index) => {
          const total = actions.length;
          const angleDeg = (360 / total) * index - 90;
          const angleRad = (angleDeg * Math.PI) / 180;
          const x = Math.round(radius * Math.cos(angleRad));
          const y = Math.round(radius * Math.sin(angleRad));

          const isHovered = hoveredAction?.id === action.id;

          return (
            <div
              key={action.id}
              style={{
                transform: `translate(${x}px, ${y}px)`,
              }}
              className="absolute pointer-events-auto transition-transform duration-200"
            >
              <button
                onClick={() => handleOpenStudio(action.id)}
                onMouseEnter={() => setHoveredAction(action)}
                onMouseLeave={() => setHoveredAction(null)}
                className={`group relative flex items-center gap-2 p-2.5 rounded-2xl border transition-all duration-200 shadow-xl active:scale-95 ${
                  isHovered
                    ? 'scale-115 z-30 bg-white dark:bg-slate-800 border-sky-400 shadow-2xl shadow-sky-500/25'
                    : 'bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-slate-700/80 hover:border-sky-400 text-slate-700 dark:text-slate-300 shadow-slate-300/60 dark:shadow-black/70'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${action.color} flex items-center justify-center text-white shadow-md flex-shrink-0 group-hover:scale-105 transition-transform`}>
                  {renderIcon(action.iconName)}
                </div>

                <div className="flex flex-col text-left pr-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-300 transition-colors">
                    {action.label}
                  </span>
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 max-w-[75px] truncate">
                    {action.badge || 'Tool'}
                  </span>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FloatingWidget;
