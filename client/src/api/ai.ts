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
};
