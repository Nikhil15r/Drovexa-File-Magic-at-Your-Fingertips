import React, { useState, useEffect } from 'react';
import { 
  Minus, 
  Square, 
  X, 
  Copy, 
  Moon, 
  Sun, 
  Settings as SettingsIcon, 
  Layers, 
  LayoutGrid, 
  Compass, 
  Wand2 
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const Header: React.FC = () => {
  const store = useAppStore();
  const [isMaximized, setIsMaximized] = useState(false);

  const [floatingVisible, setFloatingVisible] = useState(store.settings.floatingWidgetEnabled ?? true);

  useEffect(() => {
    const checkMax = async () => {
      if (window.electronAPI) {
        const max = await window.electronAPI.isMaximized();
        setIsMaximized(max);
        const vis = await window.electronAPI.isFloatingWidgetVisible();
        setFloatingVisible(vis);
      }
    };
    checkMax();

    let unsub: (() => void) | undefined;
    if (window.electronAPI) {
      unsub = window.electronAPI.onFloatingVisibilityChange((visible) => {
        setFloatingVisible(visible);
        store.updateSettings({ floatingWidgetEnabled: visible });
      });
    }

    return () => {
      if (unsub) unsub();
    };
  }, []);

  const handleMinimize = () => {
    window.electronAPI?.minimizeWindow();
  };

  const handleMaximize = async () => {
    if (window.electronAPI) {
      await window.electronAPI.maximizeWindow();
      const max = await window.electronAPI.isMaximized();
      setIsMaximized(max);
    }
  };

  const handleClose = () => {
    window.electronAPI?.closeWindow();
  };

  const toggleTheme = () => {
    const nextTheme = store.settings.theme === 'dark' ? 'light' : 'dark';
    store.updateSettings({ theme: nextTheme });
  };

  const toggleMenuLayout = () => {
    const nextLayout = store.settings.menuLayout === 'radial' ? 'grid' : 'radial';
    store.updateSettings({ menuLayout: nextLayout });
  };

  const toggleFloating = async () => {
    if (window.electronAPI) {
      const next = await window.electronAPI.toggleFloatingWidget();
      setFloatingVisible(next);
      store.updateSettings({ floatingWidgetEnabled: next });
    }
  };

  return (
    <header className="titlebar-drag h-12 w-full flex items-center justify-between px-4 select-none border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-50 text-slate-700 dark:text-slate-200 transition-colors duration-200">
      {/* Brand & App Title */}
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white">
          <Wand2 className="w-4 h-4" />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm tracking-tight text-slate-800 dark:text-white">Universal File Toolkit</span>
          <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-500 dark:text-sky-400 border border-sky-500/20">
            PRO
          </span>
        </div>
      </div>

      {/* Center status or quick file info */}
      <div className="titlebar-no-drag hidden md:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        {store.activeFile ? (
          <span className="bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 truncate max-w-xs">
            📄 {store.activeFile.name}
          </span>
        ) : (
          <span className="text-slate-400 dark:text-slate-500 text-[11px]">Ready for files</span>
        )}
      </div>

      {/* Right Action Tools & Window Controls */}
      <div className="titlebar-no-drag flex items-center gap-1.5">
        {/* Floating Drop Target Pill */}
        <button
          onClick={toggleFloating}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border transition-colors ${
            floatingVisible
              ? 'bg-sky-50 dark:bg-sky-500/20 text-sky-600 dark:text-sky-300 border-sky-300 dark:border-sky-500/40 hover:bg-sky-100 dark:hover:bg-sky-500/30'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
          }`}
          title="Toggle Always-on-Top Floating Desktop Drop Target"
        >
          <span className={`w-2 h-2 rounded-full ${floatingVisible ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
          <span>Desktop Target</span>
        </button>

        {/* Batch Queue Pill */}
        {store.batchItems.length > 0 && (
          <button
            onClick={() => store.setActiveModal('batch_queue')}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 hover:bg-indigo-100 dark:hover:bg-indigo-500/30 transition-colors mr-1"
            title="Open Batch Queue"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Batch ({store.batchItems.length})</span>
          </button>
        )}

        {/* View Layout Toggle: Radial vs Grid */}
        <button
          onClick={toggleMenuLayout}
          className="p-1.5 rounded-md hover:bg-slate-200/80 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          title={`Switch to ${store.settings.menuLayout === 'radial' ? 'Grid View' : 'Radial Menu'}`}
        >
          {store.settings.menuLayout === 'radial' ? (
            <LayoutGrid className="w-4 h-4" />
          ) : (
            <Compass className="w-4 h-4" />
          )}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-md hover:bg-slate-200/80 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          title="Toggle Dark / Light Theme"
        >
          {store.settings.theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* Settings */}
        <button
          onClick={() => store.setActiveModal('settings')}
          className="p-1.5 rounded-md hover:bg-slate-200/80 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors mr-2"
          title="Settings & Windows Integration"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>

        <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700/80 mx-1" />

        {/* Windows Native-Style Control Buttons */}
        <button
          onClick={handleMinimize}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-200/80 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          title="Minimize"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleMaximize}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-200/80 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          title={isMaximized ? 'Restore' : 'Maximize'}
        >
          {isMaximized ? (
            <Copy className="w-3.5 h-3.5 rotate-180" />
          ) : (
            <Square className="w-3.5 h-3.5" />
          )}
        </button>

        <button
          onClick={handleClose}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-red-500 text-slate-600 dark:text-slate-400 hover:text-white transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
