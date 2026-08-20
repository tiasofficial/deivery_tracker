import { api } from './api';
import { Trip, RouteStop } from '../types';

export const tripService = {
  getTrips: async () => {
    const response = await api.get('/trips');
    return response.data;
  },
  getTripById: async (id: string) => {
    const response = await api.get(`/trips/${id}`);
    return response.data;
  },
  createTrip: async (data: Partial<Trip>) => {
    const response = await api.post('/trips', data);
    return response.data;
  },
  updateTripStatus: async (id: string, status: string) => {
    const response = await api.patch(`/trips/${id}/status`, { status });
    return response.data;
  }
};
