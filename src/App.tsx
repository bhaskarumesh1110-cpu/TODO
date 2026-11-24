import { useCallback, useEffect, useMemo, useState } from 'react';
import { Menu, Plus, RefreshCw } from 'lucide-react';
import { AnimatePresence, MotionConfig } from 'motion/react';
import {
  createTask,
  deleteTask,
  fetchTasks,
  updateTask,
} from './api/tasks';
import { DashboardSummary } from './components/DashboardSummary';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { Sidebar } from './components/Sidebar';
import type { NavView } from './components/Sidebar';
import { TaskCard } from './components/TaskCard';
import { TaskModal } from './components/TaskModal';
import { TaskToolbar } from './components/TaskToolbar';
import type {
  PriorityFilter,
  SortOption,
  StatusFilter,
} from './components/TaskToolbar';
import { ToastContainer } from './components/ToastContainer';
import type { ToastMessage } from './components/ToastContainer';
import { TASK_CATEGORIES } from './types/task';
import type { CreateTaskPayload, Priority, Task } from './types/task';
import { isTaskOverdue } from './utils/date';

const PRIORITY_WEIGHT: Record<Priority, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};

const VIEW_TITLES: Record<NavView, string> = {
  all: 'All Tasks',
  pending: 'Pending Tasks',
  completed: 'Completed Tasks',
  overdue: 'Overdue Tasks',
};

function getInitialTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem('cadence-theme');
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [activeView, setActiveView] = useState<NavView>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [sortBy, setSortBy] = useState<SortOption>('due_asc');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [updatingTaskIds, setUpdatingTaskIds] = useState<Record<number, boolean>>({});
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    window.localStorage.setItem('cadence-theme', theme);
  }, [theme]);

  const addToast = useCallback((type: 'success' | 'error', text: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, type, text }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 3500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const loadAllTasks = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchTasks();
      setTasks(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load tasks.';
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllTasks();
  }, [loadAllTasks]);

  const metrics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'Completed').length;
    const pending = total - completed;
    const overdue = tasks.filter((t) => isTaskOverdue(t)).length;
    const completionRate =
      total === 0 ? 0 : Math.round((completed / total) * 100);

    const byCategory: Record<string, number> = {};
    for (const cat of TASK_CATEGORIES) {
      byCategory[cat] = 0;
    }
    for (const task of tasks) {
      byCategory[task.category] = (byCategory[task.category] ?? 0) + 1;
    }

    return {
      total,
      pending,
      completed,
      overdue,
      completionRate,
      byCategory,
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const filtered = tasks.filter((task) => {
      if (activeView === 'pending' && task.status !== 'Pending') return false;
      if (activeView === 'completed' && task.status !== 'Completed') return false;
      if (activeView === 'overdue' && !isTaskOverdue(task)) return false;

      if (activeView === 'all' && statusFilter !== 'All') {
        if (task.status !== statusFilter) return false;
      }

      if (
        selectedCategory !== 'All' &&
        task.category.toLowerCase() !== selectedCategory.toLowerCase()
      ) {
        return false;
      }

      if (priorityFilter !== 'All' && task.priority !== priorityFilter) {
        return false;
      }

      if (q) {
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc = task.description.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc) return false;
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'due_asc') {
        const cmp = a.due_date.localeCompare(b.due_date);
        return cmp !== 0 ? cmp : b.id - a.id;
      }
      if (sortBy === 'due_desc') {
        const cmp = b.due_date.localeCompare(a.due_date);
        return cmp !== 0 ? cmp : b.id - a.id;
      }
      if (sortBy === 'priority_desc') {
        const cmp = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
        return cmp !== 0 ? cmp : a.due_date.localeCompare(b.due_date);
      }
      return b.id - a.id;
    });
  }, [
    tasks,
    activeView,
    statusFilter,
    selectedCategory,
    priorityFilter,
    searchQuery,
    sortBy,
  ]);

  const pendingSectionTasks = useMemo(
    () => filteredTasks.filter((t) => t.status === 'Pending'),
    [filteredTasks]
  );

  const completedSectionTasks = useMemo(
    () => filteredTasks.filter((t) => t.status === 'Completed'),
    [filteredTasks]
  );

  const handleOpenCreate = () => {
    setEditingTask(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  const handleSaveTask = async (
    payload: CreateTaskPayload,
    taskId?: number
  ) => {
    if (taskId !== undefined) {
      const updated = await updateTask(taskId, payload);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      addToast('success', `Updated "${updated.title}".`);
    } else {
      const created = await createTask(payload);
      setTasks((prev) => [created, ...prev]);
      addToast('success', `Created "${created.title}".`);
    }
  };

  const handleToggleStatus = async (task: Task) => {
    const nextStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    setUpdatingTaskIds((prev) => ({ ...prev, [task.id]: true }));
    try {
      const updated = await updateTask(task.id, { status: nextStatus });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
      addToast(
        'success',
        nextStatus === 'Completed'
          ? `Marked "${updated.title}" as completed.`
          : `Moved "${updated.title}" back to pending.`
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to update task status.';
      addToast('error', message);
    } finally {
      setUpdatingTaskIds((prev) => {
        const next = { ...prev };
        delete next[task.id];
        return next;
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    setDeleting(true);
    try {
      await deleteTask(taskToDelete.id);
      setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
      addToast('success', `Deleted "${taskToDelete.title}".`);
      setTaskToDelete(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to delete task.';
      addToast('error', message);
    } finally {
      setDeleting(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setPriorityFilter('All');
    setStatusFilter('All');
    setSelectedCategory('All');
    setActiveView('all');
  };

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    priorityFilter !== 'All' ||
    statusFilter !== 'All' ||
    selectedCategory !== 'All' ||
    activeView !== 'all';

  const showSplitSections =
    activeView === 'all' && statusFilter === 'All';

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen app-gradient-bg text-slate-900 dark:text-slate-100 flex transition-colors duration-200">
        <Sidebar
          activeView={activeView}
          onSelectView={(view) => {
            setActiveView(view);
            if (view !== 'all') setStatusFilter('All');
          }}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          counts={{
            all: metrics.total,
            pending: metrics.pending,
            completed: metrics.completed,
            overdue: metrics.overdue,
            byCategory: metrics.byCategory,
          }}
          theme={theme}
          onToggleTheme={() =>
            setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
          }
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        <div className="flex-1 min-w-0 flex flex-col">
          <header className="sticky top-0 z-30 h-16 px-4 sm:px-8 border-b border-slate-200/80 dark:border-slate-800/90 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open navigation menu"
                className="lg:hidden h-10 w-10 -ml-2 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 text-sm min-w-0 truncate">
                <span className="text-slate-500 dark:text-slate-400 hidden sm:inline">
                  Workspace
                </span>
                <span
                  aria-hidden="true"
                  className="text-slate-300 dark:text-slate-700 hidden sm:inline"
                >
                  /
                </span>
                <h1 className="font-display text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {VIEW_TITLES[activeView]}
                  {selectedCategory !== 'All' ? ` · ${selectedCategory}` : ''}
                </h1>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>New Task</span>
            </button>
          </header>

          <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
            <DashboardSummary
              total={metrics.total}
              pending={metrics.pending}
              completed={metrics.completed}
              overdue={metrics.overdue}
              completionRate={metrics.completionRate}
            />

            <TaskToolbar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              priorityFilter={priorityFilter}
              onPriorityFilterChange={setPriorityFilter}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              hideStatusFilter={activeView !== 'all'}
            />

            {loadError ? (
              <div
                role="alert"
                className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800/70 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                    Unable to load tasks
                  </h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {loadError}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadAllTasks}
                  className="inline-flex items-center gap-2 px-4 h-10 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Retry</span>
                </button>
              </div>
            ) : loading ? (
              <div aria-label="Loading tasks" className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-28 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 animate-pulse"
                  />
                ))}
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-xl px-6 py-14 text-center">
                <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {tasks.length === 0
                    ? 'No tasks created yet'
                    : 'No matching tasks found'}
                </h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                  {tasks.length === 0
                    ? 'Create your first task with a title, priority, category, and due date to start tracking your progress.'
                    : 'Try adjusting your search query, priority filter, or selected view.'}
                </p>
                <div className="mt-6 flex items-center justify-center gap-3">
                  {hasActiveFilters && tasks.length > 0 ? (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="px-4 h-10 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleOpenCreate}
                    className="inline-flex items-center gap-2 px-5 h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{tasks.length === 0 ? 'Create First Task' : 'New Task'}</span>
                  </button>
                </div>
              </div>
            ) : showSplitSections ? (
              <div className="space-y-8">
                <section aria-label="Pending tasks" className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2.5">
                    <h2 className="font-display text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Pending Tasks
                    </h2>
                    <span className="font-mono-tabular text-xs text-slate-500 dark:text-slate-400">
                      {pendingSectionTasks.length}
                    </span>
                  </div>
                  {pendingSectionTasks.length === 0 ? (
                    <p className="py-6 text-sm text-slate-500 dark:text-slate-400 text-center bg-white/60 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      All filtered tasks are completed.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      <AnimatePresence initial={false}>
                        {pendingSectionTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            onToggleStatus={handleToggleStatus}
                            onEdit={handleOpenEdit}
                            onRequestDelete={setTaskToDelete}
                            isUpdating={Boolean(updatingTaskIds[task.id])}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </section>

                <section aria-label="Completed tasks" className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2.5">
                    <h2 className="font-display text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Completed Tasks
                    </h2>
                    <span className="font-mono-tabular text-xs text-slate-500 dark:text-slate-400">
                      {completedSectionTasks.length}
                    </span>
                  </div>
                  {completedSectionTasks.length === 0 ? (
                    <p className="py-6 text-sm text-slate-500 dark:text-slate-400 text-center bg-white/60 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      No completed tasks match the current filter.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      <AnimatePresence initial={false}>
                        {completedSectionTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            onToggleStatus={handleToggleStatus}
                            onEdit={handleOpenEdit}
                            onRequestDelete={setTaskToDelete}
                            isUpdating={Boolean(updatingTaskIds[task.id])}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </section>
              </div>
            ) : (
              <section aria-label="Filtered tasks" className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2.5">
                  <h2 className="font-display text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {VIEW_TITLES[activeView]}
                  </h2>
                  <span className="font-mono-tabular text-xs text-slate-500 dark:text-slate-400">
                    {filteredTasks.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <AnimatePresence initial={false}>
                    {filteredTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggleStatus={handleToggleStatus}
                        onEdit={handleOpenEdit}
                        onRequestDelete={setTaskToDelete}
                        isUpdating={Boolean(updatingTaskIds[task.id])}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            )}
          </main>
        </div>

        <TaskModal
          isOpen={modalOpen}
          editingTask={editingTask}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSaveTask}
        />

        <DeleteConfirmModal
          task={taskToDelete}
          deleting={deleting}
          onCancel={() => setTaskToDelete(null)}
          onConfirm={handleConfirmDelete}
        />

        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    </MotionConfig>
  );
}
