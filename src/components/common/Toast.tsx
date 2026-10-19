import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const Toast: React.FC = () => {
  const store = useAppStore();
  const toast = store.toast;

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/95 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 shadow-2xl shadow-slate-300/50 dark:shadow-2xl backdrop-blur-xl animate-slide-up text-xs select-none">
      {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
      {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />}
      {toast.type === 'info' && <Info className="w-4 h-4 text-sky-500 flex-shrink-0" />}

      <span className="text-slate-800 dark:text-slate-200 font-medium">{toast.message}</span>

      {toast.action && (
        <button
          onClick={toast.action.onClick}
          className="ml-2 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-500/20 text-sky-600 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-500/30 font-semibold text-[11px] border border-sky-200 dark:border-sky-500/30 transition-colors"
        >
          {toast.action.label}
        </button>
      )}

      <button
        onClick={() => store.hideToast()}
        className="ml-1 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
