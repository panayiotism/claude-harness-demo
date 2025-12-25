import { ValidationError } from './errors';
import { TaskPriority } from '../types';

export const validateRequired = (value: any, fieldName: string): void => {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError(`${fieldName} is required`);
  }
};

export const validateString = (value: any, fieldName: string): void => {
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`);
  }
};

export const validateUrl = (url: string): void => {
  try {
    new URL(url);
  } catch {
    throw new ValidationError('Invalid URL format');
  }
};

export const validatePriority = (priority: any): void => {
  const validPriorities: TaskPriority[] = ['low', 'medium', 'high'];
  if (!validPriorities.includes(priority)) {
    throw new ValidationError(`Priority must be one of: ${validPriorities.join(', ')}`);
  }
};

export const validateBoolean = (value: any, fieldName: string): void => {
  if (typeof value !== 'boolean') {
    throw new ValidationError(`${fieldName} must be a boolean`);
  }
};

export const validateNumber = (value: any, fieldName: string): void => {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new ValidationError(`${fieldName} must be a valid number`);
  }
};

export const validatePositiveNumber = (value: number, fieldName: string): void => {
  validateNumber(value, fieldName);
  if (value <= 0) {
    throw new ValidationError(`${fieldName} must be a positive number`);
  }
};

export const validateDate = (dateString: string): void => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new ValidationError('Invalid date format');
  }
};
