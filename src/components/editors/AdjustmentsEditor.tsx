import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useAppStore } from '../../store/useAppStore';
import { SlidersHorizontal, Check, RotateCcw, Sparkles } from 'lucide-react';
import { AdjustmentsOptions } from '../../types';

export const AdjustmentsEditor: React.FC = () => {
  const store = useAppStore();
  const file = store.activeFile;
  const isOpen = store.activeModal === 'adjustments';

  const defaultAdjustments: AdjustmentsOptions = {
    brightness: 0,
    contrast: 0,
    saturation: 0,
    hue: 0,
    blur: 0,
    sharpen: 0,
    greyscale: false,
    sepia: false,
    invert: false,
  };

  const [options, setOptions] = useState<AdjustmentsOptions>(defaultAdjustments);

  const handleReset = () => {
    setOptions(defaultAdjustments);
  };

  const handleApply = async () => {
    if (!file || !window.electronAPI) return;

    store.setProcessing(true, 'Applying color adjustments...');
    try {
      const result = await window.electronAPI.applyAdjustments(file.path, options);

      if (result.success && result.outputPath) {
        store.showToast('Adjustments applied successfully!', 'success', {
          label: 'Show in Explorer',
          onClick: () => window.electronAPI.showItemInFolder(result.outputPath!),
        });
        store.setActiveModal(null);
        const newMeta = await window.electronAPI.getFileMetadata(result.outputPath);
        store.setActiveFile(newMeta);
      } else {
        store.showToast(`Failed: ${result.error}`, 'error');
      }
    } catch (err: any) {
      store.showToast(`Error: ${err.message}`, 'error');
    } finally {
      store.setProcessing(false);
    }
  };

  if (!file) return null;

  // Build live CSS filter string
  const cssFilter = `
    brightness(${Math.max(0.1, 1 + options.brightness / 100)})
    contrast(${Math.max(0.1, 1 + options.contrast / 100)})
    saturate(${Math.max(0, 1 + options.saturation / 100)})
    hue-rotate(${options.hue}deg)
    blur(${options.blur}px)
    ${options.greyscale ? 'grayscale(100%)' : ''}
    ${options.sepia ? 'sepia(100%)' : ''}
    ${options.invert ? 'invert(100%)' : ''}
  `;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => store.setActiveModal(null)}
      title="Image Adjustments & Filters"
      subtitle="Refine lighting, contrast, saturation, sharpness and artistic color effects."
      maxWidth="max-w-5xl"
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Live Image Preview */}
        <div className="flex-1 min-h-[380px] max-h-[500px] bg-slate-950/80 rounded-2xl border border-slate-800 p-6 flex items-center justify-center overflow-hidden">
          {file.thumbnailData && (
            <img
              src={file.thumbnailData}
              alt=""
              style={{ filter: cssFilter }}
              className="max-h-[420px] max-w-full object-contain rounded-lg shadow-2xl transition-all duration-75"
            />
          )}
        </div>

        {/* Sidebar Sliders */}
        <div className="w-full lg:w-80 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Controls</span>
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-sky-400 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset All</span>
            </button>
          </div>

          {/* Brightness */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Brightness</span>
              <span className="font-mono text-slate-200">{options.brightness > 0 ? `+${options.brightness}` : options.brightness}</span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              value={options.brightness}
              onChange={(e) => setOptions({ ...options, brightness: Number(e.target.value) })}
              className="w-full accent-orange-400 cursor-pointer"
            />
          </div>

          {/* Contrast */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Contrast</span>
              <span className="font-mono text-slate-200">{options.contrast > 0 ? `+${options.contrast}` : options.contrast}</span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              value={options.contrast}
              onChange={(e) => setOptions({ ...options, contrast: Number(e.target.value) })}
              className="w-full accent-orange-400 cursor-pointer"
            />
          </div>

          {/* Saturation */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Saturation</span>
              <span className="font-mono text-slate-200">{options.saturation > 0 ? `+${options.saturation}` : options.saturation}</span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              value={options.saturation}
              onChange={(e) => setOptions({ ...options, saturation: Number(e.target.value) })}
              className="w-full accent-orange-400 cursor-pointer"
            />
          </div>

          {/* Hue Rotation */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Hue Shift</span>
              <span className="font-mono text-slate-200">{options.hue}°</span>
            </div>
            <input
              type="range"
              min="-180"
              max="180"
              value={options.hue}
              onChange={(e) => setOptions({ ...options, hue: Number(e.target.value) })}
              className="w-full accent-orange-400 cursor-pointer"
            />
          </div>

          {/* Blur */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Blur</span>
              <span className="font-mono text-slate-200">{options.blur} px</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              value={options.blur}
              onChange={(e) => setOptions({ ...options, blur: Number(e.target.value) })}
              className="w-full accent-orange-400 cursor-pointer"
            />
          </div>

          {/* Sharpen */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Sharpen</span>
              <span className="font-mono text-slate-200">{options.sharpen}</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              value={options.sharpen}
              onChange={(e) => setOptions({ ...options, sharpen: Number(e.target.value) })}
              className="w-full accent-orange-400 cursor-pointer"
            />
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            {[
              { id: 'greyscale', label: 'B & W' },
              { id: 'sepia', label: 'Sepia' },
              { id: 'invert', label: 'Invert' },
            ].map((t) => {
              const active = (options as any)[t.id];
              return (
                <button
                  key={t.id}
                  onClick={() => setOptions({ ...options, [t.id]: !active })}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                    active
                      ? 'bg-orange-500/20 border-orange-400 text-orange-300'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <button
              onClick={handleApply}
              disabled={store.isProcessing}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-400 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{store.isProcessing ? 'Processing...' : 'Apply Adjustments'}</span>
            </button>
            <button
              onClick={() => store.setActiveModal(null)}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
