import { AlertTriangle, CheckCircle2, Clock, ListTodo } from 'lucide-react';

interface DashboardSummaryProps {
  total: number;
  pending: number;
  completed: number;
  overdue: number;
  completionRate: number;
}

export function DashboardSummary({
  total,
  pending,
  completed,
  overdue,
  completionRate,
}: DashboardSummaryProps) {
  const cards = [
    {
      label: 'Total Tasks',
      value: total,
      detail: 'All recorded items',
      icon: ListTodo,
      iconColor: 'text-blue-600 dark:text-blue-400',
      valueColor: 'text-slate-900 dark:text-slate-50',
    },
    {
      label: 'Pending',
      value: pending,
      detail: 'Active in queue',
      icon: Clock,
      iconColor: 'text-amber-600 dark:text-amber-400',
      valueColor: 'text-slate-900 dark:text-slate-50',
    },
    {
      label: 'Completed',
      value: completed,
      detail: `${completionRate}% completion rate`,
      icon: CheckCircle2,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      valueColor: 'text-slate-900 dark:text-slate-50',
    },
    {
      label: 'Overdue',
      value: overdue,
      detail: overdue > 0 ? 'Requires attention' : 'On schedule',
      icon: AlertTriangle,
      iconColor:
        overdue > 0
          ? 'text-rose-600 dark:text-rose-400'
          : 'text-slate-400 dark:text-slate-500',
      valueColor:
        overdue > 0
          ? 'text-rose-600 dark:text-rose-400'
          : 'text-slate-900 dark:text-slate-50',
    },
  ];

  return (
    <section aria-label="Task summary" className="space-y-4">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 transition-colors"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400 truncate">
                  {card.label}
                </span>
                <Icon className={`w-4 h-4 shrink-0 ${card.iconColor}`} />
              </div>
              <div
                className={`font-display text-3xl font-bold tracking-tight tabular-nums ${card.valueColor}`}
              >
                {card.value}
              </div>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {card.detail}
              </p>
            </div>
          );
        })}
      </div>

      <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-xl px-5 py-4">
        <div className="flex items-center justify-between gap-4 mb-2.5">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
              Overall Completion
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {completed} of {total} tasks finished
            </span>
          </div>
          <span className="font-mono-tabular text-sm font-semibold text-blue-600 dark:text-blue-400">
            {completionRate}%
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={completionRate}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Task completion percentage"
          className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"
        >
          <div
            className="h-full rounded-full bg-blue-600 dark:bg-blue-500 transition-[width] duration-300 ease-out"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>
    </section>
  );
}
