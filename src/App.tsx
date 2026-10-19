import React, { useEffect, useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { RadialMenu } from './components/RadialMenu';
import { RadialMenuAltGrid } from './components/RadialMenuAltGrid';
import { CropEditor } from './components/editors/CropEditor';
import { ResizeEditor } from './components/editors/ResizeEditor';
import { CompressEditor } from './components/editors/CompressEditor';
import { ConvertModal } from './components/editors/ConvertModal';
import { BackgroundEditor } from './components/editors/BackgroundEditor';
import { AdjustmentsEditor } from './components/editors/AdjustmentsEditor';
import { AnnotateEditor } from './components/editors/AnnotateEditor';
import { RotateEditor } from './components/editors/RotateEditor';
import { PdfMergeModal } from './components/pdf/PdfMergeModal';
import { PdfSplitModal } from './components/pdf/PdfSplitModal';
import { PdfViewerModal } from './components/pdf/PdfViewerModal';
import { BatchQueueModal } from './components/batch/BatchQueueModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { Toast } from './components/common/Toast';
import { FloatingWidget } from './components/floating/FloatingWidget';

export const App: React.FC = () => {
  const store = useAppStore();
  const [isFloatingMode] = useState<boolean>(() => {
    return window.location.hash === '#floating' || window.location.search.includes('mode=floating');
  });

  useEffect(() => {
    if (isFloatingMode) return;

    // Listen for files passed via command line / Windows Explorer context menu
    let unsubCli: (() => void) | undefined;
    let unsubAction: (() => void) | undefined;

    if (window.electronAPI) {
      unsubCli = window.electronAPI.onCliOpenFile(async (filePath: string) => {
        if (filePath) {
          try {
            const meta = await window.electronAPI.getFileMetadata(filePath);
            store.setActiveFile(meta);
          } catch (err) {
            console.warn('Could not load CLI file argument:', filePath, err);
          }
        }
      });

      unsubAction = window.electronAPI.onOpenWithAction(async ({ filePath, actionId }) => {
        if (filePath) {
          try {
            const meta = await window.electronAPI.getFileMetadata(filePath);
            store.setActiveFile(meta);
            if (actionId) {
              store.setActiveModal(actionId);
            }
          } catch (err) {
            console.warn('Could not load file from floating action:', filePath, err);
          }
        }
      });
    }

    return () => {
      if (unsubCli) unsubCli();
      if (unsubAction) unsubAction();
    };
  }, [store, isFloatingMode]);

  // If running in the transparent floating desktop drop target window
  if (isFloatingMode) {
    return <FloatingWidget />;
  }

  // Otherwise, render full Universal File Toolkit Main Studio
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 select-none transition-colors duration-200">
      {/* Titlebar Header */}
      <Header />

      {/* Main Interactive Screen */}
      <main className="flex-1 relative overflow-hidden">
        {!store.activeFile ? (
          <DropZone />
        ) : store.settings.menuLayout === 'radial' ? (
          <RadialMenu />
        ) : (
          <RadialMenuAltGrid />
        )}
      </main>

      {/* Modals & Visual Editors */}
      <CropEditor />
      <ResizeEditor />
      <CompressEditor />
      <ConvertModal />
      <BackgroundEditor />
      <AdjustmentsEditor />
      <AnnotateEditor />
      <RotateEditor />
      <PdfMergeModal />
      <PdfSplitModal />
      <PdfViewerModal />
      <BatchQueueModal />
      <SettingsModal />

      {/* Global Notification Toast */}
      <Toast />
    </div>
  );
};

export default App;
