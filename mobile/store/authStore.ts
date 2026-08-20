import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
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
    await SecureStore.setItemAsync('userToken', token);
    await SecureStore.setItemAsync('user', JSON.stringify(user));
    set({ user, token, isLoading: false });
  },
  logout: async () => {
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('user');
    set({ user: null, token: null, isLoading: false });
  },
  checkAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const userStr = await SecureStore.getItemAsync('user');
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
