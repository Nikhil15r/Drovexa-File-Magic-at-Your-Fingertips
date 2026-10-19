import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useAppStore } from '../../store/useAppStore';
import { Layers, Plus, Trash2, ArrowUp, ArrowDown, Check, FileText } from 'lucide-react';

export const PdfMergeModal: React.FC = () => {
  const store = useAppStore();
  const file = store.activeFile;
  const isOpen = store.activeModal === 'pdf_merge';

  const [pdfList, setPdfList] = useState<string[]>(file ? [file.path] : []);

  const handleAddFiles = async () => {
    if (!window.electronAPI) return;
    const paths = await window.electronAPI.openFileDialog({
      multiple: true,
      filters: [{ name: 'PDF Documents', extensions: ['pdf'] }],
    });
    if (paths) {
      setPdfList((prev) => [...prev, ...paths]);
    }
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= pdfList.length) return;
    const updated = [...pdfList];
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;
    setPdfList(updated);
  };

  const handleRemove = (index: number) => {
    setPdfList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMerge = async () => {
    if (pdfList.length < 2 || !window.electronAPI) return;

    store.setProcessing(true, `Merging ${pdfList.length} PDF files...`);
    try {
      const result = await window.electronAPI.mergePdfs(pdfList);

      if (result.success && result.outputPath) {
        store.showToast(`Merged ${pdfList.length} PDFs into single document!`, 'success', {
          label: 'Show in Explorer',
          onClick: () => window.electronAPI.showItemInFolder(result.outputPath!),
        });
        store.setActiveModal(null);
        const newMeta = await window.electronAPI.getFileMetadata(result.outputPath);
        store.setActiveFile(newMeta);
      } else {
        store.showToast(`Merge failed: ${result.error}`, 'error');
      }
    } catch (err: any) {
      store.showToast(`Error: ${err.message}`, 'error');
    } finally {
      store.setProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => store.setActiveModal(null)}
      title="Merge PDF Documents"
      subtitle="Combine multiple PDF documents into a single unified file in custom sequence."
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Files in Merge Queue ({pdfList.length})
          </span>
          <button
            onClick={handleAddFiles}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-sky-400 flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add More PDFs</span>
          </button>
        </div>

        {/* List of files */}
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {pdfList.map((p, index) => {
            const fileName = p.split(/[/\\]/).pop() || p;
            return (
              <div
                key={`${p}-${index}`}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
                    {index + 1}
                  </div>
                  <FileText className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span className="text-xs font-medium text-slate-200 truncate" title={p}>
                    {fileName}
                  </span>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleMove(index, 'up')}
                    disabled={index === 0}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleMove(index, 'down')}
                    disabled={index === pdfList.length - 1}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleRemove(index)}
                    className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {pdfList.length < 2 && (
          <p className="text-xs text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
            Please add at least one more PDF document to proceed with merging.
          </p>
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
            onClick={handleMerge}
            disabled={pdfList.length < 2 || store.isProcessing}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <Layers className="w-4 h-4" />
            <span>{store.isProcessing ? 'Merging...' : `Merge ${pdfList.length} PDFs`}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
