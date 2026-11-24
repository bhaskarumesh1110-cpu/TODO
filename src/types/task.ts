export const PRIORITIES = ['High', 'Medium', 'Low'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const TASK_STATUSES = ['Pending', 'Completed'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_CATEGORIES = [
  'Work',
  'Personal',
  'Finance',
  'Health',
  'Learning',
  'Errands',
] as const;
export type TaskCategory = (typeof TASK_CATEGORIES)[number];

export interface Task {
  id: number;
  title: string;
  description: string;
  priority: Priority;
  category: string;
  due_date: string; // YYYY-MM-DD
  status: TaskStatus;
  created_at: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  priority: Priority;
  category: string;
  due_date: string;
  status?: TaskStatus;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  priority?: Priority;
  category?: string;
  due_date?: string;
  status?: TaskStatus;
}
