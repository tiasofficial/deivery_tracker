import { create } from 'zustand';

interface AppState {
  isGlobalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isGlobalLoading: false,
  setGlobalLoading: (loading) => set({ isGlobalLoading: loading })
}));
