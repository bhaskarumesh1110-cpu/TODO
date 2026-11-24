import { PRIORITIES, TASK_STATUSES } from '../src/types/task.ts';
import type {
  CreateTaskPayload,
  Priority,
  TaskStatus,
  UpdateTaskPayload,
} from '../src/types/task.ts';

export interface ValidationResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateString(value: string): boolean {
  if (!DATE_REGEX.test(value)) return false;
  const [yearStr, monthStr, dayStr] = value.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

function isPriority(value: unknown): value is Priority {
  return typeof value === 'string' && (PRIORITIES as readonly string[]).includes(value);
}

function isTaskStatus(value: unknown): value is TaskStatus {
  return typeof value === 'string' && (TASK_STATUSES as readonly string[]).includes(value);
}

export function validateCreateTask(body: unknown): ValidationResult<CreateTaskPayload> {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Request body must be a JSON object.' };
  }

  const record = body as Record<string, unknown>;
  const rawTitle = typeof record.title === 'string' ? record.title.trim() : '';
  if (!rawTitle) {
    return { ok: false, error: 'Task title is required and cannot be empty.' };
  }
  if (rawTitle.length > 180) {
    return { ok: false, error: 'Task title must be 180 characters or fewer.' };
  }

  const rawDescription =
    typeof record.description === 'string' ? record.description.trim() : '';
  if (rawDescription.length > 2000) {
    return { ok: false, error: 'Description must be 2000 characters or fewer.' };
  }

  if (!isPriority(record.priority)) {
    return { ok: false, error: 'Priority must be High, Medium, or Low.' };
  }

  const rawCategory =
    typeof record.category === 'string' ? record.category.trim() : '';
  if (!rawCategory) {
    return { ok: false, error: 'Category is required.' };
  }
  if (rawCategory.length > 60) {
    return { ok: false, error: 'Category must be 60 characters or fewer.' };
  }

  const rawDueDate =
    typeof record.due_date === 'string' ? record.due_date.trim() : '';
  if (!isValidDateString(rawDueDate)) {
    return { ok: false, error: 'Due date must be a valid date (YYYY-MM-DD).' };
  }

  let status: TaskStatus = 'Pending';
  if (record.status !== undefined) {
    if (!isTaskStatus(record.status)) {
      return { ok: false, error: 'Status must be Pending or Completed.' };
    }
    status = record.status;
  }

  return {
    ok: true,
    data: {
      title: rawTitle,
      description: rawDescription,
      priority: record.priority,
      category: rawCategory,
      due_date: rawDueDate,
      status,
    },
  };
}

export function validateUpdateTask(body: unknown): ValidationResult<UpdateTaskPayload> {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Request body must be a JSON object.' };
  }

  const record = body as Record<string, unknown>;
  const payload: UpdateTaskPayload = {};

  if (record.title !== undefined) {
    if (typeof record.title !== 'string' || !record.title.trim()) {
      return { ok: false, error: 'Task title cannot be empty.' };
    }
    if (record.title.trim().length > 180) {
      return { ok: false, error: 'Task title must be 180 characters or fewer.' };
    }
    payload.title = record.title.trim();
  }

  if (record.description !== undefined) {
    if (typeof record.description !== 'string') {
      return { ok: false, error: 'Description must be a string.' };
    }
    if (record.description.trim().length > 2000) {
      return { ok: false, error: 'Description must be 2000 characters or fewer.' };
    }
    payload.description = record.description.trim();
  }

  if (record.priority !== undefined) {
    if (!isPriority(record.priority)) {
      return { ok: false, error: 'Priority must be High, Medium, or Low.' };
    }
    payload.priority = record.priority;
  }

  if (record.category !== undefined) {
    if (typeof record.category !== 'string' || !record.category.trim()) {
      return { ok: false, error: 'Category cannot be empty.' };
    }
    if (record.category.trim().length > 60) {
      return { ok: false, error: 'Category must be 60 characters or fewer.' };
    }
    payload.category = record.category.trim();
  }

  if (record.due_date !== undefined) {
    if (typeof record.due_date !== 'string' || !isValidDateString(record.due_date.trim())) {
      return { ok: false, error: 'Due date must be a valid date (YYYY-MM-DD).' };
    }
    payload.due_date = record.due_date.trim();
  }

  if (record.status !== undefined) {
    if (!isTaskStatus(record.status)) {
      return { ok: false, error: 'Status must be Pending or Completed.' };
    }
    payload.status = record.status;
  }

  if (Object.keys(payload).length === 0) {
    return { ok: false, error: 'At least one valid field is required to update.' };
  }

  return { ok: true, data: payload };
}
