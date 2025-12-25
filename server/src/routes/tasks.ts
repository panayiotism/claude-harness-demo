import { Router, Request, Response, NextFunction } from 'express';
import db from '../db';
import { Task, CreateTaskInput, UpdateTaskInput, ApiSuccessResponse } from '../types';
import { NotFoundError, DatabaseError } from '../utils/errors';
import {
  validateRequired,
  validateString,
  validatePriority,
  validateBoolean,
  validateDate,
} from '../utils/validate';

const router = Router();

// GET /api/tasks - List all tasks
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM tasks';
    const params: any[] = [];

    if (status === 'completed') {
      query += ' WHERE completed = ?';
      params.push(1);
    } else if (status === 'active') {
      query += ' WHERE completed = ?';
      params.push(0);
    }

    query += ' ORDER BY created_at DESC';

    const tasks = db.prepare(query).all(...params) as Task[];

    // Convert SQLite integers to booleans
    const formattedTasks = tasks.map(task => ({
      ...task,
      completed: Boolean(task.completed),
    }));

    const response: ApiSuccessResponse<Task[]> = { data: formattedTasks, success: true };
    res.json(response);
  } catch (error) {
    next(new DatabaseError((error as Error).message));
  }
});

// GET /api/tasks/:id - Get single task
router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task | undefined;

    if (!task) {
      throw new NotFoundError('Task');
    }

    const formattedTask = {
      ...task,
      completed: Boolean(task.completed),
    };

    const response: ApiSuccessResponse<Task> = { data: formattedTask, success: true };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /api/tasks - Create task
router.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, priority = 'medium', due_date }: CreateTaskInput = req.body;

    validateRequired(title, 'title');
    validateString(title, 'title');

    if (priority) {
      validatePriority(priority);
    }

    if (due_date) {
      validateDate(due_date);
    }

    const result = db
      .prepare('INSERT INTO tasks (title, priority, due_date) VALUES (?, ?, ?)')
      .run(title, priority, due_date || null);

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid) as Task;

    const formattedTask = {
      ...task,
      completed: Boolean(task.completed),
    };

    const response: ApiSuccessResponse<Task> = { data: formattedTask, success: true };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

// PUT /api/tasks/:id - Update task
router.put('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, completed, priority, due_date }: UpdateTaskInput = req.body;

    // Check if task exists
    const existingTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task | undefined;
    if (!existingTask) {
      throw new NotFoundError('Task');
    }

    // Validate inputs if provided
    if (title !== undefined) {
      validateString(title, 'title');
    }
    if (completed !== undefined) {
      validateBoolean(completed, 'completed');
    }
    if (priority !== undefined) {
      validatePriority(priority);
    }
    if (due_date !== undefined && due_date !== null) {
      validateDate(due_date);
    }

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (completed !== undefined) {
      updates.push('completed = ?');
      values.push(completed ? 1 : 0);
    }
    if (priority !== undefined) {
      updates.push('priority = ?');
      values.push(priority);
    }
    if (due_date !== undefined) {
      updates.push('due_date = ?');
      values.push(due_date);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);
    db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task;

    const formattedTask = {
      ...task,
      completed: Boolean(task.completed),
    };

    const response: ApiSuccessResponse<Task> = { data: formattedTask, success: true };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);

    if (result.changes === 0) {
      throw new NotFoundError('Task');
    }

    const response: ApiSuccessResponse<{ id: number }> = {
      data: { id: parseInt(id) },
      success: true,
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
