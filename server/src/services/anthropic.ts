import Anthropic from '@anthropic-ai/sdk';
import { AICompletionRequest, AICompletionResponse } from '../types';

// Initialize Anthropic client - API key loaded from environment variable
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Default model for completions
const DEFAULT_MODEL = 'claude-sonnet-4-20250514';
const DEFAULT_MAX_TOKENS = 1024;

export class AnthropicError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AnthropicError';
  }
}

/**
 * Create a completion using Claude API
 */
export async function createCompletion(
  request: AICompletionRequest
): Promise<AICompletionResponse> {
  // Check if API key is configured
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new AnthropicError(
      'ANTHROPIC_API_KEY is not configured',
      503,
      'API_KEY_MISSING'
    );
  }

  try {
    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: request.maxTokens || DEFAULT_MAX_TOKENS,
      system: request.system || 'You are a helpful assistant.',
      messages: [
        {
          role: 'user',
          content: request.prompt,
        },
      ],
    });

    // Extract text content from response
    const textContent = response.content.find((block) => block.type === 'text');
    const content = textContent && 'text' in textContent ? textContent.text : '';

    return {
      content,
      model: response.model,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
    };
  } catch (error) {
    // Handle Anthropic-specific errors
    if (error instanceof Anthropic.APIError) {
      const statusCode = error.status || 500;

      if (statusCode === 401) {
        throw new AnthropicError('Invalid API key', 401, 'INVALID_API_KEY');
      }
      if (statusCode === 429) {
        throw new AnthropicError('Rate limit exceeded', 429, 'RATE_LIMITED');
      }
      if (statusCode === 529) {
        throw new AnthropicError('API overloaded', 503, 'OVERLOADED');
      }

      throw new AnthropicError(
        error.message || 'Anthropic API error',
        statusCode,
        'API_ERROR'
      );
    }

    // Handle timeout or network errors
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        throw new AnthropicError('Request timed out', 504, 'TIMEOUT');
      }
      throw new AnthropicError(error.message, 500, 'UNKNOWN_ERROR');
    }

    throw new AnthropicError('Unknown error occurred', 500, 'UNKNOWN_ERROR');
  }
}

/**
 * Check if the Anthropic API is configured and accessible
 */
export function isConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export default {
  createCompletion,
  isConfigured,
  AnthropicError,
};
