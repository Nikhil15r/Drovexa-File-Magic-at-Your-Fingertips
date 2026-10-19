import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useAppStore } from '../../store/useAppStore';
import { Split, Check, Sparkles, FolderOpen } from 'lucide-react';

export const PdfSplitModal: React.FC = () => {
  const store = useAppStore();
  const file = store.activeFile;
  const isOpen = store.activeModal === 'pdf_split';

  const [mode, setMode] = useState<'each' | 'range'>('each');
  const [rangeStr, setRangeStr] = useState<string>('1-2, 3-5');

  const handleSplit = async () => {
    if (!file || !window.electronAPI) return;

    store.setProcessing(true, 'Splitting PDF document...');
    try {
      const result = await window.electronAPI.splitPdf(file.path, {
        pages: mode === 'each' ? 'each' : rangeStr,
      });

      if (result.success && result.outputPath) {
        store.showToast('PDF split successfully!', 'success', {
          label: 'Open Output Folder',
          onClick: () => window.electronAPI.openPath(result.outputPath!),
        });
        store.setActiveModal(null);
      } else {
        store.showToast(`Split failed: ${result.error}`, 'error');
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
      title="Split PDF Document"
      subtitle={`Extract pages from ${file.name} (Total pages: ${file.pageCount || 'Unknown'})`}
      maxWidth="max-w-xl"
    >
      <div className="space-y-5">
        {/* Split Mode Selector */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setMode('each')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              mode === 'each'
                ? 'bg-amber-500/15 border-amber-400 text-white shadow-md shadow-amber-500/10'
                : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <div className="text-sm font-bold mb-1">Separate Every Page</div>
            <div className="text-xs text-slate-400">Creates a standalone PDF for each individual page</div>
          </button>

          <button
            onClick={() => setMode('range')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              mode === 'range'
                ? 'bg-amber-500/15 border-amber-400 text-white shadow-md shadow-amber-500/10'
                : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <div className="text-sm font-bold mb-1">Custom Ranges</div>
            <div className="text-xs text-slate-400">Specify ranges like 1-3, 5, 7-10</div>
          </button>
        </div>

        {mode === 'range' && (
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">Page Ranges</label>
            <input
              type="text"
              value={rangeStr}
              onChange={(e) => setRangeStr(e.target.value)}
              placeholder="e.g. 1-2, 3-5, 8"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500"
            />
            <p className="text-[11px] text-slate-400">
              Each comma-separated range will be saved as an independent PDF document.
            </p>
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
            onClick={handleSplit}
            disabled={store.isProcessing}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs shadow-lg shadow-amber-500/25 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <Split className="w-4 h-4" />
            <span>{store.isProcessing ? 'Splitting...' : 'Start Split Operation'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
