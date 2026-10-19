import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useAppStore } from '../../store/useAppStore';
import { Palette, Check, Sparkles, Sliders } from 'lucide-react';
import { BackgroundOptions } from '../../types';

export const BackgroundEditor: React.FC = () => {
  const store = useAppStore();
  const file = store.activeFile;
  const isOpen = store.activeModal === 'background';

  const [bgType, setBgType] = useState<'gradient' | 'solid' | 'transparent'>('gradient');
  const [solidColor, setSolidColor] = useState<string>('#0f172a');
  const [gradient, setGradient] = useState({
    from: '#0ea5e9',
    to: '#6366f1',
    angle: 135,
  });
  const [padding, setPadding] = useState<number>(40);
  const [cornerRadius, setCornerRadius] = useState<number>(20);
  const [shadowBlur, setShadowBlur] = useState<number>(24);
  const [borderWidth, setBorderWidth] = useState<number>(0);
  const [borderColor, setBorderColor] = useState<string>('#ffffff');

  const gradientPresets = [
    { label: 'Ocean Blue', from: '#0ea5e9', to: '#6366f1', angle: 135 },
    { label: 'Sunset Glow', from: '#f43f5e', to: '#fb923c', angle: 45 },
    { label: 'Cyberpunk', from: '#ec4899', to: '#8b5cf6', angle: 120 },
    { label: 'Emerald Mint', from: '#10b981', to: '#06b6d4', angle: 90 },
    { label: 'Midnight Aurora', from: '#3b82f6', to: '#9333ea', angle: 160 },
    { label: 'Dark Charcoal', from: '#1e293b', to: '#0f172a', angle: 180 },
  ];

  const solidColors = [
    '#ffffff', '#f8fafc', '#e2e8f0', '#94a3b8',
    '#0f172a', '#000000', '#0ea5e9', '#3b82f6',
    '#6366f1', '#a855f7', '#ec4899', '#f43f5e',
    '#10b981', '#f59e0b', '#fbbf24', '#14b8a6',
  ];

  const handleApply = async () => {
    if (!file || !window.electronAPI) return;

    store.setProcessing(true, 'Rendering background canvas...');
    try {
      const options: BackgroundOptions = {
        type: bgType,
        color: solidColor,
        gradient: bgType === 'gradient' ? gradient : undefined,
        padding,
        cornerRadius,
        shadowBlur,
        shadowColor: '#000000',
        shadowOpacity: 0.45,
        borderWidth,
        borderColor,
      };

      const result = await window.electronAPI.applyBackground(file.path, options);

      if (result.success && result.outputPath) {
        store.showToast('Background canvas exported successfully!', 'success', {
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

  const bgStyle = bgType === 'gradient'
    ? { background: `linear-gradient(${gradient.angle}deg, ${gradient.from}, ${gradient.to})` }
    : bgType === 'solid'
    ? { backgroundColor: solidColor }
    : { background: 'repeating-conic-gradient(#334155 0% 25%, #1e293b 0% 50%) 50% / 16px 16px' };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => store.setActiveModal(null)}
      title="Background & Canvas Studio"
      subtitle="Frame your image with vibrant gradients, solid colors, padding, rounded corners and drop shadows."
      maxWidth="max-w-5xl"
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Live Visual Canvas Area */}
        <div className="flex-1 min-h-[380px] max-h-[500px] bg-slate-950/80 rounded-2xl border border-slate-800 p-8 flex items-center justify-center overflow-hidden">
          <div
            style={{
              ...bgStyle,
              padding: `${padding}px`,
            }}
            className="transition-all duration-200 rounded-2xl flex items-center justify-center max-w-full max-h-full"
          >
            {file.thumbnailData && (
              <img
                src={file.thumbnailData}
                alt=""
                style={{
                  borderRadius: `${cornerRadius}px`,
                  boxShadow: shadowBlur > 0 ? `0 12px ${shadowBlur}px rgba(0,0,0,0.45)` : 'none',
                  border: borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : 'none',
                }}
                className="max-h-[300px] object-contain transition-all duration-150"
              />
            )}
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="w-full lg:w-80 space-y-5">
          {/* Background Type Selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Background Style
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
              {(['gradient', 'solid', 'transparent'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setBgType(t)}
                  className={`py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                    bgType === t ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Gradient Presets */}
          {bgType === 'gradient' && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Curated Gradients
              </label>
              <div className="grid grid-cols-3 gap-2">
                {gradientPresets.map((g) => (
                  <button
                    key={g.label}
                    onClick={() => setGradient({ from: g.from, to: g.to, angle: g.angle })}
                    style={{
                      background: `linear-gradient(${g.angle}deg, ${g.from}, ${g.to})`,
                    }}
                    className="h-9 rounded-xl border border-white/10 hover:scale-105 transition-transform"
                    title={g.label}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Solid Colors */}
          {bgType === 'solid' && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Color Palette
              </label>
              <div className="grid grid-cols-8 gap-1.5 mb-3">
                {solidColors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSolidColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-7 h-7 rounded-lg border transition-transform ${
                      solidColor === c ? 'scale-110 border-sky-400' : 'border-slate-700 hover:scale-105'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Padding Slider */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Canvas Padding</span>
              <span className="font-mono text-slate-200">{padding} px</span>
            </div>
            <input
              type="range"
              min="0"
              max="120"
              value={padding}
              onChange={(e) => setPadding(Number(e.target.value))}
              className="w-full accent-sky-400 cursor-pointer"
            />
          </div>

          {/* Corner Radius Slider */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Corner Radius</span>
              <span className="font-mono text-slate-200">{cornerRadius} px</span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              value={cornerRadius}
              onChange={(e) => setCornerRadius(Number(e.target.value))}
              className="w-full accent-sky-400 cursor-pointer"
            />
          </div>

          {/* Shadow Blur Slider */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Drop Shadow Blur</span>
              <span className="font-mono text-slate-200">{shadowBlur} px</span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              value={shadowBlur}
              onChange={(e) => setShadowBlur(Number(e.target.value))}
              className="w-full accent-sky-400 cursor-pointer"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <button
              onClick={handleApply}
              disabled={store.isProcessing}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-pink-600 hover:from-fuchsia-400 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-fuchsia-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{store.isProcessing ? 'Rendering...' : 'Save Styled Canvas'}</span>
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
