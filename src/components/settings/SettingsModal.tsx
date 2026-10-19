import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useAppStore } from '../../store/useAppStore';
import { 
  Settings as SettingsIcon, 
  FolderOpen, 
  Check, 
  Sparkles, 
  Sun, 
  Moon, 
  Monitor, 
  Sliders, 
  Layers, 
  CheckCircle2 
} from 'lucide-react';

export const SettingsModal: React.FC = () => {
  const store = useAppStore();
  const isOpen = store.activeModal === 'settings';

  const [contextMenuStatus, setContextMenuStatus] = useState<string | null>(null);

  const handleSelectFolder = async () => {
    if (!window.electronAPI) return;
    const folder = await window.electronAPI.openFolderDialog();
    if (folder) {
      store.updateSettings({ customSaveDirectory: folder });
    }
  };

  const handleInstallContextMenu = async () => {
    if (!window.electronAPI) return;
    const res = await window.electronAPI.installContextMenu();
    setContextMenuStatus(res.message);
    store.showToast(res.message, res.success ? 'success' : 'error');
  };

  const handleUninstallContextMenu = async () => {
    if (!window.electronAPI) return;
    const res = await window.electronAPI.uninstallContextMenu();
    setContextMenuStatus(res.message);
    store.showToast(res.message, res.success ? 'success' : 'error');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => store.setActiveModal(null)}
      title="Settings & Preferences"
      subtitle="Configure output directories, appearance, default qualities, and Windows shell integration."
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Appearance & Themes */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
            Interface Theme
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'dark', label: 'Dark Mode', icon: Moon },
              { id: 'light', label: 'Light Mode', icon: Sun },
              { id: 'system', label: 'System Default', icon: Monitor },
            ].map((t) => {
              const Icon = t.icon;
              const isSelected = store.settings.theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => store.updateSettings({ theme: t.id as any })}
                  className={`p-3 rounded-2xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-sky-500/20 border-sky-400 text-sky-300 shadow-md'
                      : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* File Saving Rules */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            File Export & Saving Behavior
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-xs font-semibold text-white block">Save beside original file</span>
              <span className="text-[11px] text-slate-400">
                Automatically saves modified files next to original with suffix (e.g. _edited.png)
              </span>
            </div>
            <input
              type="checkbox"
              checked={store.settings.defaultSaveBesideOriginal}
              onChange={(e) => store.updateSettings({ defaultSaveBesideOriginal: e.target.checked })}
              className="accent-sky-500 rounded w-4 h-4"
            />
          </label>

          {!store.settings.defaultSaveBesideOriginal && (
            <div className="pt-2 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-300 block mb-1.5">Custom Output Folder</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={store.settings.customSaveDirectory || 'No folder selected'}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300"
                />
                <button
                  onClick={handleSelectFolder}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-sky-400 flex items-center gap-1.5"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Browse</span>
                </button>
              </div>
            </div>
          )}

          <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-slate-800">
            <div>
              <span className="text-xs font-semibold text-white block">Reveal in Windows Explorer after export</span>
              <span className="text-[11px] text-slate-400">
                Automatically opens the destination folder highlighting the new file
              </span>
            </div>
            <input
              type="checkbox"
              checked={store.settings.openFolderAfterSave}
              onChange={(e) => store.updateSettings({ openFolderAfterSave: e.target.checked })}
              className="accent-sky-500 rounded w-4 h-4"
            />
          </label>
        </div>

        {/* Windows Explorer Context Menu Integration */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Windows Explorer Context Menu
            </span>
            <p className="text-xs text-slate-400">
              Add "Open with Universal File Toolkit" to Windows right-click context menu for instantaneous 1-click access.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleInstallContextMenu}
              className="px-4 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-300 text-xs font-bold transition-colors"
            >
              Add to Windows Right-Click Menu
            </button>
            <button
              onClick={handleUninstallContextMenu}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white text-xs font-semibold transition-colors"
            >
              Remove Menu Shortcut
            </button>
          </div>

          {contextMenuStatus && (
            <p className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5">
              {contextMenuStatus}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-4 border-t border-slate-800">
          <button
            onClick={() => store.setActiveModal(null)}
            className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-lg shadow-sky-500/25 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
};
