import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useAppStore } from '../../store/useAppStore';
import { 
  Layers, 
  Play, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowRight, 
  FolderOpen, 
  FileImage, 
  FileText,
  Plus
} from 'lucide-react';

export const BatchQueueModal: React.FC = () => {
  const store = useAppStore();
  const isOpen = store.activeModal === 'batch_queue';

  const [operation, setOperation] = useState<'convert' | 'compress' | 'resize' | 'combine_pdf'>('convert');
  const [targetFormat, setTargetFormat] = useState<'webp' | 'png' | 'jpeg' | 'pdf'>('webp');
  const [compressQuality, setCompressQuality] = useState<number>(80);
  const [resizeWidth, setResizeWidth] = useState<number>(1920);
  const [resizeHeight, setResizeHeight] = useState<number>(1080);
  const [isRunning, setIsRunning] = useState(false);

  const handleAddMoreFiles = async () => {
    if (!window.electronAPI) return;
    const paths = await window.electronAPI.openFileDialog({ multiple: true });
    if (paths) {
      const metaList = [];
      for (const p of paths) {
        try {
          const m = await window.electronAPI.getFileMetadata(p);
          metaList.push(m);
        } catch (e) {}
      }
      store.addBatchFiles(metaList);
    }
  };

  const handleRunBatch = async () => {
    if (!store.batchItems.length || !window.electronAPI) return;

    setIsRunning(true);
    store.setProcessing(true, 'Running batch processing...');

    try {
      if (operation === 'combine_pdf') {
        // Special operation: combine all image files in batch into one single PDF!
        const imagePaths = store.batchItems.map((b) => b.file.path);
        const result = await window.electronAPI.imagesToPdf(imagePaths, {
          pageSize: 'a4',
          orientation: 'auto',
          margin: 20,
        });

        if (result.success && result.outputPath) {
          store.batchItems.forEach((item) => {
            store.updateBatchItem(item.id, { status: 'completed', progress: 100, outputPath: result.outputPath });
          });
          store.showToast(`Combined ${imagePaths.length} files into PDF!`, 'success', {
            label: 'Show in Explorer',
            onClick: () => window.electronAPI.showItemInFolder(result.outputPath!),
          });
        }
      } else {
        // Standard item-by-item batch processing
        for (const item of store.batchItems) {
          store.updateBatchItem(item.id, { status: 'processing', progress: 50 });

          let options: any = {};
          if (operation === 'convert') {
            options = { targetFormat, quality: compressQuality };
          } else if (operation === 'compress') {
            options = { quality: compressQuality };
          } else if (operation === 'resize') {
            options = { width: resizeWidth, height: resizeHeight, maintainAspectRatio: true };
          }

          const result = await window.electronAPI.processBatchItem(operation, item.file.path, options);

          if (result.success) {
            store.updateBatchItem(item.id, {
              status: 'completed',
              progress: 100,
              outputPath: result.outputPath,
            });
          } else {
            store.updateBatchItem(item.id, {
              status: 'failed',
              progress: 100,
              error: result.error,
            });
          }
        }
        store.showToast('Batch processing complete!', 'success');
      }
    } catch (err: any) {
      store.showToast(`Batch error: ${err.message}`, 'error');
    } finally {
      setIsRunning(false);
      store.setProcessing(false);
    }
  };

  const handleClear = () => {
    store.clearBatchItems();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => store.setActiveModal(null)}
      title="Batch Processing Hub"
      subtitle={`Process multiple images or documents simultaneously (${store.batchItems.length} items in queue)`}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Operation Selection Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { id: 'convert', label: 'Batch Convert', desc: 'Convert all to target format' },
            { id: 'compress', label: 'Batch Compress', desc: 'Optimize all file sizes' },
            { id: 'resize', label: 'Batch Resize', desc: 'Scale to uniform resolution' },
            { id: 'combine_pdf', label: 'Combine to PDF', desc: 'Merge all into single PDF' },
          ].map((op) => (
            <button
              key={op.id}
              onClick={() => setOperation(op.id as any)}
              className={`p-3 rounded-2xl border text-left transition-all ${
                operation === op.id
                  ? 'bg-indigo-500/15 border-indigo-500 text-indigo-700 dark:text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <div className="text-xs font-bold">{op.label}</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{op.desc}</div>
            </button>
          ))}
        </div>

        {/* Dynamic Operation Settings */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          {operation === 'convert' && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Target Format:</span>
              <div className="flex items-center gap-2">
                {(['webp', 'png', 'jpeg', 'pdf'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setTargetFormat(fmt)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase border transition-all ${
                      targetFormat === fmt
                        ? 'bg-sky-500/20 border-sky-400 text-sky-600 dark:text-sky-300 font-extrabold shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    .{fmt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {operation === 'compress' && (
            <div className="flex-1 flex items-center gap-4">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Compression Quality:</span>
              <input
                type="range"
                min="20"
                max="100"
                value={compressQuality}
                onChange={(e) => setCompressQuality(Number(e.target.value))}
                className="flex-1 accent-indigo-500 cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">{compressQuality}%</span>
            </div>
          )}

          {operation === 'resize' && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Fit Dimensions:</span>
              <input
                type="number"
                value={resizeWidth}
                onChange={(e) => setResizeWidth(Number(e.target.value))}
                className="w-24 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-mono text-xs shadow-sm"
                placeholder="Width"
              />
              <span className="text-xs text-slate-400">×</span>
              <input
                type="number"
                value={resizeHeight}
                onChange={(e) => setResizeHeight(Number(e.target.value))}
                className="w-24 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-mono text-xs shadow-sm"
                placeholder="Height"
              />
            </div>
          )}

          {operation === 'combine_pdf' && (
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Combines all queued images in order into an A4 multipage PDF.
            </div>
          )}

          <button
            onClick={handleAddMoreFiles}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Files</span>
          </button>
        </div>

        {/* Files Queue List */}
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {store.batchItems.map((item, idx) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-mono text-slate-400 dark:text-slate-500 w-5">{idx + 1}.</span>
                <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 flex-shrink-0 overflow-hidden">
                  {item.file.thumbnailData ? (
                    <img src={item.file.thumbnailData} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <FileImage className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 dark:text-white truncate max-w-sm">{item.file.name}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{item.file.formattedSize}</p>
                </div>
              </div>

              {/* Status indicator */}
              <div className="flex items-center gap-3">
                {item.status === 'pending' && (
                  <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Queued</span>
                  </span>
                )}
                {item.status === 'processing' && (
                  <span className="flex items-center gap-1 text-[11px] text-sky-500 dark:text-sky-400 animate-pulse font-medium">
                    <span>Processing...</span>
                  </span>
                )}
                {item.status === 'completed' && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Done</span>
                  </span>
                )}
                {item.status === 'failed' && (
                  <span className="flex items-center gap-1 text-[11px] text-rose-500 dark:text-rose-400 font-semibold" title={item.error}>
                    <XCircle className="w-4 h-4" />
                    <span>Failed</span>
                  </span>
                )}

                {item.outputPath && (
                  <button
                    onClick={() => window.electronAPI?.showItemInFolder(item.outputPath!)}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    title="Show in Explorer"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={handleClear}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Queue</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => store.setActiveModal(null)}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs transition-colors"
            >
              Close
            </button>

            <button
              onClick={handleRunBatch}
              disabled={!store.batchItems.length || isRunning}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-600 hover:from-indigo-400 hover:to-sky-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              <span>{isRunning ? 'Processing Queue...' : `Start Batch (${store.batchItems.length} items)`}</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
