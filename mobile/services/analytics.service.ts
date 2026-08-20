import { api } from './api';

export const analyticsService = {
  getSummary: (period: 'today' | 'week' | 'month' = 'today') =>
    api.get(`/analytics/summary?period=${period}`),

  getCollections: (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    return api.get(`/analytics/collections?${params.toString()}`);
  },

  getTrips: (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    return api.get(`/analytics/trips?${params.toString()}`);
  },

  getDriverStats: (period: 'today' | 'week' | 'month' = 'month') =>
    api.get(`/analytics/drivers?period=${period}`),

  getMerchantStats: (period: 'today' | 'week' | 'month' = 'month') =>
    api.get(`/analytics/merchants?period=${period}`),

  getBoxStats: (period: 'today' | 'week' | 'month' = 'month') =>
    api.get(`/analytics/boxes?period=${period}`),
};
