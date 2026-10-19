import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useAppStore } from '../../store/useAppStore';
import { Crop, Check, RefreshCw } from 'lucide-react';

export const CropEditor: React.FC = () => {
  const store = useAppStore();
  const file = store.activeFile;
  const isOpen = store.activeModal === 'crop';

  const [aspectRatio, setAspectRatio] = useState<number | null>(null); // null = freeform
  const [cropBox, setCropBox] = useState({ x: 10, y: 10, width: 80, height: 80 }); // percentage based (0-100)
  const [imageSize, setImageSize] = useState({ width: 800, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (file?.dimensions) {
      setImageSize(file.dimensions);
      setCropBox({ x: 10, y: 10, width: 80, height: 80 });
    }
  }, [file]);

  const handleApplyPreset = (ratio: number | null) => {
    setAspectRatio(ratio);
    if (ratio === null) return;

    // Adjust crop box width/height to match aspect ratio
    const currentW = 80;
    const targetH = (currentW * (imageSize.width / imageSize.height)) / ratio;
    const clampedH = Math.min(80, Math.max(20, targetH));
    const clampedW = clampedH * ratio * (imageSize.height / imageSize.width);

    setCropBox({
      x: Math.max(0, (100 - clampedW) / 2),
      y: Math.max(0, (100 - clampedH) / 2),
      width: Math.min(100, clampedW),
      height: Math.min(100, clampedH),
    });
  };

  const handleApplyCrop = async () => {
    if (!file || !window.electronAPI) return;

    store.setProcessing(true, 'Cropping image with high precision...');
    try {
      const realX = (cropBox.x / 100) * imageSize.width;
      const realY = (cropBox.y / 100) * imageSize.height;
      const realW = (cropBox.width / 100) * imageSize.width;
      const realH = (cropBox.height / 100) * imageSize.height;

      const result = await window.electronAPI.cropImage(file.path, {
        x: realX,
        y: realY,
        width: realW,
        height: realH,
      });

      if (result.success && result.outputPath) {
        store.showToast(`Saved cropped image: ${result.formattedOutputSize}`, 'success', {
          label: 'Show in Explorer',
          onClick: () => window.electronAPI.showItemInFolder(result.outputPath!),
        });
        store.setActiveModal(null);
        // Refresh active file to cropped result
        const newMeta = await window.electronAPI.getFileMetadata(result.outputPath);
        store.setActiveFile(newMeta);
      } else {
        store.showToast(`Crop failed: ${result.error}`, 'error');
      }
    } catch (err: any) {
      store.showToast(`Crop error: ${err.message}`, 'error');
    } finally {
      store.setProcessing(false);
    }
  };

  if (!file) return null;

  const pixelCropW = Math.round((cropBox.width / 100) * imageSize.width);
  const pixelCropH = Math.round((cropBox.height / 100) * imageSize.height);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => store.setActiveModal(null)}
      title="Crop Image"
      subtitle={`Adjust the crop frame to trim and reframe. Source: ${imageSize.width} × ${imageSize.height} px`}
      maxWidth="max-w-5xl"
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Crop Canvas Area */}
        <div 
          ref={containerRef}
          className="flex-1 relative min-h-[420px] max-h-[520px] bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center justify-center p-4 overflow-hidden select-none"
        >
          {file.thumbnailData && (
            <div className="relative max-h-full max-w-full">
              <img
                src={file.thumbnailData}
                alt="Crop preview"
                className="max-h-[460px] max-w-full object-contain rounded-lg shadow-2xl pointer-events-none"
              />

              {/* Crop box overlay */}
              <div
                style={{
                  left: `${cropBox.x}%`,
                  top: `${cropBox.y}%`,
                  width: `${cropBox.width}%`,
                  height: `${cropBox.height}%`,
                }}
                className="absolute border-2 border-sky-400 bg-sky-500/10 shadow-2xl rounded-sm cursor-move pointer-events-auto"
              >
                {/* 3x3 Grid lines */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                  <div className="border-r border-b border-sky-400/30" />
                  <div className="border-r border-b border-sky-400/30" />
                  <div className="border-b border-sky-400/30" />
                  <div className="border-r border-b border-sky-400/30" />
                  <div className="border-r border-b border-sky-400/30" />
                  <div className="border-b border-sky-400/30" />
                  <div className="border-r border-sky-400/30" />
                  <div className="border-r border-sky-400/30" />
                  <div />
                </div>

                {/* Pixel readout badge */}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-900/90 text-[10px] font-mono text-sky-300 border border-sky-500/40 pointer-events-none shadow">
                  {pixelCropW} × {pixelCropH} px
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Controls */}
        <div className="w-full lg:w-72 flex flex-col justify-between space-y-6">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Aspect Ratio Presets
            </h4>

            <div className="grid grid-cols-2 gap-2 mb-6">
              {[
                { label: 'Freeform', ratio: null },
                { label: '1:1 Square', ratio: 1 },
                { label: '16:9 Cinema', ratio: 16 / 9 },
                { label: '4:3 Standard', ratio: 4 / 3 },
                { label: '9:16 Story', ratio: 9 / 16 },
                { label: '3:2 Classic', ratio: 3 / 2 },
              ].map((p) => (
                <button
                  key={p.label}
                  onClick={() => handleApplyPreset(p.ratio)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    aspectRatio === p.ratio
                      ? 'bg-sky-500/20 border-sky-400 text-sky-300 shadow-md shadow-sky-500/10'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Quick adjust sliders */}
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Fine-tune Area
            </h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Width scale</span>
                  <span className="text-slate-200 font-mono">{Math.round(cropBox.width)}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={cropBox.width}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setCropBox((prev) => ({
                      ...prev,
                      width: val,
                      x: Math.min(prev.x, 100 - val),
                    }));
                  }}
                  className="w-full accent-sky-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Height scale</span>
                  <span className="text-slate-200 font-mono">{Math.round(cropBox.height)}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={cropBox.height}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setCropBox((prev) => ({
                      ...prev,
                      height: val,
                      y: Math.min(prev.y, 100 - val),
                    }));
                  }}
                  className="w-full accent-sky-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2 pt-4 border-t border-slate-800">
            <button
              onClick={handleApplyCrop}
              disabled={store.isProcessing}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-sky-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{store.isProcessing ? 'Processing...' : 'Apply & Save Crop'}</span>
            </button>

            <button
              onClick={() => store.setActiveModal(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
