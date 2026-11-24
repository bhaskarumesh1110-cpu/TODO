import fs from 'node:fs/promises';
import path from 'node:path';
import mysql from 'mysql2/promise';
import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import type {
  CreateTaskPayload,
  Task,
  UpdateTaskPayload,
} from '../src/types/task.ts';

interface TaskRow extends RowDataPacket {
  id: number;
  title: string;
  description: string | null;
  priority: 'High' | 'Medium' | 'Low';
  category: string;
  due_date: Date | string;
  status: 'Pending' | 'Completed';
  created_at: Date | string;
}

interface LocalStore {
  nextId: number;
  tasks: Task[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'tasks.json');

let mysqlPool: Pool | null = null;
let mysqlInitialized = false;
let writeQueue: Promise<void> = Promise.resolve();

function isMysqlConfigured(): boolean {
  return Boolean(
    process.env.MYSQL_HOST &&
      process.env.MYSQL_USER &&
      process.env.MYSQL_DATABASE
  );
}

function formatSqlDate(value: Date | string): string {
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return String(value).slice(0, 10);
}

function formatSqlTimestamp(value: Date | string): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString();
}

function mapMysqlRow(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    priority: row.priority,
    category: row.category,
    due_date: formatSqlDate(row.due_date),
    status: row.status,
    created_at: formatSqlTimestamp(row.created_at),
  };
}

async function getMysqlPool(): Promise<Pool> {
  if (!mysqlPool) {
    mysqlPool = mysql.createPool({
      host: process.env.MYSQL_HOST,
      port: Number(process.env.MYSQL_PORT || 3306),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'todo_db',
      waitForConnections: true,
      connectionLimit: 10,
      dateStrings: true,
    });
  }

  if (!mysqlInitialized) {
    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT NOT NULL AUTO_INCREMENT,
        title VARCHAR(180) NOT NULL,
        description TEXT NULL,
        priority ENUM('High', 'Medium', 'Low') NOT NULL DEFAULT 'Medium',
        category VARCHAR(60) NOT NULL DEFAULT 'Work',
        due_date DATE NOT NULL,
        status ENUM('Pending', 'Completed') NOT NULL DEFAULT 'Pending',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    mysqlInitialized = true;
  }

  return mysqlPool;
}

async function readLocalStore(): Promise<LocalStore> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as LocalStore;
    if (
      parsed &&
      typeof parsed.nextId === 'number' &&
      Array.isArray(parsed.tasks)
    ) {
      return parsed;
    }
  } catch (err: unknown) {
    const nodeErr = err as NodeJS.ErrnoException;
    if (nodeErr.code !== 'ENOENT') {
      throw err;
    }
  }
  const initial: LocalStore = { nextId: 1, tasks: [] };
  await writeLocalStoreAtomic(initial);
  return initial;
}

async function writeLocalStoreAtomic(store: LocalStore): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tempPath = path.join(DATA_DIR, `.tasks.${process.pid}.${Date.now()}.tmp`);
  await fs.writeFile(tempPath, JSON.stringify(store, null, 2), 'utf-8');
  await fs.rename(tempPath, DATA_FILE);
}

function enqueueLocalMutation<T>(fn: (store: LocalStore) => Promise<T> | T): Promise<T> {
  const resultPromise = writeQueue.then(async () => {
    const store = await readLocalStore();
    const result = await fn(store);
    await writeLocalStoreAtomic(store);
    return result;
  });
  writeQueue = resultPromise.then(
    () => undefined,
    () => undefined
  );
  return resultPromise;
}

export async function listTasks(): Promise<Task[]> {
  if (isMysqlConfigured()) {
    const pool = await getMysqlPool();
    const [rows] = await pool.query<TaskRow[]>(
      'SELECT id, title, description, priority, category, due_date, status, created_at FROM tasks ORDER BY created_at DESC, id DESC'
    );
    return rows.map(mapMysqlRow);
  }

  const store = await readLocalStore();
  return [...store.tasks].sort((a, b) => b.id - a.id);
}

export async function findTaskById(id: number): Promise<Task | null> {
  if (isMysqlConfigured()) {
    const pool = await getMysqlPool();
    const [rows] = await pool.execute<TaskRow[]>(
      'SELECT id, title, description, priority, category, due_date, status, created_at FROM tasks WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? mapMysqlRow(rows[0]) : null;
  }

  const store = await readLocalStore();
  return store.tasks.find((t) => t.id === id) ?? null;
}

export async function createTaskRecord(payload: CreateTaskPayload): Promise<Task> {
  if (isMysqlConfigured()) {
    const pool = await getMysqlPool();
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO tasks (title, description, priority, category, due_date, status) VALUES (?, ?, ?, ?, ?, ?)',
      [
        payload.title,
        payload.description ?? '',
        payload.priority,
        payload.category,
        payload.due_date,
        payload.status ?? 'Pending',
      ]
    );
    const created = await findTaskById(result.insertId);
    if (!created) {
      throw new Error('Failed to load newly created task.');
    }
    return created;
  }

  return enqueueLocalMutation((store) => {
    const newTask: Task = {
      id: store.nextId++,
      title: payload.title,
      description: payload.description ?? '',
      priority: payload.priority,
      category: payload.category,
      due_date: payload.due_date,
      status: payload.status ?? 'Pending',
      created_at: new Date().toISOString(),
    };
    store.tasks.unshift(newTask);
    return newTask;
  });
}

export async function updateTaskRecord(
  id: number,
  payload: UpdateTaskPayload
): Promise<Task | null> {
  if (isMysqlConfigured()) {
    const pool = await getMysqlPool();
    const setClauses: string[] = [];
    const values: Array<string | number> = [];

    if (payload.title !== undefined) {
      setClauses.push('title = ?');
      values.push(payload.title);
    }
    if (payload.description !== undefined) {
      setClauses.push('description = ?');
      values.push(payload.description);
    }
    if (payload.priority !== undefined) {
      setClauses.push('priority = ?');
      values.push(payload.priority);
    }
    if (payload.category !== undefined) {
      setClauses.push('category = ?');
      values.push(payload.category);
    }
    if (payload.due_date !== undefined) {
      setClauses.push('due_date = ?');
      values.push(payload.due_date);
    }
    if (payload.status !== undefined) {
      setClauses.push('status = ?');
      values.push(payload.status);
    }

    if (setClauses.length === 0) {
      return findTaskById(id);
    }

    values.push(id);
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE tasks SET ${setClauses.join(', ')} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return null;
    }
    return findTaskById(id);
  }

  return enqueueLocalMutation((store) => {
    const index = store.tasks.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const existing = store.tasks[index];
    const updated: Task = {
      ...existing,
      ...(payload.title !== undefined ? { title: payload.title } : {}),
      ...(payload.description !== undefined ? { description: payload.description } : {}),
      ...(payload.priority !== undefined ? { priority: payload.priority } : {}),
      ...(payload.category !== undefined ? { category: payload.category } : {}),
      ...(payload.due_date !== undefined ? { due_date: payload.due_date } : {}),
      ...(payload.status !== undefined ? { status: payload.status } : {}),
    };
    store.tasks[index] = updated;
    return updated;
  });
}

export async function deleteTaskRecord(id: number): Promise<boolean> {
  if (isMysqlConfigured()) {
    const pool = await getMysqlPool();
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM tasks WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  return enqueueLocalMutation((store) => {
    const index = store.tasks.findIndex((t) => t.id === id);
    if (index === -1) return false;
    store.tasks.splice(index, 1);
    return true;
  });
}
