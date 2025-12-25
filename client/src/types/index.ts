export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  createdAt: string;
}

export interface QuickLink {
  id: string;
  title: string;
  url: string;
  icon?: string;
  createdAt: string;
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  conditions: string;
  location: string;
  weatherCode: number;
}

export interface PomodoroSettings {
  workDuration: number; // in minutes
  breakDuration: number; // in minutes
  soundEnabled: boolean;
}
