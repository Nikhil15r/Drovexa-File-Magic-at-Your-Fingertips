import React, { useState } from 'react';
import { 
  Crop, 
  Scaling, 
  Archive, 
  ArrowLeftRight, 
  Palette, 
  SlidersHorizontal, 
  Type, 
  RotateCw, 
  Eye, 
  FileText, 
  Split, 
  Layers, 
  FolderOpen, 
  X, 
  Info,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { RadialActionItem } from '../types';

export const RadialMenu: React.FC = () => {
  const store = useAppStore();
  const file = store.activeFile;

  const [hoveredAction, setHoveredAction] = useState<RadialActionItem | null>(null);

  if (!file) return null;

  const isImage = file.category === 'image';
  const isPdf = file.category === 'pdf';

  // Define radial menu actions based on category
  const imageActions: RadialActionItem[] = [
    {
      id: 'crop',
      label: 'Crop',
      description: 'Freeform or aspect ratio presets (1:1, 16:9, 4:3)',
      iconName: 'crop',
      color: 'from-emerald-500 to-teal-600',
      badge: 'C',
    },
    {
      id: 'resize',
      label: 'Resize',
      description: 'Custom dimensions, scale %, social media presets',
      iconName: 'resize',
      color: 'from-sky-500 to-blue-600',
      badge: 'R',
    },
    {
      id: 'compress',
      label: 'Compress',
      description: 'Optimize file size with live quality comparison',
      iconName: 'compress',
      color: 'from-amber-500 to-orange-600',
      badge: 'Q',
    },
    {
      id: 'convert',
      label: 'Convert',
      description: 'Export to PNG, JPG, WEBP, AVIF, TIFF, ICO, PDF',
      iconName: 'convert',
      color: 'from-purple-500 to-indigo-600',
      badge: 'X',
    },
    {
      id: 'background',
      label: 'Background',
      description: 'Solid colors, gradients, padding, rounded corners & shadow',
      iconName: 'background',
      color: 'from-fuchsia-500 to-pink-600',
      badge: 'B',
    },
    {
      id: 'adjustments',
      label: 'Adjust',
      description: 'Brightness, contrast, saturation, blur, sharpen & filters',
      iconName: 'adjustments',
      color: 'from-orange-500 to-rose-600',
      badge: 'A',
    },
    {
      id: 'annotate',
      label: 'Annotate',
      description: 'Add text captions, badges, and customizable watermarks',
      iconName: 'annotate',
      color: 'from-indigo-500 to-cyan-600',
      badge: 'T',
    },
    {
      id: 'rotate',
      label: 'Rotate & Flip',
      description: 'Rotate 90°, 180°, horizontal & vertical flips, angles',
      iconName: 'rotate',
      color: 'from-rose-500 to-red-600',
      badge: 'F',
    },
  ];

  const pdfActions: RadialActionItem[] = [
    {
      id: 'pdf_preview',
      label: 'Preview',
      description: 'Interactive page viewer and navigation',
      iconName: 'preview',
      color: 'from-sky-500 to-blue-600',
      badge: 'P',
    },
    {
      id: 'pdf_convert_images',
      label: 'To Images',
      description: 'Extract PDF pages as high-resolution PNG / JPG',
      iconName: 'pdf_convert_images',
      color: 'from-purple-500 to-indigo-600',
      badge: 'I',
    },
    {
      id: 'pdf_merge',
      label: 'Merge PDFs',
      description: 'Combine multiple PDF documents into a single file',
      iconName: 'pdf_merge',
      color: 'from-emerald-500 to-teal-600',
      badge: 'M',
    },
    {
      id: 'pdf_split',
      label: 'Split PDF',
      description: 'Split into individual pages or custom page ranges',
      iconName: 'pdf_split',
      color: 'from-amber-500 to-orange-600',
      badge: 'S',
    },
    {
      id: 'pdf_extract',
      label: 'Extract Pages',
      description: 'Extract specific pages into a new clean document',
      iconName: 'pdf_extract',
      color: 'from-blue-500 to-cyan-600',
      badge: 'E',
    },
    {
      id: 'pdf_rotate',
      label: 'Rotate Pages',
      description: 'Rotate individual or all pages in the PDF',
      iconName: 'pdf_rotate',
      color: 'from-rose-500 to-pink-600',
      badge: 'R',
    },
  ];

  const actions = isImage ? imageActions : isPdf ? pdfActions : imageActions;
  const radius = isImage ? 230 : 210;

  const renderIcon = (name: string, className = 'w-5 h-5') => {
    switch (name) {
      case 'crop': return <Crop className={className} />;
      case 'resize': return <Scaling className={className} />;
      case 'compress': return <Archive className={className} />;
      case 'convert': return <ArrowLeftRight className={className} />;
      case 'background': return <Palette className={className} />;
      case 'adjustments': return <SlidersHorizontal className={className} />;
      case 'annotate': return <Type className={className} />;
      case 'rotate': return <RotateCw className={className} />;
      case 'preview': return <Eye className={className} />;
      case 'pdf_convert_images': return <FileText className={className} />;
      case 'pdf_merge': return <Layers className={className} />;
      case 'pdf_split': return <Split className={className} />;
      case 'pdf_extract': return <FileText className={className} />;
      case 'pdf_rotate': return <RotateCw className={className} />;
      default: return <Sparkles className={className} />;
    }
  };

  const handleActionClick = (actionId: string) => {
    store.setActiveModal(actionId);
  };

  const handleCloseActiveFile = () => {
    store.setActiveFile(null);
  };

  const handleRevealInExplorer = () => {
    if (file && window.electronAPI) {
      window.electronAPI.showItemInFolder(file.path);
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-3rem)] flex items-center justify-center overflow-hidden bg-gradient-to-b from-slate-50 via-sky-50/20 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-200">
      {/* Decorative ambient background lights */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
        <div className="w-[600px] h-[600px] rounded-full bg-sky-500/10 blur-[140px] pointer-events-none" />
        <div className="w-[450px] h-[450px] rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />
      </div>

      {/* Close file button / Top Right */}
      <div className="absolute top-6 right-6 z-30 flex items-center gap-2">
        <button
          onClick={handleRevealInExplorer}
          className="px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-all shadow-md"
          title="Show original in Windows Explorer"
        >
          <FolderOpen className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
          <span>Show in Folder</span>
        </button>

        <button
          onClick={handleCloseActiveFile}
          className="p-2 rounded-xl bg-white/90 dark:bg-slate-800/80 hover:bg-rose-50 dark:hover:bg-rose-500/20 hover:text-rose-500 dark:hover:text-rose-300 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 transition-all shadow-md"
          title="Close file & choose another"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Orbit ring SVG decoration */}
      <svg className="absolute w-[600px] h-[600px] pointer-events-none">
        <circle
          cx="300"
          cy="300"
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-slate-300 dark:text-slate-700/60"
          strokeWidth="1.5"
          strokeDasharray="4 6"
        />
        <circle
          cx="300"
          cy="300"
          r={radius - 40}
          fill="none"
          stroke="currentColor"
          className="text-slate-200 dark:text-slate-800"
          strokeWidth="1"
        />
      </svg>

      {/* Central File Preview Hub */}
      <div className="z-20 relative flex flex-col items-center justify-center">
        <div className="w-64 p-5 rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 shadow-2xl shadow-slate-300/60 dark:shadow-2xl backdrop-blur-xl flex flex-col items-center text-center transition-all duration-300 hover:border-sky-400 dark:hover:border-sky-500/50 hover:shadow-sky-500/10">
          {/* File Thumbnail or Icon Preview */}
          <div className="relative w-28 h-28 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center overflow-hidden mb-3 shadow-inner">
            {file.thumbnailData ? (
              <img
                src={file.thumbnailData}
                alt={file.name}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : file.category === 'pdf' ? (
              <FileText className="w-12 h-12 text-rose-500" />
            ) : (
              <Info className="w-12 h-12 text-sky-500" />
            )}

            {/* Extension pill */}
            <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-white/90 dark:bg-slate-900/90 text-sky-600 dark:text-sky-400 border border-slate-200 dark:border-slate-700 shadow-sm">
              {file.extension.replace('.', '')}
            </span>
          </div>

          {/* Filename */}
          <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[210px] mb-1" title={file.name}>
            {file.name}
          </h3>

          {/* Metadata: Dimensions & Size */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mb-3">
            <span>{file.formattedSize}</span>
            {file.dimensions && (
              <>
                <span>•</span>
                <span>{file.dimensions.width} × {file.dimensions.height}</span>
              </>
            )}
            {file.pageCount && (
              <>
                <span>•</span>
                <span>{file.pageCount} {file.pageCount === 1 ? 'page' : 'pages'}</span>
              </>
            )}
          </div>

          {/* Bottom active hovered action readout or helper */}
          <div className="w-full min-h-[46px] flex flex-col items-center justify-center py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/40 text-xs">
            {hoveredAction ? (
              <div className="animate-fade-in text-center">
                <p className="font-semibold text-sky-600 dark:text-sky-400 text-xs">{hoveredAction.label}</p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 truncate max-w-[190px]">
                  {hoveredAction.description}
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Click any action to begin
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Surrounding Radial Orbit Action Buttons */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {actions.map((action, index) => {
          const total = actions.length;
          // Distribute evenly around 360 degrees, starting at top (-90 deg)
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
                onClick={() => handleActionClick(action.id)}
                onMouseEnter={() => setHoveredAction(action)}
                onMouseLeave={() => setHoveredAction(null)}
                className={`group relative flex items-center gap-2.5 p-3 rounded-2xl border transition-all duration-200 shadow-xl active:scale-95 ${
                  isHovered
                    ? 'scale-115 z-30 bg-white dark:bg-slate-800/95 border-sky-400 shadow-2xl shadow-sky-500/25'
                    : 'bg-white/95 dark:bg-slate-900/90 border-slate-200 dark:border-slate-700/80 hover:border-sky-400 dark:hover:border-slate-500 text-slate-700 dark:text-slate-300 shadow-slate-200/60 dark:shadow-black/40'
                }`}
              >
                {/* Action Icon in Gradient Container */}
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${action.color} flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105`}
                >
                  {renderIcon(action.iconName)}
                </div>

                {/* Action Label */}
                <div className="flex flex-col text-left pr-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-300 transition-colors">
                    {action.label}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 max-w-[90px] truncate">
                    {action.label === 'Crop' ? 'Aspect Ratio' : action.label === 'Compress' ? 'Quality' : 'Quick tool'}
                  </span>
                </div>

                {/* Key badge indicator */}
                {action.badge && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 group-hover:border-sky-400 group-hover:text-sky-600 dark:group-hover:text-sky-300">
                    {action.badge}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
