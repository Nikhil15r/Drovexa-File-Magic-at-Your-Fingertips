import React from 'react';
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
  ArrowRight
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const RadialMenuAltGrid: React.FC = () => {
  const store = useAppStore();
  const file = store.activeFile;

  if (!file) return null;

  const isImage = file.category === 'image';
  const isPdf = file.category === 'pdf';

  const actions = isImage ? [
    { id: 'crop', label: 'Crop Tool', desc: 'Crop freely or lock aspect ratios (1:1, 16:9, 4:3)', icon: Crop, color: 'from-emerald-500 to-teal-600' },
    { id: 'resize', label: 'Resize & Scale', desc: 'Custom width & height, scale percentages, presets', icon: Scaling, color: 'from-sky-500 to-blue-600' },
    { id: 'compress', label: 'Compress Quality', desc: 'Reduce file size with live before/after size preview', icon: Archive, color: 'from-amber-500 to-orange-600' },
    { id: 'convert', label: 'Convert Format', desc: 'Export to PNG, JPG, WEBP, AVIF, TIFF, ICO, PDF', icon: ArrowLeftRight, color: 'from-purple-500 to-indigo-600' },
    { id: 'background', label: 'Background Studio', desc: 'Colors, gradients, padding, rounded corners & shadow', icon: Palette, color: 'from-fuchsia-500 to-pink-600' },
    { id: 'adjustments', label: 'Adjustments & Filters', desc: 'Brightness, contrast, saturation, hue, blur, sharpen', icon: SlidersHorizontal, color: 'from-orange-500 to-rose-600' },
    { id: 'annotate', label: 'Text & Watermark', desc: 'Add captions, typography, text overlays, copyright', icon: Type, color: 'from-indigo-500 to-cyan-600' },
    { id: 'rotate', label: 'Rotate & Flip', desc: 'Rotate 90°, 180°, horizontal and vertical flip', icon: RotateCw, color: 'from-rose-500 to-red-600' },
  ] : isPdf ? [
    { id: 'pdf_preview', label: 'Preview Document', desc: 'Interactive page viewer and pagination', icon: Eye, color: 'from-sky-500 to-blue-600' },
    { id: 'pdf_convert_images', label: 'Convert to Images', desc: 'Export high-resolution PNG or JPG pages', icon: FileText, color: 'from-purple-500 to-indigo-600' },
    { id: 'pdf_merge', label: 'Merge PDFs', desc: 'Combine multiple PDF documents into a single file', icon: Layers, color: 'from-emerald-500 to-teal-600' },
    { id: 'pdf_split', label: 'Split PDF', desc: 'Split into individual pages or custom ranges', icon: Split, color: 'from-amber-500 to-orange-600' },
    { id: 'pdf_extract', label: 'Extract Pages', desc: 'Extract specific pages into a new document', icon: FileText, color: 'from-blue-500 to-cyan-600' },
    { id: 'pdf_rotate', label: 'Rotate Pages', desc: 'Rotate individual or all pages in PDF', icon: RotateCw, color: 'from-rose-500 to-pink-600' },
  ] : [];

  const handleActionClick = (id: string) => {
    store.setActiveModal(id);
  };

  return (
    <div className="w-full h-[calc(100vh-3rem)] p-8 overflow-y-auto bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8 items-start">
        {/* Left Column: File Summary Card */}
        <div className="w-full md:w-80 flex-shrink-0 bg-slate-900/90 border border-slate-700/80 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-400">Selected File</span>
            <button
              onClick={() => store.setActiveFile(null)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="w-full h-48 rounded-2xl bg-slate-800/80 border border-slate-700/60 overflow-hidden mb-4 flex items-center justify-center">
            {file.thumbnailData ? (
              <img src={file.thumbnailData} alt={file.name} className="w-full h-full object-contain" />
            ) : (
              <FileText className="w-16 h-16 text-slate-500" />
            )}
          </div>

          <h3 className="text-base font-bold text-white truncate mb-1" title={file.name}>
            {file.name}
          </h3>
          <p className="text-xs text-slate-400 mb-4">{file.formattedSize}</p>

          {file.dimensions && (
            <div className="flex items-center justify-between py-2 border-t border-slate-800 text-xs">
              <span className="text-slate-400">Dimensions</span>
              <span className="font-semibold text-slate-200">{file.dimensions.width} × {file.dimensions.height} px</span>
            </div>
          )}

          <div className="flex items-center justify-between py-2 border-t border-slate-800 text-xs mb-4">
            <span className="text-slate-400">Format</span>
            <span className="font-semibold uppercase text-sky-400">{file.extension.replace('.', '')}</span>
          </div>

          <button
            onClick={() => window.electronAPI?.showItemInFolder(file.path)}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-xs flex items-center justify-center gap-2 transition-all"
          >
            <FolderOpen className="w-4 h-4 text-sky-400" />
            <span>Show in Windows Explorer</span>
          </button>
        </div>

        {/* Right Column: Action Cards Grid */}
        <div className="flex-1 w-full">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white">Available Operations</h2>
            <p className="text-xs text-slate-400">Choose a tool to perform instantaneous local processing</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {actions.map((act) => {
              const Icon = act.icon;
              return (
                <button
                  key={act.id}
                  onClick={() => handleActionClick(act.id)}
                  className="group flex items-start gap-4 p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-sky-500/50 text-left transition-all duration-200 shadow-lg hover:shadow-sky-500/10 active:scale-[0.98]"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${act.color} flex items-center justify-center text-white shadow-md flex-shrink-0 group-hover:scale-105 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors">
                        {act.label}
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {act.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
