import { ArrowUpDown, Search, X } from 'lucide-react';
import { PRIORITIES } from '../types/task';
import type { Priority, TaskStatus } from '../types/task';

export type SortOption = 'due_asc' | 'due_desc' | 'priority_desc' | 'newest';
export type StatusFilter = 'All' | TaskStatus;
export type PriorityFilter = 'All' | Priority;

interface TaskToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  priorityFilter: PriorityFilter;
  onPriorityFilterChange: (priority: PriorityFilter) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (status: StatusFilter) => void;
  sortBy: SortOption;
  onSortByChange: (sort: SortOption) => void;
  hideStatusFilter?: boolean;
}

export function TaskToolbar({
  searchQuery,
  onSearchChange,
  priorityFilter,
  onPriorityFilterChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortByChange,
  hideStatusFilter = false,
}: TaskToolbarProps) {
  return (
    <section
      aria-label="Search and filter tasks"
      className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3.5"
    >
      <div className="relative flex-1 min-w-0">
        <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search tasks by title..."
          aria-label="Search tasks by title"
          className="w-full h-10 pl-10 pr-9 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/60 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 dark:focus:border-blue-500 transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
        <div
          role="group"
          aria-label="Filter by priority"
          className="flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-800/90"
        >
          {(['All', ...PRIORITIES] as const).map((level) => {
            const active = priorityFilter === level;
            return (
              <button
                key={level}
                type="button"
                onClick={() => onPriorityFilterChange(level)}
                className={`px-3 h-8 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 ${
                  active
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {level}
              </button>
            );
          })}
        </div>

        {!hideStatusFilter && (
          <div
            role="group"
            aria-label="Filter by status"
            className="flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-800/90"
          >
            {(['All', 'Pending', 'Completed'] as const).map((status) => {
              const active = statusFilter === status;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => onStatusFilterChange(status)}
                  className={`px-3 h-8 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 ${
                    active
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {status}
                </button>
              );
            })}
          </div>
        )}

        <div className="relative flex items-center">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 absolute left-3 pointer-events-none" />
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as SortOption)}
            aria-label="Sort tasks"
            className="h-10 pl-8 pr-8 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/60 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-colors cursor-pointer"
          >
            <option value="due_asc">Due Date: Soonest</option>
            <option value="due_desc">Due Date: Latest</option>
            <option value="priority_desc">Priority: High to Low</option>
            <option value="newest">Created: Newest</option>
          </select>
        </div>
      </div>
    </section>
  );
}
