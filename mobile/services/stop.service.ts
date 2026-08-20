import { api } from './api';

export const stopService = {
  updateStopStatus: async (tripId: string, stopId: string, status: string, payload?: any) => {
    const response = await api.patch(`/trips/${tripId}/stops/${stopId}`, { status, ...payload });
    return response.data;
  }
};
