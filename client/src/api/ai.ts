import api from './index';

export interface ParsedTask {
  title: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string | null;
  confidence: number;
}

export interface ParseTaskResponse {
  task: ParsedTask;
  originalText: string;
}

export interface AIStatus {
  configured: boolean;
}

export interface TaskSuggestion {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  reason: string;
}

export interface SuggestTasksResponse {
  suggestions: TaskSuggestion[];
  message?: string;
}

export interface TaskForSuggestion {
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

export const aiApi = {
  /**
   * Check if AI features are available
   */
  getStatus: async (): Promise<AIStatus> => {
    const response = await api.get<AIStatus>('/ai/status');
    return response.data;
  },

  /**
   * Parse natural language text into a structured task
   */
  parseTask: async (text: string): Promise<ParseTaskResponse> => {
    const response = await api.post<ParseTaskResponse>('/ai/parse-task', { text });
    return response.data;
  },

  /**
   * Get AI-powered task suggestions based on existing tasks
   */
  getSuggestions: async (tasks: TaskForSuggestion[]): Promise<SuggestTasksResponse> => {
    const response = await api.post<SuggestTasksResponse>('/ai/suggest-tasks', { tasks });
    return response.data;
  },
};
