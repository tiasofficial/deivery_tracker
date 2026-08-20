import { api } from './api';

export const boxtypeService = {
  getAll: () => api.get('/boxtypes'),
  create: (data: { name: string; description?: string }) =>
    api.post('/boxtypes', data),
  update: (id: string, data: { name?: string; description?: string }) =>
    api.put(`/boxtypes/${id}`, data),
  delete: (id: string) => api.delete(`/boxtypes/${id}`),
};
