import { Router, Request, Response, NextFunction } from 'express';
import db from '../db';
import { Note, CreateNoteInput, UpdateNoteInput, ApiSuccessResponse } from '../types';
import { NotFoundError, DatabaseError } from '../utils/errors';
import { validateRequired, validateString } from '../utils/validate';

const router = Router();

// GET /api/notes - List all notes
router.get('/', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const notes = db.prepare('SELECT * FROM notes ORDER BY updated_at DESC').all() as Note[];
    const response: ApiSuccessResponse<Note[]> = { data: notes, success: true };
    res.json(response);
  } catch (error) {
    next(new DatabaseError((error as Error).message));
  }
});

// GET /api/notes/:id - Get single note
router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as Note | undefined;

    if (!note) {
      throw new NotFoundError('Note');
    }

    const response: ApiSuccessResponse<Note> = { data: note, success: true };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /api/notes - Create note
router.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, content }: CreateNoteInput = req.body;

    validateRequired(title, 'title');
    validateString(title, 'title');

    if (content !== undefined) {
      validateString(content, 'content');
    }

    const result = db
      .prepare('INSERT INTO notes (title, content) VALUES (?, ?)')
      .run(title, content || null);

    const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(result.lastInsertRowid) as Note;

    const response: ApiSuccessResponse<Note> = { data: note, success: true };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

// PUT /api/notes/:id - Update note
router.put('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, content }: UpdateNoteInput = req.body;

    // Check if note exists
    const existingNote = db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as Note | undefined;
    if (!existingNote) {
      throw new NotFoundError('Note');
    }

    // Validate inputs if provided
    if (title !== undefined) {
      validateString(title, 'title');
    }
    if (content !== undefined) {
      validateString(content, 'content');
    }

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (content !== undefined) {
      updates.push('content = ?');
      values.push(content);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);
    db.prepare(`UPDATE notes SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as Note;

    const response: ApiSuccessResponse<Note> = { data: note, success: true };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/notes/:id - Delete note
router.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = db.prepare('DELETE FROM notes WHERE id = ?').run(id);

    if (result.changes === 0) {
      throw new NotFoundError('Note');
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
