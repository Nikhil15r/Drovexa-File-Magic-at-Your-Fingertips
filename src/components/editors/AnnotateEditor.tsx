import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useAppStore } from '../../store/useAppStore';
import { Type, Check, Sparkles, ShieldAlert, Plus, Trash2 } from 'lucide-react';
import { AnnotateOptions } from '../../types';

export const AnnotateEditor: React.FC = () => {
  const store = useAppStore();
  const file = store.activeFile;
  const isOpen = store.activeModal === 'annotate';

  const [tab, setTab] = useState<'text' | 'watermark'>('text');

  // Text overlays state
  const [captionText, setCaptionText] = useState('Sample Text');
  const [fontSize, setFontSize] = useState(36);
  const [textColor, setTextColor] = useState('#ffffff');
  const [hasBadge, setHasBadge] = useState(true);
  const [badgeColor, setBadgeColor] = useState('rgba(0,0,0,0.6)');

  // Watermark state
  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [watermarkOpacity, setWatermarkOpacity] = useState(35);
  const [watermarkPosition, setWatermarkPosition] = useState<'diagonal' | 'bottom-right' | 'center'>('diagonal');

  const handleApply = async () => {
    if (!file || !window.electronAPI) return;

    store.setProcessing(true, 'Applying annotations & overlays...');
    try {
      const origW = file.dimensions?.width || 800;
      const origH = file.dimensions?.height || 600;

      const options: AnnotateOptions = {
        textOverlays: captionText.trim() ? [
          {
            text: captionText,
            x: Math.round(origW * 0.1),
            y: Math.round(origH * 0.9),
            fontSize,
            color: textColor,
            backgroundColor: hasBadge ? badgeColor : undefined,
            fontWeight: 'bold',
          }
        ] : [],
        watermark: watermarkEnabled && watermarkText.trim() ? {
          text: watermarkText,
          opacity: watermarkOpacity / 100,
          fontSize: Math.round(origW * 0.08),
          color: '#ffffff',
          position: watermarkPosition,
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => store.setActiveModal(null)}
      title="Annotate & Watermark"
      subtitle="Stamp custom text overlays, brand badges, and diagonal security watermarks."
      maxWidth="max-w-4xl"
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Live Canvas Preview */}
        <div className="flex-1 relative min-h-[380px] max-h-[480px] bg-slate-100/90 dark:bg-slate-950/80 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex items-center justify-center overflow-hidden">
          {file.thumbnailData && (
            <div className="relative max-h-full max-w-full flex items-center justify-center">
              <img
                src={file.thumbnailData}
                alt=""
                className="max-h-[380px] max-w-full object-contain rounded-lg shadow-2xl"
              />

              {/* Live Simulated Caption Overlay */}
              {captionText && (
                <div 
                  style={{
                    color: textColor,
                    fontSize: `${Math.max(12, Math.round(fontSize * 0.5))}px`,
                    backgroundColor: hasBadge ? badgeColor : 'transparent',
                  }}
                  className="absolute bottom-6 left-6 px-3 py-1 rounded-md font-bold shadow-lg pointer-events-none select-none max-w-[80%]"
                >
                  {captionText}
                </div>
              )}

              {/* Live Simulated Watermark */}
              {watermarkEnabled && watermarkText && (
                <div
                  style={{
                    opacity: watermarkOpacity / 100,
                  }}
                  className={`absolute pointer-events-none select-none text-white font-extrabold uppercase tracking-widest ${
                    watermarkPosition === 'diagonal'
                      ? 'text-3xl -rotate-45 text-center'
                      : watermarkPosition === 'bottom-right'
                      ? 'text-lg bottom-4 right-4'
                      : 'text-3xl text-center'
                  }`}
                >
                  {watermarkText}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Controls */}
        <div className="w-full lg:w-80 space-y-5">
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
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">Text Color</label>
                <div className="flex items-center gap-2">
                  {['#ffffff', '#000000', '#f43f5e', '#38bdf8', '#fbbf24', '#4ade80'].map((c) => (
                    <button
                      key={c}
                      onClick={() => setTextColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-6 h-6 rounded-lg border transition-transform ${
                        textColor === c ? 'scale-110 border-sky-500 shadow-sm' : 'border-slate-300 dark:border-slate-700 hover:scale-105'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-2">
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
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-xs font-bold uppercase focus:outline-none focus:border-sky-500 shadow-sm"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                      <span>Opacity</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">{watermarkOpacity}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={watermarkOpacity}
                      onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                      className="w-full accent-sky-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">Placement</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['diagonal', 'center', 'bottom-right'] as const).map((pos) => (
                        <button
                          key={pos}
                          onClick={() => setWatermarkPosition(pos)}
                          className={`py-1.5 px-2 rounded-lg text-[10px] font-bold uppercase border transition-all ${
                            watermarkPosition === pos
                              ? 'bg-sky-500/20 border-sky-400 text-sky-600 dark:text-sky-300 font-extrabold shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {pos.replace('-', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
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
