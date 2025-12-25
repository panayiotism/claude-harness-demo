import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { runMigrations } from './db';
import { AppError } from './utils/errors';
import { ApiErrorResponse } from './types';

// Import routes
import notesRouter from './routes/notes';
import tasksRouter from './routes/tasks';
import linksRouter from './routes/links';
import pomodoroRouter from './routes/pomodoro';

const app = express();
const PORT = process.env.PORT || 3010;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/notes', notesRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/links', linksRouter);
app.use('/api/pomodoro', pomodoroRouter);

// 404 handler
app.use((req: Request, res: Response) => {
  const response: ApiErrorResponse = {
    error: `Route ${req.method} ${req.path} not found`,
    success: false,
  };
  res.status(404).json(response);
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);

  if (err instanceof AppError) {
    const response: ApiErrorResponse = {
      error: err.message,
      success: false,
    };
    return res.status(err.statusCode).json(response);
  }

  // Generic error
  const response: ApiErrorResponse = {
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
    success: false,
  };
  return res.status(500).json(response);
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Run database migrations
    runMigrations();

    // Start server
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════╗
║  Personal Dashboard API Server                     ║
║                                                    ║
║  Status: Running                                   ║
║  Port: ${PORT}                                      ║
║  Environment: ${process.env.NODE_ENV || 'development'}                            ║
║                                                    ║
║  Endpoints:                                        ║
║  - GET  /api/health                                ║
║  - CRUD /api/notes                                 ║
║  - CRUD /api/tasks                                 ║
║  - CRUD /api/links                                 ║
║  - POST /api/pomodoro/session                      ║
║  - GET  /api/pomodoro/stats                        ║
╚════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
