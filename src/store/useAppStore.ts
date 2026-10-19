import { useState, useEffect } from 'react';
import { FileMetadata, AppSettings, BatchItem } from '../types';

export interface ToastInfo {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  action?: {
    label: string;
    onClick: () => void;
  };
}

class AppStateManager {
  private listeners: Set<() => void> = new Set();

  public activeFile: FileMetadata | null = null;
  public recentFiles: FileMetadata[] = [];
  public activeModal: string | null = null;
  public batchItems: BatchItem[] = [];
  public isProcessing: boolean = false;
  public processingProgress: number = 0;
  public processingStatus: string = '';
  public toast: ToastInfo | null = null;
  public isWindowMaximized: boolean = false;

  public settings: AppSettings = {
    theme: 'dark',
    accentColor: '#0ea5e9',
    defaultSaveBesideOriginal: true,
    customSaveDirectory: '',
    openFolderAfterSave: true,
    defaultJpegQuality: 90,
    defaultWebpQuality: 85,
    menuLayout: 'radial',
    showAnimations: true,
  };

  constructor() {
    this.init();
  }

  private async init() {
    if (typeof window !== 'undefined') {
      try {
        const localTheme = localStorage.getItem('uft-theme') as 'dark' | 'light' | 'system' | null;
        if (localTheme) {
          this.settings.theme = localTheme;
          this.applyTheme(localTheme);
        }
      } catch (e) {}

      if (window.electronAPI) {
        try {
          const loadedSettings = await window.electronAPI.getSettings();
          if (loadedSettings) {
            const localTheme = localStorage.getItem('uft-theme') as 'dark' | 'light' | 'system' | null;
            this.settings = {
              ...loadedSettings,
              theme: localTheme || loadedSettings.theme || 'dark',
            };
            this.applyTheme(this.settings.theme);
            this.notify();
          }
          const max = await window.electronAPI.isMaximized();
          this.isWindowMaximized = max;
          this.notify();
        } catch (e) {
          console.warn('Could not initialize electron settings', e);
        }
      }
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public setActiveFile(file: FileMetadata | null) {
    this.activeFile = file;
    if (file) {
      // Add to recent files, avoiding duplicates
      const filtered = this.recentFiles.filter((f) => f.path !== file.path);
      this.recentFiles = [file, ...filtered].slice(0, 8);
    }
    this.notify();
  }

  public setRecentFiles(files: FileMetadata[]) {
    this.recentFiles = files;
    this.notify();
  }

  public setActiveModal(modal: string | null) {
    this.activeModal = modal;
    this.notify();
  }

  public setBatchItems(items: BatchItem[]) {
    this.batchItems = items;
    this.notify();
  }

  public addBatchFiles(files: FileMetadata[]) {
    const newItems: BatchItem[] = files.map((f) => ({
      id: `${f.path}-${Date.now()}-${Math.random()}`,
      file: f,
      status: 'pending',
      progress: 0,
    }));
    this.batchItems = [...this.batchItems, ...newItems];
    this.notify();
  }

  public updateBatchItem(id: string, updates: Partial<BatchItem>) {
    this.batchItems = this.batchItems.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    );
    this.notify();
  }

  public clearBatchItems() {
    this.batchItems = [];
    this.notify();
  }

  public setProcessing(processing: boolean, status = '', progress = 0) {
    this.isProcessing = processing;
    this.processingStatus = status;
    this.processingProgress = progress;
    this.notify();
  }

  public showToast(
    message: string, 
    type: 'success' | 'error' | 'info' = 'info', 
    action?: { label: string; onClick: () => void }
  ) {
    const toastId = `${Date.now()}`;
    this.toast = { id: toastId, message, type, action };
    this.notify();

    setTimeout(() => {
      if (this.toast?.id === toastId) {
        this.toast = null;
        this.notify();
      }
    }, 5000);
  }

  public hideToast() {
    this.toast = null;
    this.notify();
  }

  public async updateSettings(newSettings: Partial<AppSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    if (newSettings.theme) {
      this.applyTheme(newSettings.theme);
    }
    this.notify();

    if (window.electronAPI) {
      await window.electronAPI.saveSettings(newSettings);
    }
  }

  public setMaximized(max: boolean) {
    this.isWindowMaximized = max;
    this.notify();
  }

  public applyTheme(theme: 'dark' | 'light' | 'system') {
    const root = document.documentElement;
    try {
      localStorage.setItem('uft-theme', theme);
    } catch (e) {}

    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }
}

export const appState = new AppStateManager();

export function useAppStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = appState.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsubscribe;
  }, []);

  return appState;
}
