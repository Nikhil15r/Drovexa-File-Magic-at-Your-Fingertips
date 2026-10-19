import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useAppStore } from '../../store/useAppStore';
import { RotateCw, RotateCcw, FlipHorizontal, FlipVertical, Check, RefreshCw } from 'lucide-react';
import { RotateOptions } from '../../types';

export const RotateEditor: React.FC = () => {
  const store = useAppStore();
  const file = store.activeFile;
  const isOpen = store.activeModal === 'rotate';

  const [angle, setAngle] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);

  const handleRotateBy = (deg: number) => {
    setAngle((prev) => (prev + deg) % 360);
  };

  const handleReset = () => {
    setAngle(0);
    setFlipH(false);
    setFlipV(false);
  };

  const handleApply = async () => {
    if (!file || !window.electronAPI) return;

    store.setProcessing(true, 'Rotating and flipping image...');
    try {
      const options: RotateOptions = {
        angle,
        flipH,
        flipV,
      };

      const result = await window.electronAPI.rotateImage(file.path, options);

      if (result.success && result.outputPath) {
        store.showToast('Image orientation saved!', 'success', {
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => store.setActiveModal(null)}
      title="Rotate & Flip Image"
      subtitle="Reorient images with 90° increments, mirrors, or precise arbitrary angle tilts."
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6">
        {/* Live Image Preview with CSS Transform */}
        <div className="min-h-[340px] max-h-[420px] bg-slate-100/90 dark:bg-slate-950/80 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex items-center justify-center overflow-hidden">
          {file.thumbnailData && (
            <img
              src={file.thumbnailData}
              alt=""
              style={{
                transform: `rotate(${angle}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
              }}
              className="max-h-[300px] max-w-full object-contain rounded-lg shadow-2xl transition-transform duration-200"
            />
          )}
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => handleRotateBy(90)}
            className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex flex-col items-center gap-1.5 transition-colors shadow-sm"
          >
            <RotateCw className="w-5 h-5 text-sky-500 dark:text-sky-400" />
            <span className="text-xs font-semibold text-slate-800 dark:text-white">+90° Clockwise</span>
          </button>

          <button
            onClick={() => handleRotateBy(-90)}
            className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex flex-col items-center gap-1.5 transition-colors shadow-sm"
          >
            <RotateCcw className="w-5 h-5 text-sky-500 dark:text-sky-400" />
            <span className="text-xs font-semibold text-slate-800 dark:text-white">-90° Counter</span>
          </button>

          <button
            onClick={() => setFlipH(!flipH)}
            className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all shadow-sm ${
              flipH 
                ? 'bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-300' 
                : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <FlipHorizontal className="w-5 h-5 text-rose-500 dark:text-rose-400" />
            <span className="text-xs font-semibold">Flip Horizontal</span>
          </button>

          <button
            onClick={() => setFlipV(!flipV)}
            className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all shadow-sm ${
              flipV 
                ? 'bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-300' 
                : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <FlipVertical className="w-5 h-5 text-rose-500 dark:text-rose-400" />
            <span className="text-xs font-semibold">Flip Vertical</span>
          </button>
        </div>

        {/* Precise Angle Slider */}
        <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Arbitrary Angle</span>
            <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{angle}°</span>
          </div>
          <input
            type="range"
            min="-180"
            max="180"
            value={angle}
            onChange={(e) => setAngle(Number(e.target.value))}
            className="w-full accent-rose-500 cursor-pointer"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Reset
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => store.setActiveModal(null)}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={store.isProcessing}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-bold text-xs shadow-lg shadow-rose-500/25 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{store.isProcessing ? 'Saving...' : 'Save Orientation'}</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
