import { Router, Request, Response, NextFunction } from 'express';
import db from '../db';
import {
  PomodoroSession,
  CreatePomodoroSessionInput,
  PomodoroStats,
  ApiSuccessResponse,
} from '../types';
import { DatabaseError } from '../utils/errors';
import { validateRequired, validatePositiveNumber } from '../utils/validate';

const router = Router();

// POST /api/pomodoro/session - Log completed session
router.post('/session', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { duration }: CreatePomodoroSessionInput = req.body;

    validateRequired(duration, 'duration');
    validatePositiveNumber(duration, 'duration');

    const result = db
      .prepare('INSERT INTO pomodoro_sessions (duration) VALUES (?)')
      .run(duration);

    const session = db
      .prepare('SELECT * FROM pomodoro_sessions WHERE id = ?')
      .get(result.lastInsertRowid) as PomodoroSession;

    const response: ApiSuccessResponse<PomodoroSession> = { data: session, success: true };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/pomodoro/stats - Get session statistics
router.get('/stats', (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Total sessions and minutes
    const totalStats = db
      .prepare(
        `SELECT
          COUNT(*) as total_sessions,
          COALESCE(SUM(duration), 0) as total_minutes
        FROM pomodoro_sessions`
      )
      .get() as { total_sessions: number; total_minutes: number };

    // Sessions today
    const todayStats = db
      .prepare(
        `SELECT COUNT(*) as sessions_today
        FROM pomodoro_sessions
        WHERE DATE(completed_at) = DATE('now')`
      )
      .get() as { sessions_today: number };

    // Sessions this week
    const weekStats = db
      .prepare(
        `SELECT COUNT(*) as sessions_this_week
        FROM pomodoro_sessions
        WHERE DATE(completed_at) >= DATE('now', '-7 days')`
      )
      .get() as { sessions_this_week: number };

    const stats: PomodoroStats = {
      total_sessions: totalStats.total_sessions,
      total_minutes: totalStats.total_minutes,
      sessions_today: todayStats.sessions_today,
      sessions_this_week: weekStats.sessions_this_week,
    };

    const response: ApiSuccessResponse<PomodoroStats> = { data: stats, success: true };
    res.json(response);
  } catch (error) {
    next(new DatabaseError((error as Error).message));
  }
});

export default router;
