import { Router, Request, Response, NextFunction } from 'express';
import db from '../db';
import { Link, CreateLinkInput, UpdateLinkInput, ReorderLinksInput, ApiSuccessResponse } from '../types';
import { NotFoundError, DatabaseError, ValidationError } from '../utils/errors';
import { validateRequired, validateString, validateUrl, validateNumber } from '../utils/validate';

const router = Router();

// GET /api/links - List all links
router.get('/', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const links = db.prepare('SELECT * FROM links ORDER BY position ASC').all() as Link[];
    const response: ApiSuccessResponse<Link[]> = { data: links, success: true };
    res.json(response);
  } catch (error) {
    next(new DatabaseError((error as Error).message));
  }
});

// POST /api/links - Create link
router.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, url, icon }: CreateLinkInput = req.body;

    validateRequired(title, 'title');
    validateString(title, 'title');
    validateRequired(url, 'url');
    validateString(url, 'url');
    validateUrl(url);

    if (icon !== undefined) {
      validateString(icon, 'icon');
    }

    // Get the maximum position and increment
    const maxPosition = db.prepare('SELECT COALESCE(MAX(position), -1) as max FROM links').get() as {
      max: number;
    };
    const position = maxPosition.max + 1;

    const result = db
      .prepare('INSERT INTO links (title, url, icon, position) VALUES (?, ?, ?, ?)')
      .run(title, url, icon || null, position);

    const link = db.prepare('SELECT * FROM links WHERE id = ?').get(result.lastInsertRowid) as Link;

    const response: ApiSuccessResponse<Link> = { data: link, success: true };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

// PUT /api/links/:id - Update link
router.put('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, url, icon }: UpdateLinkInput = req.body;

    // Check if link exists
    const existingLink = db.prepare('SELECT * FROM links WHERE id = ?').get(id) as Link | undefined;
    if (!existingLink) {
      throw new NotFoundError('Link');
    }

    // Validate inputs if provided
    if (title !== undefined) {
      validateString(title, 'title');
    }
    if (url !== undefined) {
      validateString(url, 'url');
      validateUrl(url);
    }
    if (icon !== undefined) {
      validateString(icon, 'icon');
    }

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (url !== undefined) {
      updates.push('url = ?');
      values.push(url);
    }
    if (icon !== undefined) {
      updates.push('icon = ?');
      values.push(icon);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);
    db.prepare(`UPDATE links SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const link = db.prepare('SELECT * FROM links WHERE id = ?').get(id) as Link;

    const response: ApiSuccessResponse<Link> = { data: link, success: true };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// PUT /api/links/reorder - Reorder links
router.put('/reorder', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { links }: ReorderLinksInput = req.body;

    if (!Array.isArray(links)) {
      throw new ValidationError('links must be an array');
    }

    // Validate each link entry
    for (const link of links) {
      if (!link.id || !Number.isInteger(link.id)) {
        throw new ValidationError('Each link must have a valid id');
      }
      validateNumber(link.position, 'position');
    }

    // Update positions in a transaction
    const updateStmt = db.prepare('UPDATE links SET position = ? WHERE id = ?');
    db.transaction(() => {
      for (const link of links) {
        updateStmt.run(link.position, link.id);
      }
    })();

    const allLinks = db.prepare('SELECT * FROM links ORDER BY position ASC').all() as Link[];
    const response: ApiSuccessResponse<Link[]> = { data: allLinks, success: true };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/links/:id - Delete link
router.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = db.prepare('DELETE FROM links WHERE id = ?').run(id);

    if (result.changes === 0) {
      throw new NotFoundError('Link');
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
