import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { PaperProvider } from 'react-native-paper';
import { theme } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  const { user, isLoading, checkAuth } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user) {
      if (user.role === 'VENDOR' && segments[0] !== 'vendor') {
        router.replace('/vendor');
      } else if (user.role === 'DRIVER' && segments[0] !== 'driver') {
        router.replace('/driver');
      }
    }
  }, [user, isLoading, segments]);

  return (
    <PaperProvider theme={theme}>
      <StatusBar style="light" />
      <Slot />
    </PaperProvider>
  );
}
