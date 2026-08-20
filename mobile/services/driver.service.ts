import { api } from './api';

export const driverService = {
  getAll: () => api.get('/drivers'),
  getById: (id: string) => api.get(`/drivers/${id}`),
  getTrips: (id: string) => api.get(`/drivers/${id}/trips`),
  getBalance: (id: string) => api.get(`/drivers/${id}/balance`),
  create: (data: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    vehicleNo?: string;
  }) => api.post('/drivers', data),
};
