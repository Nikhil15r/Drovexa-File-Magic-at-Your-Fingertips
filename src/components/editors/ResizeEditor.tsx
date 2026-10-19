import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useAppStore } from '../../store/useAppStore';
import { Scaling, Lock, Unlock, Check, Sparkles } from 'lucide-react';

export const ResizeEditor: React.FC = () => {
  const store = useAppStore();
  const file = store.activeFile;
  const isOpen = store.activeModal === 'resize';

  const origW = file?.dimensions?.width || 1920;
  const origH = file?.dimensions?.height || 1080;

  const [width, setWidth] = useState<number>(origW);
  const [height, setHeight] = useState<number>(origH);
  const [lockRatio, setLockRatio] = useState<boolean>(true);
  const [fit, setFit] = useState<'inside' | 'cover' | 'fill'>('inside');

  useEffect(() => {
    if (file?.dimensions) {
      setWidth(file.dimensions.width);
      setHeight(file.dimensions.height);
    }
  }, [file]);

  const handleWidthChange = (newW: number) => {
    setWidth(newW);
    if (lockRatio && origW > 0) {
      const calculatedH = Math.round((newW / origW) * origH);
      setHeight(calculatedH);
    }
  };

  const handleHeightChange = (newH: number) => {
    setHeight(newH);
    if (lockRatio && origH > 0) {
      const calculatedW = Math.round((newH / origH) * origW);
      setWidth(calculatedW);
    }
  };

  const handleScalePercentage = (pct: number) => {
    const newW = Math.round((origW * pct) / 100);
    const newH = Math.round((origH * pct) / 100);
    setWidth(newW);
    setHeight(newH);
  };

  const handleApplyPreset = (targetW: number, targetH: number) => {
    setWidth(targetW);
    setHeight(targetH);
  };

  const handleApplyResize = async () => {
    if (!file || !window.electronAPI) return;

    store.setProcessing(true, 'Resizing image...');
    try {
      const result = await window.electronAPI.resizeImage(file.path, {
        width,
        height,
        maintainAspectRatio: lockRatio,
        fit,
      });

      if (result.success && result.outputPath) {
        store.showToast(`Resized to ${width}×${height} px (${result.formattedOutputSize})`, 'success', {
          label: 'Show in Explorer',
          onClick: () => window.electronAPI.showItemInFolder(result.outputPath!),
        });
        store.setActiveModal(null);
        const newMeta = await window.electronAPI.getFileMetadata(result.outputPath);
        store.setActiveFile(newMeta);
      } else {
        store.showToast(`Resize failed: ${result.error}`, 'error');
      }
    } catch (err: any) {
      store.showToast(`Resize error: ${err.message}`, 'error');
    } finally {
      store.setProcessing(false);
    }
  };

  if (!file) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => store.setActiveModal(null)}
      title="Resize Image"
      subtitle={`Change resolution and scale while preserving sharpness. Original: ${origW} × ${origH} px`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Dimensions Input Card */}
        <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-4">
          <div className="flex-1">
            <label className="text-xs font-semibold text-slate-400 block mb-1.5">Width (px)</label>
            <input
              type="number"
              min="1"
              max="16000"
              value={width}
              onChange={(e) => handleWidthChange(Math.max(1, Number(e.target.value)))}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-base focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Aspect Ratio Lock Button */}
          <div className="flex flex-col items-center pt-5">
            <button
              onClick={() => setLockRatio(!lockRatio)}
              className={`p-2.5 rounded-xl border transition-all ${
                lockRatio 
                  ? 'bg-sky-500/20 border-sky-400 text-sky-400' 
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title={lockRatio ? 'Aspect ratio locked' : 'Aspect ratio unlocked'}
            >
              {lockRatio ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex-1">
            <label className="text-xs font-semibold text-slate-400 block mb-1.5">Height (px)</label>
            <input
              type="number"
              min="1"
              max="16000"
              value={height}
              onChange={(e) => handleHeightChange(Math.max(1, Number(e.target.value)))}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-base focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Quick Percentage Scaling */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Quick Scale
          </label>
          <div className="grid grid-cols-5 gap-2">
            {[25, 50, 75, 150, 200].map((pct) => (
              <button
                key={pct}
                onClick={() => handleScalePercentage(pct)}
                className="py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>

        {/* Common Preset Dimensions */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Standard Presets
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { label: 'Instagram Square', w: 1080, h: 1080 },
              { label: 'YouTube 720p', w: 1280, h: 720 },
              { label: 'Full HD 1080p', w: 1920, h: 1080 },
              { label: '4K UHD', w: 3840, h: 2160 },
              { label: 'App Icon / Avatar', w: 512, h: 512 },
              { label: 'Social Story', w: 1080, h: 1920 },
            ].map((p) => (
              <button
                key={p.label}
                onClick={() => handleApplyPreset(p.w, p.h)}
                className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-700/80 border border-slate-700/80 text-left transition-all"
              >
                <div className="text-xs font-semibold text-white">{p.label}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">{p.w} × {p.h} px</div>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={() => store.setActiveModal(null)}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApplyResize}
            disabled={store.isProcessing}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-sky-500/25 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{store.isProcessing ? 'Resizing...' : `Apply Resize (${width} × ${height})`}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
