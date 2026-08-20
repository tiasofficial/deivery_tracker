import { MD3DarkTheme } from 'react-native-paper';
import colors from './colors';

export const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    background: colors.background,
    surface: colors.surface,
    surfaceVariant: colors.surfaceAlt,
    error: colors.error,
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onSurface: colors.textPrimary,
    onBackground: colors.textPrimary,
  },
};
