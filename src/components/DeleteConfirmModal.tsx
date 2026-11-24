import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import type { Task } from '../types/task';

interface DeleteConfirmModalProps {
  task: Task | null;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmModal({
  task,
  deleting,
  onCancel,
  onConfirm,
}: DeleteConfirmModalProps) {
  useEffect(() => {
    if (!task) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !deleting) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [task, deleting, onCancel]);

  if (!task) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div
        className="fixed inset-0 bg-slate-950/55 backdrop-blur-xs"
        onClick={() => !deleting && onCancel()}
        aria-hidden="true"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="min-w-0">
            <h2
              id="delete-modal-title"
              className="font-display text-base font-semibold text-slate-900 dark:text-slate-100"
            >
              Delete Task
            </h2>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed break-words">
              Are you sure you want to permanently delete{' '}
              <span className="font-medium text-slate-900 dark:text-slate-100">
                “{task.title}”
              </span>
              ? This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="px-4 h-10 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="px-4 h-10 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium transition-colors disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {deleting ? 'Deleting...' : 'Delete Task'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
