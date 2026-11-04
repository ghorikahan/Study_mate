import { Colors } from './colors';

export const Theme = {
  colors: Colors,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  borderRadius: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 20,
    xl: 28,
    full: 9999,
  },
  typography: {
    title: {
      fontSize: 28,
      fontWeight: '700' as const,
      color: Colors.text,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 16,
      fontWeight: '500' as const,
      color: Colors.textSecondary,
    },
    heading: {
      fontSize: 20,
      fontWeight: '600' as const,
      color: Colors.text,
    },
    body: {
      fontSize: 14,
      fontWeight: '400' as const,
      color: Colors.text,
      lineHeight: 20,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400' as const,
      color: Colors.textSecondary,
    },
  },
};

export default Theme;

