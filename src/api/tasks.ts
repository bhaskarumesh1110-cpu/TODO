import type {
  CreateTaskPayload,
  Task,
  UpdateTaskPayload,
} from '../types/task';

async function parseJsonResponse<T>(response: Response): Promise<T> {
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    throw new Error('Invalid server response.');
  }

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === 'object' &&
      'error' in payload &&
      typeof (payload as { error: unknown }).error === 'string'
        ? (payload as { error: string }).error
        : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

export async function fetchTasks(): Promise<Task[]> {
  const res = await fetch('/api/tasks', {
    headers: { Accept: 'application/json' },
  });
  const data = await parseJsonResponse<{ tasks: Task[] }>(res);
  return data.tasks;
}

export async function createTask(payload: CreateTaskPayload): Promise<Task> {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await parseJsonResponse<{ task: Task }>(res);
  return data.task;
}

export async function updateTask(
  id: number,
  payload: UpdateTaskPayload
): Promise<Task> {
  const res = await fetch(`/api/tasks/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await parseJsonResponse<{ task: Task }>(res);
  return data.task;
}

export async function deleteTask(id: number): Promise<void> {
  const res = await fetch(`/api/tasks/${id}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  });
  await parseJsonResponse<{ deleted: boolean; id: number }>(res);
}
