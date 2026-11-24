import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Folder,
  LayoutGrid,
  Moon,
  Sun,
  X,
} from 'lucide-react';
import { TASK_CATEGORIES } from '../types/task';

export type NavView = 'all' | 'pending' | 'completed' | 'overdue';

interface SidebarProps {
  activeView: NavView;
  onSelectView: (view: NavView) => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  counts: {
    all: number;
    pending: number;
    completed: number;
    overdue: number;
    byCategory: Record<string, number>;
  };
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  activeView,
  onSelectView,
  selectedCategory,
  onSelectCategory,
  counts,
  theme,
  onToggleTheme,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const navItems: Array<{
    id: NavView;
    label: string;
    count: number;
    icon: typeof LayoutGrid;
    tone?: string;
  }> = [
    { id: 'all', label: 'All Tasks', count: counts.all, icon: LayoutGrid },
    { id: 'pending', label: 'Pending', count: counts.pending, icon: Clock },
    {
      id: 'completed',
      label: 'Completed',
      count: counts.completed,
      icon: CheckCircle2,
    },
    {
      id: 'overdue',
      label: 'Overdue',
      count: counts.overdue,
      icon: AlertTriangle,
      tone: counts.overdue > 0 ? 'text-rose-600 dark:text-rose-400' : undefined,
    },
  ];

  const handleNavClick = (view: NavView) => {
    onSelectView(view);
    onCloseMobile();
  };

  const handleCategoryClick = (category: string) => {
    onSelectCategory(category);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-r border-slate-200/80 dark:border-slate-800/90">
      <div className="flex items-center justify-between px-6 h-16 border-b border-slate-200/80 dark:border-slate-800/90 shrink-0">
        <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap">
          Cadence
        </span>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="lg:hidden p-2 -mr-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
        <nav aria-label="Task views" className="space-y-1">
          <p className="px-3 pb-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            Views
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 min-h-[40px] rounded-lg text-sm font-medium transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive
                        ? 'text-white'
                        : item.tone || 'text-slate-400 dark:text-slate-500'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </span>
                <span
                  className={`font-mono-tabular text-xs ml-2 ${
                    isActive
                      ? 'text-blue-100'
                      : item.tone || 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {item.count}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="space-y-1">
          <p className="px-3 pb-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            Categories
          </p>
          <button
            type="button"
            onClick={() => handleCategoryClick('All')}
            className={`w-full flex items-center justify-between px-3 min-h-[40px] rounded-lg text-sm font-medium transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
              selectedCategory === 'All'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span className="flex items-center gap-2.5 truncate">
              <Folder className="w-4 h-4 shrink-0 text-slate-400 dark:text-slate-500" />
              <span className="truncate">All Categories</span>
            </span>
            <span className="font-mono-tabular text-xs text-slate-500 dark:text-slate-400 ml-2">
              {counts.all}
            </span>
          </button>

          {TASK_CATEGORIES.map((category) => {
            const count = counts.byCategory[category] ?? 0;
            const isActive = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => handleCategoryClick(category)}
                className={`w-full flex items-center justify-between px-3 min-h-[40px] rounded-lg text-sm font-medium transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                  isActive
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <Folder className="w-4 h-4 shrink-0 text-slate-400 dark:text-slate-500" />
                  <span className="truncate">{category}</span>
                </span>
                <span className="font-mono-tabular text-xs text-slate-500 dark:text-slate-400 ml-2">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 border-t border-slate-200/80 dark:border-slate-800/90 shrink-0">
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={
            theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
          }
          className="w-full flex items-center justify-between px-3 min-h-[42px] rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/60 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          <span className="flex items-center gap-2.5">
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600 shrink-0" />
            )}
            <span className="whitespace-nowrap">
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </span>
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {theme === 'dark' ? 'Dark' : 'Light'}
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] z-50 shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
