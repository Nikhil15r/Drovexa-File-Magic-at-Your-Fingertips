import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useAppStore } from '../../store/useAppStore';
import { Archive, Check, Sparkles, ArrowRight, Zap } from 'lucide-react';

export const CompressEditor: React.FC = () => {
  const store = useAppStore();
  const file = store.activeFile;
  const isOpen = store.activeModal === 'compress';

  const [quality, setQuality] = useState<number>(80);
  const [format, setFormat] = useState<'original' | 'webp' | 'jpeg' | 'avif'>('original');
  const [lossless, setLossless] = useState<boolean>(false);
  const [estimatedSize, setEstimatedSize] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isEstimating, setIsEstimating] = useState<boolean>(false);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  useEffect(() => {
    if (!file || !isOpen || !window.electronAPI) return;

    let isMounted = true;
    const timeout = setTimeout(async () => {
      setIsEstimating(true);
      try {
        const preview = await window.electronAPI.getCompressedPreview(file.path, {
          quality,
          format,
          lossless,
        });
        if (isMounted) {
          setEstimatedSize(preview.estimatedSize);
          setPreviewUrl(preview.dataUrl);
        }
      } catch (err) {
        console.warn('Could not generate compress preview:', err);
      } finally {
        if (isMounted) setIsEstimating(false);
      }
    }, 180);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [file, quality, format, lossless, isOpen]);

  const handleApplyCompress = async () => {
    if (!file || !window.electronAPI) return;

    store.setProcessing(true, 'Compressing image...');
    try {
      const result = await window.electronAPI.compressImage(file.path, {
        quality,
        format,
        lossless,
      });

      if (result.success && result.outputPath) {
        store.showToast(`Compressed image saved: ${result.formattedOutputSize}`, 'success', {
          label: 'Show in Explorer',
          onClick: () => window.electronAPI.showItemInFolder(result.outputPath!),
        });
        store.setActiveModal(null);
        const newMeta = await window.electronAPI.getFileMetadata(result.outputPath);
        store.setActiveFile(newMeta);
      } else {
        store.showToast(`Compression failed: ${result.error}`, 'error');
      }
    } catch (err: any) {
      store.showToast(`Error: ${err.message}`, 'error');
    } finally {
      store.setProcessing(false);
    }
  };

  if (!file) return null;

  const originalSize = file.size;
  const reductionPct = estimatedSize
    ? Math.round(((originalSize - estimatedSize) / originalSize) * 100)
    : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => store.setActiveModal(null)}
      title="Compress & Optimize Image"
      subtitle="Reduce file size for web, email, and fast storage without visible quality loss."
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6">
        {/* Comparison Stats Card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">Original Size</span>
            <span className="text-lg font-bold text-slate-200">{file.formattedSize}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">
              Estimated Output
            </span>
            <span className="text-lg font-bold text-sky-400">
              {isEstimating ? 'Estimating...' : estimatedSize ? formatBytes(estimatedSize) : 'Calculating...'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-center">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">Space Saved</span>
            {reductionPct !== null ? (
              <span className={`text-lg font-bold ${reductionPct > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                {reductionPct > 0 ? `-${reductionPct}% Reduction` : 'No size change'}
              </span>
            ) : (
              <span className="text-sm text-slate-500">...</span>
            )}
          </div>
        </div>

        {/* Quality Slider */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-white block">Image Quality</span>
              <span className="text-xs text-slate-400">Balance file size and fidelity</span>
            </div>
            <span className="text-lg font-extrabold text-sky-400 font-mono px-3 py-1 rounded-xl bg-sky-500/10 border border-sky-500/20">
              {quality}%
            </span>
          </div>

          <input
            type="range"
            min="10"
            max="100"
            value={quality}
            onChange={(e) => setQuality(Number(e.target.value))}
            className="w-full accent-sky-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />

          <div className="flex justify-between text-[11px] font-semibold text-slate-500">
            <span>Smallest File (10%)</span>
            <span>Balanced (75%)</span>
            <span>Visually Lossless (90%)</span>
            <span>Maximum (100%)</span>
          </div>
        </div>

        {/* Target Format Options */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Target Compression Format
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: 'original', label: 'Keep Original', desc: file.extension.toUpperCase() },
              { id: 'webp', label: 'Convert to WebP', desc: 'Superior web compression' },
              { id: 'jpeg', label: 'Convert to JPEG', desc: 'Universal compatibility' },
              { id: 'avif', label: 'Convert to AVIF', desc: 'Next-gen compact format' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFormat(f.id as any)}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  format === f.id
                    ? 'bg-sky-500/15 border-sky-400 text-white shadow-md shadow-sky-500/10'
                    : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="text-xs font-bold">{f.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{f.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Live Preview Comparison Image */}
        {previewUrl && (
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col items-center">
            <span className="text-[11px] font-semibold text-slate-400 mb-2">Compressed Live Preview</span>
            <img
              src={previewUrl}
              alt="Compressed preview"
              className="max-h-48 object-contain rounded-lg shadow-lg"
            />
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={() => store.setActiveModal(null)}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApplyCompress}
            disabled={store.isProcessing}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs shadow-lg shadow-amber-500/25 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{store.isProcessing ? 'Optimizing...' : 'Save Compressed File'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
