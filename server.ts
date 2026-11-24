import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import type { Request, Response } from 'express';
import {
  createTaskRecord,
  deleteTaskRecord,
  findTaskById,
  listTasks,
  updateTaskRecord,
} from './server/db.ts';
import { validateCreateTask, validateUpdateTask } from './server/validation.ts';

const PORT = 3000;

function parseIdParam(rawId: string | string[] | undefined): number | null {
  if (typeof rawId !== 'string' || !/^\d+$/.test(rawId)) {
    return null;
  }
  const num = Number(rawId);
  return Number.isSafeInteger(num) && num > 0 ? num : null;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.get('/api/tasks', async (req: Request, res: Response) => {
    try {
      let tasks = await listTasks();

      const { status, priority, category, search, sort } = req.query;

      if (typeof status === 'string' && (status === 'Pending' || status === 'Completed')) {
        tasks = tasks.filter((t) => t.status === status);
      }

      if (
        typeof priority === 'string' &&
        (priority === 'High' || priority === 'Medium' || priority === 'Low')
      ) {
        tasks = tasks.filter((t) => t.priority === priority);
      }

      if (typeof category === 'string' && category.trim() && category !== 'All') {
        const target = category.trim().toLowerCase();
        tasks = tasks.filter((t) => t.category.toLowerCase() === target);
      }

      if (typeof search === 'string' && search.trim()) {
        const q = search.trim().toLowerCase();
        tasks = tasks.filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q)
        );
      }

      if (sort === 'due_asc') {
        tasks = [...tasks].sort((a, b) => a.due_date.localeCompare(b.due_date));
      } else if (sort === 'due_desc') {
        tasks = [...tasks].sort((a, b) => b.due_date.localeCompare(a.due_date));
      }

      res.json({ tasks });
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      res.status(500).json({ error: 'Unable to load tasks. Please try again.' });
    }
  });

  app.get('/api/tasks/:id', async (req: Request, res: Response) => {
    const id = parseIdParam(req.params.id);
    if (id === null) {
      return res.status(400).json({ error: 'Invalid task ID.' });
    }

    try {
      const task = await findTaskById(id);
      if (!task) {
        return res.status(404).json({ error: 'Task not found.' });
      }
      return res.json({ task });
    } catch (error) {
      console.error('Failed to fetch task:', error);
      return res.status(500).json({ error: 'Unable to load task.' });
    }
  });

  app.post('/api/tasks', async (req: Request, res: Response) => {
    const validation = validateCreateTask(req.body);
    if (!validation.ok || !validation.data) {
      return res.status(400).json({ error: validation.error });
    }

    try {
      const task = await createTaskRecord(validation.data);
      return res.status(201).json({ task });
    } catch (error) {
      console.error('Failed to create task:', error);
      return res.status(500).json({ error: 'Unable to create task. Please try again.' });
    }
  });

  app.put('/api/tasks/:id', async (req: Request, res: Response) => {
    const id = parseIdParam(req.params.id);
    if (id === null) {
      return res.status(400).json({ error: 'Invalid task ID.' });
    }

    const validation = validateCreateTask(req.body);
    if (!validation.ok || !validation.data) {
      return res.status(400).json({ error: validation.error });
    }

    try {
      const task = await updateTaskRecord(id, validation.data);
      if (!task) {
        return res.status(404).json({ error: 'Task not found.' });
      }
      return res.json({ task });
    } catch (error) {
      console.error('Failed to update task:', error);
      return res.status(500).json({ error: 'Unable to update task. Please try again.' });
    }
  });

  app.patch('/api/tasks/:id', async (req: Request, res: Response) => {
    const id = parseIdParam(req.params.id);
    if (id === null) {
      return res.status(400).json({ error: 'Invalid task ID.' });
    }

    const validation = validateUpdateTask(req.body);
    if (!validation.ok || !validation.data) {
      return res.status(400).json({ error: validation.error });
    }

    try {
      const task = await updateTaskRecord(id, validation.data);
      if (!task) {
        return res.status(404).json({ error: 'Task not found.' });
      }
      return res.json({ task });
    } catch (error) {
      console.error('Failed to patch task:', error);
      return res.status(500).json({ error: 'Unable to update task. Please try again.' });
    }
  });

  app.delete('/api/tasks/:id', async (req: Request, res: Response) => {
    const id = parseIdParam(req.params.id);
    if (id === null) {
      return res.status(400).json({ error: 'Invalid task ID.' });
    }

    try {
      const deleted = await deleteTaskRecord(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Task not found.' });
      }
      return res.json({ deleted: true, id });
    } catch (error) {
      console.error('Failed to delete task:', error);
      return res.status(500).json({ error: 'Unable to delete task. Please try again.' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup failed:', err);
  process.exit(1);
});
