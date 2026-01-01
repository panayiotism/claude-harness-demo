import { Router, Request, Response, NextFunction } from 'express';
import db from '../db';
import {
  AICompletionRequest,
  ApiSuccessResponse,
  ParseTaskRequest,
  ParseTaskResponse,
  ParsedTask,
  TaskPriority,
  SuggestTasksRequest,
  SuggestTasksResponse,
  TaskSuggestion,
} from '../types';
import { createCompletion, isConfigured, AnthropicError } from '../services/anthropic';
import { aiRateLimit } from '../middleware/rateLimit';
import { ValidationError } from '../utils/errors';
import { validateRequired, validateString } from '../utils/validate';

const router = Router();

// Get client IP for logging
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

// Log AI usage to database
function logUsage(
  endpoint: string,
  model: string,
  promptTokens: number,
  completionTokens: number,
  totalTokens: number,
  clientIp: string
): void {
  try {
    db.prepare(
      `INSERT INTO ai_usage (endpoint, model, prompt_tokens, completion_tokens, total_tokens, client_ip)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(endpoint, model, promptTokens, completionTokens, totalTokens, clientIp);
  } catch (error) {
    console.error('Failed to log AI usage:', error);
  }
}

// GET /api/ai/status - Check if AI is configured
router.get('/status', (_req: Request, res: Response) => {
  const configured = isConfigured();
  const response: ApiSuccessResponse<{ configured: boolean }> = {
    data: { configured },
    success: true,
  };
  res.json(response);
});

// POST /api/ai/complete - Create a completion
router.post(
  '/complete',
  aiRateLimit,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { prompt, system, maxTokens }: AICompletionRequest = req.body;

      // Validate required fields
      validateRequired(prompt, 'prompt');
      validateString(prompt, 'prompt');

      if (system !== undefined) {
        validateString(system, 'system');
      }

      if (maxTokens !== undefined && (typeof maxTokens !== 'number' || maxTokens < 1)) {
        throw new ValidationError('maxTokens must be a positive number');
      }

      // Call Anthropic API
      const result = await createCompletion({ prompt, system, maxTokens });

      // Log usage
      const clientIp = getClientIp(req);
      logUsage(
        '/complete',
        result.model,
        result.usage.promptTokens,
        result.usage.completionTokens,
        result.usage.totalTokens,
        clientIp
      );

      const response: ApiSuccessResponse<typeof result> = {
        data: result,
        success: true,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// System prompt for parsing natural language into tasks
const PARSE_TASK_SYSTEM = `You are a task parsing assistant. Parse natural language task descriptions into structured task data.

Extract:
1. title: A clear, concise task title (remove time references, keep action-oriented)
2. priority: "high" for urgent/important/critical/ASAP, "low" for maybe/eventually/when possible, "medium" for everything else
3. dueDate: ISO date string (YYYY-MM-DD) or null if no date mentioned. Use today's date as reference.
4. confidence: 0.0-1.0 indicating how confident you are in the parsing

Today's date is: ${new Date().toISOString().split('T')[0]}

Respond ONLY with valid JSON in this exact format:
{"title":"task title here","priority":"medium","dueDate":"2026-01-02","confidence":0.9}

Examples:
- "Buy groceries tomorrow" → {"title":"Buy groceries","priority":"medium","dueDate":"<tomorrow's date>","confidence":0.95}
- "URGENT: Call the doctor ASAP" → {"title":"Call the doctor","priority":"high","dueDate":null,"confidence":0.9}
- "Maybe clean the garage sometime" → {"title":"Clean the garage","priority":"low","dueDate":null,"confidence":0.8}`;

// POST /api/ai/parse-task - Parse natural language into structured task
router.post(
  '/parse-task',
  aiRateLimit,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { text }: ParseTaskRequest = req.body;

      // Validate input
      validateRequired(text, 'text');
      validateString(text, 'text');

      if (text.trim().length < 2) {
        throw new ValidationError('Task text must be at least 2 characters');
      }

      // Call Claude to parse the task
      const result = await createCompletion({
        prompt: text,
        system: PARSE_TASK_SYSTEM,
        maxTokens: 256,
      });

      // Parse JSON response
      let parsedTask: ParsedTask;
      try {
        const parsed = JSON.parse(result.content.trim());

        // Validate and normalize the response
        const validPriorities: TaskPriority[] = ['low', 'medium', 'high'];
        parsedTask = {
          title: String(parsed.title || text).trim(),
          priority: validPriorities.includes(parsed.priority) ? parsed.priority : 'medium',
          dueDate: parsed.dueDate && /^\d{4}-\d{2}-\d{2}$/.test(parsed.dueDate)
            ? parsed.dueDate
            : null,
          confidence: typeof parsed.confidence === 'number'
            ? Math.max(0, Math.min(1, parsed.confidence))
            : 0.5,
        };
      } catch {
        // If parsing fails, use the original text as title with defaults
        parsedTask = {
          title: text.trim(),
          priority: 'medium',
          dueDate: null,
          confidence: 0.3,
        };
      }

      // Log usage
      const clientIp = getClientIp(req);
      logUsage(
        '/parse-task',
        result.model,
        result.usage.promptTokens,
        result.usage.completionTokens,
        result.usage.totalTokens,
        clientIp
      );

      const response: ApiSuccessResponse<ParseTaskResponse> = {
        data: {
          task: parsedTask,
          originalText: text,
        },
        success: true,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// System prompt for suggesting tasks
const SUGGEST_TASKS_SYSTEM = `You are a productivity assistant. Analyze the user's existing tasks and suggest 3 new tasks they might want to add.

Guidelines:
1. Look for patterns in existing tasks (work, personal, health, etc.)
2. Suggest related or follow-up tasks
3. Consider incomplete vs completed tasks
4. Keep suggestions actionable and specific
5. Assign appropriate priority based on urgency patterns

Respond ONLY with valid JSON array of exactly 3 suggestions:
[
  {"title":"Task title","priority":"medium","reason":"Brief reason why this task is suggested"},
  {"title":"Task title","priority":"low","reason":"Brief reason"},
  {"title":"Task title","priority":"high","reason":"Brief reason"}
]

Priority must be: "low", "medium", or "high"
Reason should be 1 short sentence explaining why this task is relevant.`;

// POST /api/ai/suggest-tasks - Get AI-powered task suggestions
router.post(
  '/suggest-tasks',
  aiRateLimit,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tasks }: SuggestTasksRequest = req.body;

      // Validate input
      if (!Array.isArray(tasks)) {
        throw new ValidationError('tasks must be an array');
      }

      // Check if we have enough tasks for meaningful suggestions
      if (tasks.length < 2) {
        const response: ApiSuccessResponse<SuggestTasksResponse> = {
          data: {
            suggestions: [],
            message: 'Add more tasks to get personalized suggestions',
          },
          success: true,
        };
        res.json(response);
        return;
      }

      // Take last 20 tasks for context
      const recentTasks = tasks.slice(-20);
      const taskContext = recentTasks
        .map((t) => `- ${t.title} (${t.priority}, ${t.completed ? 'done' : 'pending'})`)
        .join('\n');

      // Call Claude to generate suggestions
      const result = await createCompletion({
        prompt: `Here are the user's recent tasks:\n${taskContext}\n\nSuggest 3 new tasks they might want to add.`,
        system: SUGGEST_TASKS_SYSTEM,
        maxTokens: 512,
      });

      // Parse JSON response
      let suggestions: TaskSuggestion[] = [];
      try {
        const parsed = JSON.parse(result.content.trim());

        if (Array.isArray(parsed)) {
          const validPriorities: TaskPriority[] = ['low', 'medium', 'high'];
          suggestions = parsed.slice(0, 3).map((s, index) => ({
            id: `suggestion-${Date.now()}-${index}`,
            title: String(s.title || 'Untitled task').trim(),
            priority: validPriorities.includes(s.priority) ? s.priority : 'medium',
            reason: String(s.reason || 'Suggested based on your task patterns').trim(),
          }));
        }
      } catch {
        // If parsing fails, return empty with message
        const response: ApiSuccessResponse<SuggestTasksResponse> = {
          data: {
            suggestions: [],
            message: 'Unable to generate suggestions at this time',
          },
          success: true,
        };
        res.json(response);
        return;
      }

      // Log usage
      const clientIp = getClientIp(req);
      logUsage(
        '/suggest-tasks',
        result.model,
        result.usage.promptTokens,
        result.usage.completionTokens,
        result.usage.totalTokens,
        clientIp
      );

      const response: ApiSuccessResponse<SuggestTasksResponse> = {
        data: {
          suggestions,
        },
        success: true,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/ai/usage - Get usage statistics
router.get('/usage', (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Get total usage stats
    const stats = db
      .prepare(
        `SELECT
          COUNT(*) as total_requests,
          SUM(prompt_tokens) as total_prompt_tokens,
          SUM(completion_tokens) as total_completion_tokens,
          SUM(total_tokens) as total_tokens
         FROM ai_usage`
      )
      .get() as {
      total_requests: number;
      total_prompt_tokens: number;
      total_completion_tokens: number;
      total_tokens: number;
    };

    // Get usage by endpoint
    const byEndpoint = db
      .prepare(
        `SELECT
          endpoint,
          COUNT(*) as requests,
          SUM(total_tokens) as tokens
         FROM ai_usage
         GROUP BY endpoint`
      )
      .all();

    // Get today's usage
    const today = db
      .prepare(
        `SELECT
          COUNT(*) as requests,
          SUM(total_tokens) as tokens
         FROM ai_usage
         WHERE date(created_at) = date('now')`
      )
      .get() as { requests: number; tokens: number };

    const response: ApiSuccessResponse<{
      total: typeof stats;
      byEndpoint: typeof byEndpoint;
      today: typeof today;
    }> = {
      data: {
        total: stats,
        byEndpoint,
        today,
      },
      success: true,
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Error handling for Anthropic errors
router.use((err: Error, _req: Request, res: Response, next: NextFunction): void => {
  if (err instanceof AnthropicError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      success: false,
    });
    return;
  }
  next(err);
});

export default router;
