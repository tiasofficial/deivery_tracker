import { api } from './api';

export const settlementService = {
  getAll: () => api.get('/settlements'),
  getById: (id: string) => api.get(`/settlements/${id}`),
  create: (data: { tripId: string; amount: number; notes?: string }) =>
    api.post('/settlements', data),
};
