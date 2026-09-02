import { create } from 'zustand';
import { storage } from '../utils/storage';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  login: async (user, token) => {
    await storage.setItem('userToken', token);
    await storage.setItem('user', JSON.stringify(user));
    set({ user, token, isLoading: false });
  },
  logout: async () => {
    await storage.deleteItem('userToken');
    await storage.deleteItem('user');
    set({ user: null, token: null, isLoading: false });
  },
  checkAuth: async () => {
    try {
      const token = await storage.getItem('userToken');
      const userStr = await storage.getItem('user');
      if (token && userStr) {
        set({ token, user: JSON.parse(userStr), isLoading: false });
      } else {
        set({ token: null, user: null, isLoading: false });
      }
    } catch (e) {
      set({ token: null, user: null, isLoading: false });
    }
  }
}));
