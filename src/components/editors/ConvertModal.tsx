import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useAppStore } from '../../store/useAppStore';
import { ArrowLeftRight, Check, Sparkles, FileText, FileImage } from 'lucide-react';

export const ConvertModal: React.FC = () => {
  const store = useAppStore();
  const file = store.activeFile;
  const isOpen = store.activeModal === 'convert';

  const [targetFormat, setTargetFormat] = useState<string>('png');
  const [quality, setQuality] = useState<number>(90);

  const formats = [
    { id: 'png', name: 'PNG', badge: 'Lossless', desc: 'Transparent backgrounds & clean graphics', icon: FileImage },
    { id: 'jpeg', name: 'JPG / JPEG', badge: 'Popular', desc: 'Universal compatibility & small photo size', icon: FileImage },
    { id: 'webp', name: 'WebP', badge: 'Next-Gen', desc: '30% smaller than JPG with identical quality', icon: FileImage },
    { id: 'pdf', name: 'PDF Document', badge: 'Document', desc: 'Embeds into standard vector printable PDF', icon: FileText },
    { id: 'avif', name: 'AVIF', badge: 'Modern', desc: 'Ultra-efficient modern web compression', icon: FileImage },
    { id: 'ico', name: 'ICO', badge: 'Windows', desc: 'Windows desktop executable & app icon file', icon: FileImage },
    { id: 'tiff', name: 'TIFF', badge: 'Archival', desc: 'High-fidelity uncompressed print standard', icon: FileImage },
    { id: 'bmp', name: 'BMP', badge: 'Bitmap', desc: 'Standard uncompressed Windows bitmap', icon: FileImage },
  ];

  const handleConvert = async () => {
    if (!file || !window.electronAPI) return;

    store.setProcessing(true, `Converting to ${targetFormat.toUpperCase()}...`);
    try {
      const result = await window.electronAPI.convertImage(file.path, {
        targetFormat: targetFormat as any,
        quality,
      });

      if (result.success && result.outputPath) {
        store.showToast(`Converted to ${targetFormat.toUpperCase()} (${result.formattedOutputSize})`, 'success', {
          label: 'Show in Explorer',
          onClick: () => window.electronAPI.showItemInFolder(result.outputPath!),
        });
        store.setActiveModal(null);
        const newMeta = await window.electronAPI.getFileMetadata(result.outputPath);
        store.setActiveFile(newMeta);
      } else {
        store.showToast(`Conversion failed: ${result.error}`, 'error');
      }
    } catch (err: any) {
      store.showToast(`Error: ${err.message}`, 'error');
    } finally {
      store.setProcessing(false);
    }
  };

  if (!file) return null;

  const currentExt = file.extension.replace('.', '').toLowerCase();

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => store.setActiveModal(null)}
      title="Convert File Format"
      subtitle={`Transform ${file.name} into another format with full color fidelity.`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6">
        {/* Source file info bar */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-sky-400 font-bold uppercase text-xs">
              {currentExt}
            </div>
            <div>
              <p className="text-sm font-bold text-white truncate max-w-sm">{file.name}</p>
              <p className="text-xs text-slate-400">{file.formattedSize}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Converting to:</span>
            <span className="px-3 py-1 rounded-xl bg-purple-500/20 text-purple-300 font-extrabold uppercase text-xs border border-purple-500/30">
              .{targetFormat}
            </span>
          </div>
        </div>

        {/* Format Grid */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
            Select Target Format
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {formats.map((fmt) => {
              const Icon = fmt.icon;
              const isSelected = targetFormat === fmt.id;
              return (
                <button
                  key={fmt.id}
                  onClick={() => setTargetFormat(fmt.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-purple-500/15 border-purple-400 shadow-xl shadow-purple-500/10'
                      : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-white">{fmt.name}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-purple-400 text-purple-950' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {fmt.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    {fmt.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quality slider for lossy formats */}
        {['jpeg', 'webp', 'avif'].includes(targetFormat) && (
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300">Conversion Quality</span>
              <span className="font-mono font-bold text-purple-400">{quality}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="w-full accent-purple-400 cursor-pointer"
            />
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={() => store.setActiveModal(null)}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConvert}
            disabled={store.isProcessing}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-500/25 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>{store.isProcessing ? 'Converting...' : `Convert to .${targetFormat.toUpperCase()}`}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
