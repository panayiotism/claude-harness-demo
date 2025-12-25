// Note types
export interface Note {
  id: number;
  title: string;
  content: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateNoteInput {
  title: string;
  content?: string;
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
}

// Task types
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: number;
  title: string;
  completed: boolean;
  priority: TaskPriority;
  due_date: string | null;
  created_at: string;
}

export interface CreateTaskInput {
  title: string;
  priority?: TaskPriority;
  due_date?: string;
}

export interface UpdateTaskInput {
  title?: string;
  completed?: boolean;
  priority?: TaskPriority;
  due_date?: string;
}

// Link types
export interface Link {
  id: number;
  title: string;
  url: string;
  icon: string | null;
  position: number;
  created_at: string;
}

export interface CreateLinkInput {
  title: string;
  url: string;
  icon?: string;
}

export interface UpdateLinkInput {
  title?: string;
  url?: string;
  icon?: string;
}

export interface ReorderLinksInput {
  links: Array<{ id: number; position: number }>;
}

// Pomodoro types
export interface PomodoroSession {
  id: number;
  duration: number;
  completed_at: string;
}

export interface CreatePomodoroSessionInput {
  duration: number;
}

export interface PomodoroStats {
  total_sessions: number;
  total_minutes: number;
  sessions_today: number;
  sessions_this_week: number;
}

// API Response types
export interface ApiSuccessResponse<T> {
  data: T;
  success: true;
}

export interface ApiErrorResponse {
  error: string;
  success: false;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
