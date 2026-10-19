import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useAppStore } from '../../store/useAppStore';
import { Eye, RotateCw, ExternalLink, FileText, Download, ChevronLeft, ChevronRight } from 'lucide-react';

export const PdfViewerModal: React.FC = () => {
  const store = useAppStore();
  const file = store.activeFile;
  const isOpen = store.activeModal === 'pdf_preview';

  const [currentPage, setCurrentPage] = useState<number>(1);
  const totalPages = file?.pageCount || 1;

  const handleOpenNative = () => {
    if (file && window.electronAPI) {
      window.electronAPI.openPath(file.path);
    }
  };

  const handleRotateCurrentPage = async (angle: number) => {
    if (!file || !window.electronAPI) return;
    store.setProcessing(true, `Rotating page ${currentPage}...`);
    try {
      const result = await window.electronAPI.rotatePdfPages(file.path, [currentPage], angle);
      if (result.success && result.outputPath) {
        store.showToast(`Rotated page ${currentPage} by ${angle}°`, 'success');
        const newMeta = await window.electronAPI.getFileMetadata(result.outputPath);
        store.setActiveFile(newMeta);
      } else {
        store.showToast(`Rotate failed: ${result.error}`, 'error');
      }
    } catch (err: any) {
      store.showToast(`Error: ${err.message}`, 'error');
    } finally {
      store.setProcessing(false);
    }
  };

  const handleExtractCurrentPage = async () => {
    if (!file || !window.electronAPI) return;
    store.setProcessing(true, `Extracting page ${currentPage}...`);
    try {
      const result = await window.electronAPI.extractPdfPages(file.path, {
        pageNumbers: [currentPage],
      });
      if (result.success && result.outputPath) {
        store.showToast(`Extracted page ${currentPage} to new PDF!`, 'success', {
          label: 'Show in Explorer',
          onClick: () => window.electronAPI.showItemInFolder(result.outputPath!),
        });
      } else {
        store.showToast(`Extraction failed: ${result.error}`, 'error');
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
      title="PDF Document Viewer & Tools"
      subtitle={`Viewing ${file.name} — Total: ${totalPages} pages`}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Document Card Preview Area */}
        <div className="min-h-[380px] bg-slate-100/90 dark:bg-slate-950/80 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 dark:text-rose-400 mb-4 shadow-xl">
            <FileText className="w-12 h-12" />
          </div>

          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1 truncate max-w-lg">{file.name}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            {file.formattedSize} • Page {currentPage} of {totalPages}
          </p>

          {/* Page Navigator */}
          <div className="flex items-center gap-3 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 shadow-md">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <span className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400 px-3">
              Page {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Operations on Current Page */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handleRotateCurrentPage(90)}
            className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-3 transition-colors text-left shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-500 dark:text-rose-300 flex items-center justify-center flex-shrink-0">
              <RotateCw className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-white">Rotate Page 90°</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Reorient page {currentPage}</div>
            </div>
          </button>

          <button
            onClick={handleExtractCurrentPage}
            className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-3 transition-colors text-left shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-500 dark:text-blue-300 flex items-center justify-center flex-shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-white">Extract Page</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Save page {currentPage} as new PDF</div>
            </div>
          </button>

          <button
            onClick={handleOpenNative}
            className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-3 transition-colors text-left shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-500 dark:text-emerald-300 flex items-center justify-center flex-shrink-0">
              <ExternalLink className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-white">Open in Reader</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">View in default Windows app</div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={() => store.setActiveModal(null)}
            className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs transition-colors"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </Modal>
  );
};
