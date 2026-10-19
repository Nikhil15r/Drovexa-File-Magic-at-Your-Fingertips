import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Modal } from '../common/Modal';
import { useAppStore } from '../../store/useAppStore';
import { Check, RotateCcw, Maximize2, Move } from 'lucide-react';

type DragHandle = 'move' | 'create' | 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

interface CropBox {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 0-100
  height: number; // percentage 0-100
}

interface DragSession {
  handle: DragHandle;
  startMouseX: number; // percentage of image
  startMouseY: number; // percentage of image
  initialBox: CropBox;
}

export const CropEditor: React.FC = () => {
  const store = useAppStore();
  const file = store.activeFile;
  const isOpen = store.activeModal === 'crop';

  const [aspectRatio, setAspectRatio] = useState<number | null>(null); // null = freeform
  const [cropBox, setCropBox] = useState<CropBox>({ x: 10, y: 10, width: 80, height: 80 });
  const [imageSize, setImageSize] = useState({ width: 800, height: 600 });
  const [isInteracting, setIsInteracting] = useState(false);

  const imgContainerRef = useRef<HTMLDivElement>(null);
  const dragSessionRef = useRef<DragSession | null>(null);

  // Synchronize source dimensions when file changes
  useEffect(() => {
    if (file?.dimensions && file.dimensions.width > 0 && file.dimensions.height > 0) {
      setImageSize(file.dimensions);
      setCropBox({ x: 10, y: 10, width: 80, height: 80 });
      setAspectRatio(null);
    }
  }, [file]);

  // Convert client pointer coordinates into image container percentage [0-100]
  const getPercentageCoords = useCallback((clientX: number, clientY: number) => {
    if (!imgContainerRef.current) return { x: 0, y: 0 };
    const rect = imgContainerRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return { x: 0, y: 0 };
    const rawX = ((clientX - rect.left) / rect.width) * 100;
    const rawY = ((clientY - rect.top) / rect.height) * 100;
    return {
      x: Math.max(0, Math.min(100, rawX)),
      y: Math.max(0, Math.min(100, rawY)),
    };
  }, []);

  // Compute ratio in percentage terms: (box.width / box.height) = ratio * (H / W)
  const getAspectPctRatio = useCallback((ratio: number | null) => {
    if (ratio === null || imageSize.width === 0 || imageSize.height === 0) return null;
    return ratio * (imageSize.height / imageSize.width);
  }, [imageSize]);

  // Apply aspect ratio preset
  const handleApplyPreset = (ratio: number | null) => {
    setAspectRatio(ratio);
    if (ratio === null) return;

    const pctRatio = getAspectPctRatio(ratio);
    if (!pctRatio) return;

    setCropBox((prev) => {
      let newW = prev.width;
      let newH = newW / pctRatio;

      if (newH > 90) {
        newH = 90;
        newW = newH * pctRatio;
      }
      if (newW > 90) {
        newW = 90;
        newH = newW / pctRatio;
      }

      newW = Math.max(10, Math.min(100, newW));
      newH = Math.max(10, Math.min(100, newH));

      // Keep center position
      const centerX = prev.x + prev.width / 2;
      const centerY = prev.y + prev.height / 2;

      let newX = Math.max(0, Math.min(100 - newW, centerX - newW / 2));
      let newY = Math.max(0, Math.min(100 - newH, centerY - newH / 2));

      return {
        x: newX,
        y: newY,
        width: newW,
        height: newH,
      };
    });
  };

  // Reset to full image selection
  const handleResetFull = () => {
    setAspectRatio(null);
    setCropBox({ x: 0, y: 0, width: 100, height: 100 });
  };

  // Center current crop box
  const handleCenterCrop = () => {
    setCropBox((prev) => ({
      ...prev,
      x: Math.max(0, (100 - prev.width) / 2),
      y: Math.max(0, (100 - prev.height) / 2),
    }));
  };

  // Mouse / Pointer Down on Image (Drag to create new selection)
  const handleImagePointerDown = (e: React.PointerEvent) => {
    // Only primary mouse button
    if (e.button !== 0) return;
    const { x, y } = getPercentageCoords(e.clientX, e.clientY);

    dragSessionRef.current = {
      handle: 'create',
      startMouseX: x,
      startMouseY: y,
      initialBox: { x, y, width: 0, height: 0 },
    };
    setIsInteracting(true);
  };

  // Mouse / Pointer Down on Crop Box (Drag to move selection)
  const handleBoxPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation(); // Don't trigger create new
    const { x, y } = getPercentageCoords(e.clientX, e.clientY);

    dragSessionRef.current = {
      handle: 'move',
      startMouseX: x,
      startMouseY: y,
      initialBox: { ...cropBox },
    };
    setIsInteracting(true);
  };

  // Mouse / Pointer Down on a Handle (Drag to resize selection)
  const handleHandlePointerDown = (e: React.PointerEvent, handle: DragHandle) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const { x, y } = getPercentageCoords(e.clientX, e.clientY);

    dragSessionRef.current = {
      handle,
      startMouseX: x,
      startMouseY: y,
      initialBox: { ...cropBox },
    };
    setIsInteracting(true);
  };

  // Global window pointermove and pointerup listeners while dragging
  useEffect(() => {
    if (!isInteracting) return;

    const handlePointerMove = (e: PointerEvent) => {
      const session = dragSessionRef.current;
      if (!session) return;

      const { x: curX, y: curY } = getPercentageCoords(e.clientX, e.clientY);
      const dx = curX - session.startMouseX;
      const dy = curY - session.startMouseY;
      const pctRatio = getAspectPctRatio(aspectRatio);

      if (session.handle === 'move') {
        // Translate entire crop box
        const maxAllowedX = 100 - session.initialBox.width;
        const maxAllowedY = 100 - session.initialBox.height;
        const newX = Math.max(0, Math.min(maxAllowedX, session.initialBox.x + dx));
        const newY = Math.max(0, Math.min(maxAllowedY, session.initialBox.y + dy));

        setCropBox({
          ...session.initialBox,
          x: newX,
          y: newY,
        });
      } else if (session.handle === 'create') {
        // Drag to create a new selection box from start point to current point
        let minX = Math.min(session.startMouseX, curX);
        let maxX = Math.max(session.startMouseX, curX);
        let minY = Math.min(session.startMouseY, curY);
        let maxY = Math.max(session.startMouseY, curY);

        let w = maxX - minX;
        let h = maxY - minY;

        if (pctRatio) {
          // Constrain to aspect ratio
          h = w / pctRatio;
          if (curY < session.startMouseY) {
            minY = Math.max(0, session.startMouseY - h);
          } else {
            maxY = Math.min(100, session.startMouseY + h);
          }
        }

        if (w >= 1 && h >= 1) {
          setCropBox({
            x: Math.max(0, Math.min(99, minX)),
            y: Math.max(0, Math.min(99, minY)),
            width: Math.min(100 - minX, Math.max(1, w)),
            height: Math.min(100 - minY, Math.max(1, h)),
          });
        }
      } else {
        // Resize handle
        let newX = session.initialBox.x;
        let newY = session.initialBox.y;
        let newW = session.initialBox.width;
        let newH = session.initialBox.height;

        const anchorRight = session.initialBox.x + session.initialBox.width;
        const anchorBottom = session.initialBox.y + session.initialBox.height;

        // East / West adjustments
        if (session.handle.includes('e')) {
          newW = Math.max(5, Math.min(100 - newX, session.initialBox.width + dx));
        } else if (session.handle.includes('w')) {
          newX = Math.max(0, Math.min(anchorRight - 5, session.initialBox.x + dx));
          newW = anchorRight - newX;
        }

        // North / South adjustments
        if (session.handle.includes('s')) {
          newH = Math.max(5, Math.min(100 - newY, session.initialBox.height + dy));
        } else if (session.handle.includes('n')) {
          newY = Math.max(0, Math.min(anchorBottom - 5, session.initialBox.y + dy));
          newH = anchorBottom - newY;
        }

        // Apply aspect ratio constraint if active
        if (pctRatio) {
          if (session.handle === 'e' || session.handle === 'w') {
            newH = newW / pctRatio;
            if (newY + newH > 100) {
              newH = 100 - newY;
              newW = newH * pctRatio;
            }
          } else if (session.handle === 'n' || session.handle === 's') {
            newW = newH * pctRatio;
            if (newX + newW > 100) {
              newW = 100 - newX;
              newH = newW / pctRatio;
            }
          } else {
            // Corner handles
            newH = newW / pctRatio;
            if (session.handle.includes('n')) {
              newY = anchorBottom - newH;
              if (newY < 0) {
                newY = 0;
                newH = anchorBottom;
                newW = newH * pctRatio;
                if (session.handle.includes('w')) newX = anchorRight - newW;
              }
            }
            if (session.handle.includes('w')) {
              newX = anchorRight - newW;
              if (newX < 0) {
                newX = 0;
                newW = anchorRight;
                newH = newW / pctRatio;
                if (session.handle.includes('n')) newY = anchorBottom - newH;
              }
            }
          }
        }

        setCropBox({
          x: Math.max(0, Math.min(95, newX)),
          y: Math.max(0, Math.min(95, newY)),
          width: Math.max(5, Math.min(100 - newX, newW)),
          height: Math.max(5, Math.min(100 - newY, newH)),
        });
      }
    };

    const handlePointerUp = () => {
      const session = dragSessionRef.current;
      if (session?.handle === 'create') {
        // If user just clicked without dragging, restore a default centered 60% crop box
        setCropBox((prev) => {
          if (prev.width < 3 || prev.height < 3) {
            return { x: 20, y: 20, width: 60, height: 60 };
          }
          return prev;
        });
      }
      dragSessionRef.current = null;
      setIsInteracting(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isInteracting, aspectRatio, getAspectPctRatio, getPercentageCoords]);

  // Execute crop via Electron IPC
  const handleApplyCrop = async () => {
    if (!file || !window.electronAPI) return;

    store.setProcessing(true, 'Cropping image with high precision...');
    try {
      const realX = Math.round((cropBox.x / 100) * imageSize.width);
      const realY = Math.round((cropBox.y / 100) * imageSize.height);
      const realW = Math.round((cropBox.width / 100) * imageSize.width);
      const realH = Math.round((cropBox.height / 100) * imageSize.height);

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

  const pixelCropX = Math.round((cropBox.x / 100) * imageSize.width);
  const pixelCropY = Math.round((cropBox.y / 100) * imageSize.height);
  const pixelCropW = Math.round((cropBox.width / 100) * imageSize.width);
  const pixelCropH = Math.round((cropBox.height / 100) * imageSize.height);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => store.setActiveModal(null)}
      title="Crop Image"
      subtitle={`Click and drag anywhere on the image to select, or move and resize handles. Source: ${imageSize.width} × ${imageSize.height} px`}
      maxWidth="max-w-5xl"
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Crop Canvas Area */}
        <div className="flex-1 relative min-h-[440px] max-h-[540px] bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center p-4 overflow-hidden select-none">
          {file.thumbnailData && (
            <div 
              ref={imgContainerRef}
              onPointerDown={handleImagePointerDown}
              className="relative inline-block max-h-full max-w-full select-none cursor-crosshair overflow-hidden rounded-lg shadow-2xl"
              style={{ touchAction: 'none' }}
            >
              {/* Image Preview */}
              <img
                src={file.thumbnailData}
                alt="Crop preview"
                className="max-h-[460px] max-w-full object-contain block pointer-events-none"
                draggable={false}
              />

              {/* Crop box overlay with dark outside backdrop */}
              <div
                onPointerDown={handleBoxPointerDown}
                style={{
                  left: `${cropBox.x}%`,
                  top: `${cropBox.y}%`,
                  width: `${cropBox.width}%`,
                  height: `${cropBox.height}%`,
                  boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.65)',
                }}
                className="absolute border-2 border-sky-400 bg-sky-500/10 cursor-move pointer-events-auto"
              >
                {/* 3x3 Rule-of-Thirds Grid */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                  <div className="border-r border-b border-sky-300/40" />
                  <div className="border-r border-b border-sky-300/40" />
                  <div className="border-b border-sky-300/40" />
                  <div className="border-r border-b border-sky-300/40" />
                  <div className="border-r border-b border-sky-300/40" />
                  <div className="border-b border-sky-300/40" />
                  <div className="border-r border-sky-300/40" />
                  <div className="border-r border-sky-300/40" />
                  <div />
                </div>

                {/* Pixel Dimension & Position Badge */}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/90 text-[11px] font-mono font-bold text-sky-300 border border-sky-400/80 pointer-events-none shadow-lg backdrop-blur-sm whitespace-nowrap">
                  {pixelCropW} × {pixelCropH} px
                </div>

                {/* 4 Corner Handles */}
                <div
                  onPointerDown={(e) => handleHandlePointerDown(e, 'nw')}
                  className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-sky-500 rounded-sm shadow-md cursor-nwse-resize hover:scale-125 transition-transform"
                />
                <div
                  onPointerDown={(e) => handleHandlePointerDown(e, 'ne')}
                  className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-sky-500 rounded-sm shadow-md cursor-nesw-resize hover:scale-125 transition-transform"
                />
                <div
                  onPointerDown={(e) => handleHandlePointerDown(e, 'sw')}
                  className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-sky-500 rounded-sm shadow-md cursor-nesw-resize hover:scale-125 transition-transform"
                />
                <div
                  onPointerDown={(e) => handleHandlePointerDown(e, 'se')}
                  className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-sky-500 rounded-sm shadow-md cursor-nwse-resize hover:scale-125 transition-transform"
                />

                {/* 4 Edge Midpoint Handles */}
                <div
                  onPointerDown={(e) => handleHandlePointerDown(e, 'n')}
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-2 bg-white border border-sky-500 rounded-full shadow-md cursor-ns-resize hover:scale-110 transition-transform"
                />
                <div
                  onPointerDown={(e) => handleHandlePointerDown(e, 's')}
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-2 bg-white border border-sky-500 rounded-full shadow-md cursor-ns-resize hover:scale-110 transition-transform"
                />
                <div
                  onPointerDown={(e) => handleHandlePointerDown(e, 'w')}
                  className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-6 bg-white border border-sky-500 rounded-full shadow-md cursor-ew-resize hover:scale-110 transition-transform"
                />
                <div
                  onPointerDown={(e) => handleHandlePointerDown(e, 'e')}
                  className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-6 bg-white border border-sky-500 rounded-full shadow-md cursor-ew-resize hover:scale-110 transition-transform"
                />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Controls */}
        <div className="w-full lg:w-72 flex flex-col justify-between space-y-5">
          <div className="space-y-5">
            {/* Aspect Ratio Presets */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Aspect Ratio
                </h4>
                <button
                  onClick={handleResetFull}
                  className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Full</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Freeform', ratio: null },
                  { label: '1:1 Square', ratio: 1 },
                  { label: '16:9 Cinema', ratio: 16 / 9 },
                  { label: '4:3 Standard', ratio: 4 / 3 },
                  { label: '9:16 Story', ratio: 9 / 16 },
                  { label: '3:2 Photo', ratio: 3 / 2 },
                ].map((p) => (
                  <button
                    key={p.label}
                    onClick={() => handleApplyPreset(p.ratio)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      aspectRatio === p.ratio
                        ? 'bg-sky-500/20 border-sky-500 text-sky-600 dark:text-sky-300 shadow-md shadow-sky-500/10'
                        : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Action Helpers */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleCenterCrop}
                className="py-1.5 px-2.5 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                title="Center crop box"
              >
                <Move className="w-3 h-3 text-sky-500" />
                <span>Center Box</span>
              </button>
              <button
                onClick={handleResetFull}
                className="py-1.5 px-2.5 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                title="Fit full image"
              >
                <Maximize2 className="w-3 h-3 text-emerald-500" />
                <span>Fit Image</span>
              </button>
            </div>

            {/* Fine-tune Coordinates Readout & Sliders */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                Crop Area
              </h4>
              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5 font-mono">
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Width:</span>
                    <span className="font-bold text-sky-600 dark:text-sky-400">{pixelCropW} px ({Math.round(cropBox.width)}%)</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Height:</span>
                    <span className="font-bold text-sky-600 dark:text-sky-400">{pixelCropH} px ({Math.round(cropBox.height)}%)</span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400 text-[11px] pt-1 border-t border-slate-200 dark:border-slate-700/60">
                    <span>Offset:</span>
                    <span>X: {pixelCropX}px, Y: {pixelCropY}px</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    <span>Width scale</span>
                    <span className="font-mono">{Math.round(cropBox.width)}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
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
                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    <span>Height scale</span>
                    <span className="font-mono">{Math.round(cropBox.height)}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
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
          </div>

          {/* Action buttons */}
          <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-800">
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
              className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 dark:border-transparent dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CropEditor;
