import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Modal } from '../common/Modal';
import { useAppStore } from '../../store/useAppStore';
import { Check, Move, Eye, ShieldAlert, Sparkles, Sliders } from 'lucide-react';
import { AnnotateOptions } from '../../types';

export const AnnotateEditor: React.FC = () => {
  const store = useAppStore();
  const file = store.activeFile;
  const isOpen = store.activeModal === 'annotate';

  const [tab, setTab] = useState<'text' | 'watermark'>('text');

  // Text Caption State
  const [captionEnabled, setCaptionEnabled] = useState(true);
  const [captionText, setCaptionText] = useState('Sample Text');
  const [captionPos, setCaptionPos] = useState({ x: 8, y: 80 }); // percentage 0-100
  const [fontSize, setFontSize] = useState(36);
  const [textColor, setTextColor] = useState('#ffffff');
  const [hasBadge, setHasBadge] = useState(true);
  const [badgeColor, setBadgeColor] = useState('rgba(0, 0, 0, 0.65)');

  // Watermark State
  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [watermarkFontSize, setWatermarkFontSize] = useState(64);
  const [watermarkOpacity, setWatermarkOpacity] = useState(45);
  const [watermarkColor, setWatermarkColor] = useState('#e11d48'); // Bold Red/Rose default for security stamps
  const [watermarkPos, setWatermarkPos] = useState({ x: 50, y: 50 }); // percentage 0-100
  const [watermarkRotation, setWatermarkRotation] = useState(-45); // degrees: -45 is standard diagonal

  // Dragging interaction & preview scale state
  const [isDraggingCaption, setIsDraggingCaption] = useState(false);
  const [isDraggingWatermark, setIsDraggingWatermark] = useState(false);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [previewScale, setPreviewScale] = useState(0.5);
  const dragStartRef = useRef<{ clientX: number; clientY: number; initialX: number; initialY: number } | null>(null);
  const watermarkDragStartRef = useRef<{ clientX: number; clientY: number; initialX: number; initialY: number } | null>(null);

  const updatePreviewScale = useCallback(() => {
    if (imageRef.current) {
      const renderedW = imageRef.current.clientWidth;
      const naturalW = file?.dimensions?.width || imageRef.current.naturalWidth || 800;
      if (renderedW > 0 && naturalW > 0) {
        setPreviewScale(renderedW / naturalW);
      }
    }
  }, [file]);

  useEffect(() => {
    updatePreviewScale();
    window.addEventListener('resize', updatePreviewScale);
    return () => window.removeEventListener('resize', updatePreviewScale);
  }, [updatePreviewScale, isOpen]);

  // Sync initial state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCaptionPos({ x: 8, y: 80 });
      setWatermarkPos({ x: 50, y: 50 });
      setWatermarkRotation(-45);
      const initialWmSize = file?.dimensions?.width 
        ? Math.round(file.dimensions.width * 0.065) 
        : 64;
      setWatermarkFontSize(Math.max(24, Math.min(180, initialWmSize)));
      setIsDraggingCaption(false);
      setIsDraggingWatermark(false);
    }
  }, [isOpen, file]);

  // Handle pointer down on caption badge to initiate dragging
  const handleCaptionPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    setTab('text');

    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      initialX: captionPos.x,
      initialY: captionPos.y,
    };
    setIsDraggingCaption(true);
  };

  // Handle pointer down on watermark to initiate dragging
  const handleWatermarkPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    setTab('watermark');

    watermarkDragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      initialX: watermarkPos.x,
      initialY: watermarkPos.y,
    };
    setIsDraggingWatermark(true);
  };

  // Global window listeners for drag move and release
  useEffect(() => {
    if (!isDraggingCaption && !isDraggingWatermark) return;

    const handlePointerMove = (e: PointerEvent) => {
      const container = previewContainerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      // Caption dragging
      if (isDraggingCaption && dragStartRef.current) {
        const start = dragStartRef.current;
        const deltaPixelX = e.clientX - start.clientX;
        const deltaPixelY = e.clientY - start.clientY;

        const deltaPctX = (deltaPixelX / rect.width) * 100;
        const deltaPctY = (deltaPixelY / rect.height) * 100;

        const newX = Math.max(0, Math.min(92, start.initialX + deltaPctX));
        const newY = Math.max(0, Math.min(92, start.initialY + deltaPctY));

        setCaptionPos({
          x: Math.round(newX * 10) / 10,
          y: Math.round(newY * 10) / 10,
        });
      }

      // Watermark dragging
      if (isDraggingWatermark && watermarkDragStartRef.current) {
        const start = watermarkDragStartRef.current;
        const deltaPixelX = e.clientX - start.clientX;
        const deltaPixelY = e.clientY - start.clientY;

        const deltaPctX = (deltaPixelX / rect.width) * 100;
        const deltaPctY = (deltaPixelY / rect.height) * 100;

        const newX = Math.max(0, Math.min(100, start.initialX + deltaPctX));
        const newY = Math.max(0, Math.min(100, start.initialY + deltaPctY));

        setWatermarkPos({
          x: Math.round(newX * 10) / 10,
          y: Math.round(newY * 10) / 10,
        });
      }
    };

    const handlePointerUp = () => {
      dragStartRef.current = null;
      watermarkDragStartRef.current = null;
      setIsDraggingCaption(false);
      setIsDraggingWatermark(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDraggingCaption, isDraggingWatermark]);

  // Alignment Presets for text
  const applyAlignmentPreset = (x: number, y: number) => {
    setCaptionPos({ x, y });
  };

  const handleApply = async () => {
    if (!file || !window.electronAPI) return;

    store.setProcessing(true, 'Applying annotations & overlays...');
    try {
      const origW = file.dimensions?.width || 800;
      const origH = file.dimensions?.height || 600;

      const options: AnnotateOptions = {
        textOverlays: (captionEnabled && captionText.trim()) ? [
          {
            text: captionText,
            x: Math.round((captionPos.x / 100) * origW),
            y: Math.round((captionPos.y / 100) * origH),
            fontSize,
            color: textColor,
            backgroundColor: hasBadge ? badgeColor : undefined,
            fontWeight: 'bold',
          }
        ] : [],
        watermark: (watermarkEnabled && watermarkText.trim()) ? {
          text: watermarkText,
          opacity: watermarkOpacity / 100,
          fontSize: watermarkFontSize,
          color: watermarkColor,
          x: watermarkPos.x,
          y: watermarkPos.y,
          rotation: watermarkRotation,
        } : undefined,
      };

      const result = await window.electronAPI.applyAnnotations(file.path, options);

      if (result.success && result.outputPath) {
        store.showToast('Annotations applied successfully!', 'success', {
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

  // Curated color palettes
  const textColors = [
    { label: 'White', hex: '#ffffff' },
    { label: 'Black', hex: '#000000' },
    { label: 'Rose', hex: '#f43f5e' },
    { label: 'Sky', hex: '#38bdf8' },
    { label: 'Amber', hex: '#fbbf24' },
    { label: 'Emerald', hex: '#4ade80' },
  ];

  const watermarkColors = [
    { label: 'Security Red', hex: '#e11d48' },
    { label: 'Solid Black', hex: '#000000' },
    { label: 'Pure White', hex: '#ffffff' },
    { label: 'Slate Gray', hex: '#475569' },
    { label: 'Sky Blue', hex: '#0284c7' },
    { label: 'Amber Gold', hex: '#d97706' },
    { label: 'Emerald Green', hex: '#16a34a' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => store.setActiveModal(null)}
      title="Annotate & Watermark"
      subtitle="Stamp custom draggable text overlays, badges, and colored security watermarks."
      maxWidth="max-w-5xl"
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Live Canvas Preview */}
        <div className="flex-1 relative min-h-[420px] max-h-[520px] bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex items-center justify-center overflow-hidden select-none">
          {file.thumbnailData && (
            <div 
              ref={previewContainerRef}
              className="relative inline-block max-h-full max-w-full select-none rounded-lg overflow-hidden shadow-2xl"
              style={{ touchAction: 'none' }}
            >
              {/* Image Preview */}
              <img
                ref={imageRef}
                onLoad={updatePreviewScale}
                src={file.thumbnailData}
                alt=""
                className="max-h-[420px] max-w-full object-contain block pointer-events-none"
                draggable={false}
              />

              {/* Draggable Caption Text Overlay */}
              {captionEnabled && captionText && (
                <div 
                  onPointerDown={handleCaptionPointerDown}
                  style={{
                    left: `${captionPos.x}%`,
                    top: `${captionPos.y}%`,
                    color: textColor,
                    fontSize: `${Math.max(12, Math.round(fontSize * previewScale))}px`,
                    backgroundColor: hasBadge ? badgeColor : 'transparent',
                  }}
                  className={`absolute z-30 cursor-move select-none px-3 py-1.5 rounded-lg font-bold shadow-xl border transition-shadow flex items-center gap-2 group ${
                    isDraggingCaption
                      ? 'border-sky-400 ring-2 ring-sky-400/50 shadow-sky-500/30'
                      : 'border-white/20 hover:border-sky-400'
                  }`}
                  title="Click and drag anywhere on the image to position"
                >
                  <span className="whitespace-nowrap">{captionText}</span>
                  <div className="p-0.5 rounded bg-black/40 text-sky-400 opacity-60 group-hover:opacity-100 transition-opacity">
                    <Move className="w-3 h-3" />
                  </div>
                </div>
              )}

              {/* Live Colored Watermark Overlay (Draggable & Rotatable) */}
              {watermarkEnabled && watermarkText && (
                <div
                  onPointerDown={handleWatermarkPointerDown}
                  style={{
                    left: `${watermarkPos.x}%`,
                    top: `${watermarkPos.y}%`,
                    transform: `translate(-50%, -50%) rotate(${watermarkRotation}deg)`,
                    color: watermarkColor,
                    opacity: watermarkOpacity / 100,
                    fontSize: `${Math.max(12, Math.round(watermarkFontSize * previewScale))}px`,
                  }}
                  className={`absolute z-20 cursor-move select-none font-extrabold uppercase tracking-widest whitespace-nowrap px-3 py-1.5 rounded-xl transition-all border flex items-center gap-2 group ${
                    isDraggingWatermark
                      ? 'border-sky-400 ring-2 ring-sky-400/50 bg-black/30 shadow-2xl scale-105'
                      : 'border-white/10 hover:border-sky-400/80 hover:bg-black/20'
                  }`}
                  title="Click and drag to position anywhere on the image. Rotate in the sidebar."
                >
                  <span>{watermarkText}</span>
                  <div className="p-0.5 rounded bg-black/40 text-sky-400 opacity-60 group-hover:opacity-100 transition-opacity">
                    <Move className="w-3 h-3" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Controls */}
        <div className="w-full lg:w-80 space-y-4">
          {/* Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setTab('text')}
              className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                tab === 'text' 
                  ? 'bg-sky-500 text-white shadow' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Text Caption
            </button>
            <button
              onClick={() => setTab('watermark')}
              className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                tab === 'watermark' 
                  ? 'bg-sky-500 text-white shadow' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Watermark
            </button>
          </div>

          {tab === 'text' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 dark:text-white">
                  <input
                    type="checkbox"
                    checked={captionEnabled}
                    onChange={(e) => setCaptionEnabled(e.target.checked)}
                    className="accent-sky-500 rounded w-4 h-4"
                  />
                  <span>Enable Text Caption</span>
                </label>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Drag text to move</span>
              </div>

              {captionEnabled && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Caption Text</label>
                    <input
                      type="text"
                      value={captionText}
                      onChange={(e) => setCaptionText(e.target.value)}
                      placeholder="Enter text overlay..."
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-xs focus:outline-none focus:border-sky-500 shadow-sm"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                      <span>Font Size</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">{fontSize} px</span>
                    </div>
                    <input
                      type="range"
                      min="16"
                      max="120"
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="w-full accent-sky-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Text Color</label>
                      <span className="text-[10px] font-mono text-slate-400">{textColor}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Custom Color first (no text label) */}
                      <input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-7 h-7 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer p-0.5 bg-white dark:bg-slate-900 shadow-sm shrink-0 hover:scale-105 transition-transform"
                        title="Pick custom text color"
                      />

                      {/* Divider */}
                      <div className="h-5 w-px bg-slate-300 dark:bg-slate-700 mx-0.5 shrink-0" />

                      {/* All other colors */}
                      <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                        {textColors.map((c) => (
                          <button
                            key={c.hex}
                            type="button"
                            onClick={() => setTextColor(c.hex)}
                            style={{ backgroundColor: c.hex }}
                            title={c.label}
                            className={`w-6 h-6 rounded-lg border transition-transform shrink-0 ${
                              textColor.toLowerCase() === c.hex.toLowerCase()
                                ? 'scale-115 border-sky-500 ring-2 ring-sky-400/40 shadow-sm'
                                : 'border-slate-300 dark:border-slate-700 hover:scale-105'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Position Presets */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Position Presets</label>
                      <span className="text-[10px] font-mono text-slate-400">{Math.round(captionPos.x)}%, {Math.round(captionPos.y)}%</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => applyAlignmentPreset(5, 5)}
                        className="py-1 px-2 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      >
                        Top-Left
                      </button>
                      <button
                        type="button"
                        onClick={() => applyAlignmentPreset(35, 5)}
                        className="py-1 px-2 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      >
                        Top-Center
                      </button>
                      <button
                        type="button"
                        onClick={() => applyAlignmentPreset(65, 5)}
                        className="py-1 px-2 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      >
                        Top-Right
                      </button>
                      <button
                        type="button"
                        onClick={() => applyAlignmentPreset(5, 45)}
                        className="py-1 px-2 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      >
                        Mid-Left
                      </button>
                      <button
                        type="button"
                        onClick={() => applyAlignmentPreset(35, 45)}
                        className="py-1 px-2 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      >
                        Center
                      </button>
                      <button
                        type="button"
                        onClick={() => applyAlignmentPreset(65, 45)}
                        className="py-1 px-2 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      >
                        Mid-Right
                      </button>
                      <button
                        type="button"
                        onClick={() => applyAlignmentPreset(5, 82)}
                        className="py-1 px-2 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      >
                        Bottom-Left
                      </button>
                      <button
                        type="button"
                        onClick={() => applyAlignmentPreset(35, 82)}
                        className="py-1 px-2 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      >
                        Bottom-Center
                      </button>
                      <button
                        type="button"
                        onClick={() => applyAlignmentPreset(65, 82)}
                        className="py-1 px-2 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      >
                        Bottom-Right
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={hasBadge}
                        onChange={(e) => setHasBadge(e.target.checked)}
                        className="accent-sky-500 rounded"
                      />
                      <span>Include contrast background badge</span>
                    </label>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 dark:text-white mb-2">
                <input
                  type="checkbox"
                  checked={watermarkEnabled}
                  onChange={(e) => setWatermarkEnabled(e.target.checked)}
                  className="accent-sky-500 rounded w-4 h-4"
                />
                <span>Enable Security Watermark</span>
              </label>

              {watermarkEnabled && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Watermark Text</label>
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      placeholder="e.g. CONFIDENTIAL, DRAFT, SAMPLE"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-xs font-bold uppercase focus:outline-none focus:border-sky-500 shadow-sm"
                    />
                  </div>

                  {/* Watermark Text Size */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                      <span>Text Size</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">{watermarkFontSize} px</span>
                    </div>
                    <input
                      type="range"
                      min="16"
                      max="240"
                      value={watermarkFontSize}
                      onChange={(e) => setWatermarkFontSize(Number(e.target.value))}
                      className="w-full accent-sky-500 cursor-pointer"
                    />
                  </div>

                  {/* Watermark Color Picker */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Watermark Color</label>
                      <span className="text-[10px] font-mono text-slate-400">{watermarkColor}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Custom Color first (no text label) */}
                      <input
                        type="color"
                        value={watermarkColor}
                        onChange={(e) => setWatermarkColor(e.target.value)}
                        className="w-7 h-7 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer p-0.5 bg-white dark:bg-slate-900 shadow-sm shrink-0 hover:scale-105 transition-transform"
                        title="Pick custom watermark color"
                      />

                      {/* Divider */}
                      <div className="h-5 w-px bg-slate-300 dark:bg-slate-700 mx-0.5 shrink-0" />

                      {/* All other colors */}
                      <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                        {watermarkColors.map((c) => (
                          <button
                            key={c.hex}
                            type="button"
                            onClick={() => setWatermarkColor(c.hex)}
                            style={{ backgroundColor: c.hex }}
                            title={c.label}
                            className={`w-6 h-6 rounded-lg border transition-transform shrink-0 ${
                              watermarkColor.toLowerCase() === c.hex.toLowerCase()
                                ? 'scale-115 border-sky-400 ring-2 ring-sky-400/50 shadow-md' 
                                : 'border-slate-300 dark:border-slate-700 hover:scale-105'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                      <span>Opacity</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">{watermarkOpacity}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      value={watermarkOpacity}
                      onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                      className="w-full accent-sky-500 cursor-pointer"
                    />
                  </div>

                  {/* Rotation Angle */}
                  <div>
                    <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-1">
                      <span className="font-semibold">Rotation Angle</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">
                        {watermarkRotation}° {watermarkRotation === -45 ? '(Diagonal)' : watermarkRotation === 0 ? '(Horizontal)' : watermarkRotation === 90 ? '(Vertical)' : ''}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      value={watermarkRotation}
                      onChange={(e) => setWatermarkRotation(Number(e.target.value))}
                      className="w-full accent-sky-500 cursor-pointer mb-2"
                    />
                    <div className="grid grid-cols-4 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setWatermarkRotation(-45)}
                        className={`py-1 px-1 rounded-lg text-[10px] font-bold border transition-all ${
                          watermarkRotation === -45
                            ? 'bg-sky-500/20 border-sky-400 text-sky-600 dark:text-sky-300 font-extrabold shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        -45° Diag
                      </button>
                      <button
                        type="button"
                        onClick={() => setWatermarkRotation(0)}
                        className={`py-1 px-1 rounded-lg text-[10px] font-bold border transition-all ${
                          watermarkRotation === 0
                            ? 'bg-sky-500/20 border-sky-400 text-sky-600 dark:text-sky-300 font-extrabold shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        0° Horiz
                      </button>
                      <button
                        type="button"
                        onClick={() => setWatermarkRotation(45)}
                        className={`py-1 px-1 rounded-lg text-[10px] font-bold border transition-all ${
                          watermarkRotation === 45
                            ? 'bg-sky-500/20 border-sky-400 text-sky-600 dark:text-sky-300 font-extrabold shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        +45° Diag
                      </button>
                      <button
                        type="button"
                        onClick={() => setWatermarkRotation(90)}
                        className={`py-1 px-1 rounded-lg text-[10px] font-bold border transition-all ${
                          watermarkRotation === 90
                            ? 'bg-sky-500/20 border-sky-400 text-sky-600 dark:text-sky-300 font-extrabold shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        90° Vert
                      </button>
                    </div>
                  </div>

                  {/* Position Placement */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Position Placement</label>
                      <span className="text-[10px] font-mono text-slate-400">{Math.round(watermarkPos.x)}%, {Math.round(watermarkPos.y)}%</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 mb-1.5">
                      <button
                        type="button"
                        onClick={() => setWatermarkPos({ x: 25, y: 25 })}
                        className="py-1 px-2 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      >
                        Top-Left
                      </button>
                      <button
                        type="button"
                        onClick={() => setWatermarkPos({ x: 50, y: 25 })}
                        className="py-1 px-2 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      >
                        Top-Center
                      </button>
                      <button
                        type="button"
                        onClick={() => setWatermarkPos({ x: 75, y: 25 })}
                        className="py-1 px-2 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      >
                        Top-Right
                      </button>
                      <button
                        type="button"
                        onClick={() => setWatermarkPos({ x: 25, y: 75 })}
                        className="py-1 px-2 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      >
                        Bottom-Left
                      </button>
                      <button
                        type="button"
                        onClick={() => setWatermarkPos({ x: 50, y: 50 })}
                        className="py-1 px-2 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      >
                        Center
                      </button>
                      <button
                        type="button"
                        onClick={() => setWatermarkPos({ x: 75, y: 75 })}
                        className="py-1 px-2 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      >
                        Bottom-Right
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 italic block">
                      Tip: You can drag the watermark directly on the image to any location!
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <button
              onClick={handleApply}
              disabled={store.isProcessing}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-600 hover:from-indigo-400 hover:to-sky-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{store.isProcessing ? 'Applying...' : 'Apply Overlays'}</span>
            </button>
            <button
              onClick={() => store.setActiveModal(null)}
              className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AnnotateEditor;
