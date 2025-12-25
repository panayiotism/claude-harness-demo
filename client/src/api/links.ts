import api from './index';
import { QuickLink } from '../types';

export const linksApi = {
  getAll: async (): Promise<QuickLink[]> => {
    const response = await api.get<QuickLink[]>('/links');
    return response.data;
  },

  getById: async (id: string): Promise<QuickLink> => {
    const response = await api.get<QuickLink>(`/links/${id}`);
    return response.data;
  },

  create: async (link: Omit<QuickLink, 'id' | 'createdAt'>): Promise<QuickLink> => {
    const response = await api.post<QuickLink>('/links', link);
    return response.data;
  },

  update: async (id: string, link: Partial<Omit<QuickLink, 'id' | 'createdAt'>>): Promise<QuickLink> => {
    const response = await api.put<QuickLink>(`/links/${id}`, link);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/links/${id}`);
  },
};
