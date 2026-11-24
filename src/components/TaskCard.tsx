import {
  Calendar,
  Check,
  Flag,
  Pencil,
  Trash2,
} from 'lucide-react';
import { motion } from 'motion/react';
import type { Priority, Task } from '../types/task';
import {
  formatDisplayDate,
  isTaskDueToday,
  isTaskOverdue,
} from '../utils/date';

interface TaskCardProps {
  task: Task;
  onToggleStatus: (task: Task) => void;
  onEdit: (task: Task) => void;
  onRequestDelete: (task: Task) => void;
  isUpdating?: boolean;
}

const PRIORITY_STYLES: Record<
  Priority,
  {
    textClass: string;
    label: string;
    cardHoverClass: string;
  }
> = {
  High: {
    textClass: 'text-rose-700 dark:text-rose-400',
    label: 'High priority',
    cardHoverClass: 'hover:border-rose-300/80 dark:hover:border-rose-800/70',
  },
  Medium: {
    textClass: 'text-amber-700 dark:text-amber-400',
    label: 'Medium priority',
    cardHoverClass: 'hover:border-amber-300/80 dark:hover:border-amber-800/70',
  },
  Low: {
    textClass: 'text-teal-700 dark:text-teal-400',
    label: 'Low priority',
    cardHoverClass: 'hover:border-teal-300/80 dark:hover:border-teal-800/70',
  },
};

export function TaskCard({
  task,
  onToggleStatus,
  onEdit,
  onRequestDelete,
  isUpdating = false,
}: TaskCardProps) {
  const isCompleted = task.status === 'Completed';
  const overdue = isTaskOverdue(task);
  const dueToday = isTaskDueToday(task);
  const priorityStyle = PRIORITY_STYLES[task.priority];

  return (
    <motion.article
      layout="position"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
      className={`group bg-white/95 dark:bg-slate-900/90 border border-slate-200/85 dark:border-slate-800 rounded-xl p-5 transition-colors duration-150 ${
        priorityStyle.cardHoverClass
      } ${isCompleted ? 'opacity-80' : ''}`}
    >
      <div className="flex items-start gap-4">
        <button
          type="button"
          onClick={() => onToggleStatus(task)}
          disabled={isUpdating}
          aria-label={
            isCompleted
              ? `Mark "${task.title}" as pending`
              : `Mark "${task.title}" as completed`
          }
          aria-pressed={isCompleted}
          className={`mt-0.5 w-6 h-6 rounded-md border flex items-center justify-center shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 cursor-pointer ${
            isCompleted
              ? 'bg-emerald-600 border-emerald-600 text-white dark:bg-emerald-500 dark:border-emerald-500'
              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-blue-600 dark:hover:border-blue-400'
          }`}
        >
          {isCompleted && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3
                className={`font-display text-base font-semibold leading-snug break-words ${
                  isCompleted
                    ? 'line-through text-slate-500 dark:text-slate-400'
                    : 'text-slate-900 dark:text-slate-100'
                }`}
              >
                {task.title}
              </h3>

              {task.description && (
                <p
                  className={`mt-1.5 text-sm leading-relaxed break-words ${
                    isCompleted
                      ? 'text-slate-400 dark:text-slate-500'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {task.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0 -mt-1 -mr-1">
              <button
                type="button"
                onClick={() => onEdit(task)}
                aria-label={`Edit "${task.title}"`}
                className="h-10 w-10 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 cursor-pointer"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onRequestDelete(task)}
                aria-label={`Delete "${task.title}"`}
                className="h-10 w-10 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs">
            <span
              className={`inline-flex items-center gap-1.5 font-medium ${priorityStyle.textClass}`}
            >
              <Flag className="w-3.5 h-3.5 shrink-0" />
              <span>{priorityStyle.label}</span>
            </span>

            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
              ·
            </span>

            <span className="text-slate-600 dark:text-slate-400 font-medium">
              {task.category}
            </span>

            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
              ·
            </span>

            <span
              className={`inline-flex items-center gap-1.5 font-mono-tabular ${
                overdue
                  ? 'text-rose-600 dark:text-rose-400 font-medium'
                  : dueToday
                  ? 'text-amber-600 dark:text-amber-400 font-medium'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>
                {formatDisplayDate(task.due_date)}
                {overdue ? ' (Overdue)' : dueToday ? ' (Today)' : ''}
              </span>
            </span>

            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
              ·
            </span>

            <span
              className={`font-medium ${
                isCompleted
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {task.status}
            </span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
