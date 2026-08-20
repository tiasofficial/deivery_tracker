import { api } from './api';

export const merchantService = {
  getMerchants: async () => {
    const response = await api.get('/merchants');
    return response.data;
  },
  getMerchantById: async (id: string) => {
    const response = await api.get(`/merchants/${id}`);
    return response.data;
  }
};
