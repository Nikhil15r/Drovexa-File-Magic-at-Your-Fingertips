import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileImage, 
  FileText, 
  Files, 
  Sparkles, 
  FolderOpen, 
  Clock, 
  ArrowRight,
  Layers
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { FileMetadata } from '../types';

export const DropZone: React.FC = () => {
  const store = useAppStore();
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounter = useRef(0);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    dragCounter.current = 0;

    const files = Array.from(e.dataTransfer.files);
    if (!files.length) return;

    await processDroppedFiles(files.map((f: any) => f.path || f.name));
  };

  const processDroppedFiles = async (filePaths: string[]) => {
    store.setProcessing(true, 'Analyzing file(s)...');
    try {
      const validPaths = filePaths.filter(Boolean);
      if (!validPaths.length) return;

      if (validPaths.length === 1) {
        // Single file workflow
        const meta = await window.electronAPI.getFileMetadata(validPaths[0]);
        store.setActiveFile(meta);
      } else {
        // Multiple files workflow -> Batch
        const metaList: FileMetadata[] = [];
        for (const p of validPaths) {
          try {
            const m = await window.electronAPI.getFileMetadata(p);
            metaList.push(m);
          } catch (err) {
            console.warn('Could not read file:', p, err);
          }
        }
        if (metaList.length > 0) {
          store.addBatchFiles(metaList);
          store.setActiveFile(metaList[0]);
          store.setActiveModal('batch_queue');
        }
      }
    } catch (err: any) {
      store.showToast(`Error opening file: ${err.message}`, 'error');
    } finally {
      store.setProcessing(false);
    }
  };

  const handleBrowseFiles = async () => {
    if (!window.electronAPI) return;
    const paths = await window.electronAPI.openFileDialog({ multiple: true });
    if (paths && paths.length > 0) {
      await processDroppedFiles(paths);
    }
  };

  const handleOpenRecent = async (file: FileMetadata) => {
    store.setProcessing(true, 'Loading file...');
    try {
      const meta = await window.electronAPI.getFileMetadata(file.path);
      store.setActiveFile(meta);
    } catch (err) {
      store.showToast(`Could not open recent file: ${file.name}`, 'error');
    } finally {
      store.setProcessing(false);
    }
  };

  return (
    <div 
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`relative w-full h-[calc(100vh-3rem)] flex flex-col items-center justify-between p-8 transition-all duration-300 ${
        isDragOver 
          ? 'bg-sky-100/50 dark:bg-sky-950/40 border-2 border-dashed border-sky-500 scale-[0.99] rounded-2xl' 
          : 'bg-gradient-to-b from-slate-50 via-sky-50/20 to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950'
      }`}
    >
      {/* Background radial glow */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
        <div className="w-[500px] h-[500px] rounded-full bg-sky-500/10 blur-[120px] -translate-y-12" />
        <div className="w-[400px] h-[400px] rounded-full bg-indigo-500/10 blur-[100px] translate-y-12" />
      </div>

      {/* Top Banner Tag */}
      <div className="z-10 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 shadow-sm dark:shadow-lg text-xs font-medium text-slate-700 dark:text-slate-300 backdrop-blur-sm">
        <Sparkles className="w-3.5 h-3.5 text-sky-500" />
        <span>Instant Drag-and-Drop Radial File Processing</span>
      </div>

      {/* Center Interactive Hero Drop Box */}
      <div className="z-10 flex flex-col items-center justify-center max-w-xl text-center my-auto">
        <div 
          onClick={handleBrowseFiles}
          className={`group cursor-pointer relative flex flex-col items-center justify-center p-10 rounded-3xl transition-all duration-300 border ${
            isDragOver 
              ? 'border-sky-500 bg-sky-500/10 dark:bg-sky-500/20 shadow-2xl shadow-sky-500/20 scale-105' 
              : 'border-slate-200 dark:border-slate-700/60 bg-white/80 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800/70 hover:border-sky-400 dark:hover:border-sky-500/50 shadow-xl shadow-slate-200/50 dark:shadow-none hover:shadow-2xl hover:shadow-sky-500/10'
          }`}
        >
          {/* Animated pulsing orbit ring */}
          <div className="absolute inset-0 rounded-3xl border border-sky-500/20 animate-pulse pointer-events-none" />

          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-sky-500/15 to-indigo-500/15 dark:from-sky-500/20 dark:to-indigo-500/20 border border-sky-400/40 flex items-center justify-center text-sky-500 dark:text-sky-400 mb-6 group-hover:scale-110 group-hover:bg-sky-500 group-hover:text-white transition-all duration-300 shadow-xl shadow-sky-500/10">
            <UploadCloud className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
            Drag & drop files here
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
            Drop any image, PDF document, or text file to instantly reveal its contextual radial action menu.
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-medium text-sm shadow-lg shadow-sky-500/25 flex items-center gap-2 transition-all active:scale-95"
            >
              <FolderOpen className="w-4 h-4" />
              <span>Browse Files</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleBrowseFiles();
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white font-medium text-sm flex items-center gap-2 transition-all active:scale-95"
            >
              <Layers className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              <span>Batch Mode</span>
            </button>
          </div>
        </div>

        {/* Supported Format Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6 max-w-md">
          {['PNG', 'JPG', 'WEBP', 'PDF', 'AVIF', 'TIFF', 'ICO', 'DOCX', 'TXT'].map((fmt) => (
            <span
              key={fmt}
              className="px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wider bg-slate-200/80 dark:bg-slate-800/60 text-slate-700 dark:text-slate-400 border border-slate-300/80 dark:border-slate-700/50"
            >
              {fmt}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom Recent Files Bar */}
      {store.recentFiles.length > 0 && (
        <div className="z-10 w-full max-w-3xl bg-white/80 dark:bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-700/60 p-3.5 shadow-xl shadow-slate-200/40 dark:shadow-none">
          <div className="flex items-center justify-between mb-2.5 px-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-sky-500" />
              <span>Recent Files</span>
            </div>
            <span className="text-[11px] text-slate-500">Click any file to resume editing</span>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
            {store.recentFiles.map((file) => (
              <button
                key={file.id}
                onClick={() => handleOpenRecent(file)}
                className="group flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/70 hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-slate-200/90 dark:border-slate-800 hover:border-sky-400 text-left transition-all flex-shrink-0 max-w-[220px]"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-200/70 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:text-sky-500 flex-shrink-0 overflow-hidden">
                  {file.thumbnailData ? (
                    <img src={file.thumbnailData} alt="" className="w-full h-full object-cover" />
                  ) : file.category === 'pdf' ? (
                    <FileText className="w-4 h-4 text-rose-500" />
                  ) : (
                    <FileImage className="w-4 h-4 text-sky-500" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate group-hover:text-sky-600 dark:group-hover:text-white">
                    {file.name}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {file.formattedSize}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
