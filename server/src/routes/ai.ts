import { Router, Request, Response, NextFunction } from 'express';
import db from '../db';
import { AICompletionRequest, ApiSuccessResponse } from '../types';
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
