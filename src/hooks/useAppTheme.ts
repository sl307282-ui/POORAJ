import { useThemeStore } from '../store/themeStore';
import { Colors } from '../theme/colors';

export const ACCENT_COLORS = {
  Sunset: { primary: '#f97316', primaryDark: '#ea580c' },
  Ocean: { primary: '#0ea5e9', primaryDark: '#0284c7' },
  Rose: { primary: '#e11d48', primaryDark: '#be123c' },
  Deep: { primary: '#4f46e5', primaryDark: '#4338ca' },
  Emerald: { primary: '#10b981', primaryDark: '#059669' },
  Burgundy: { primary: '#9f1239', primaryDark: '#881337' },
  Royal: { primary: '#6d28d9', primaryDark: '#5b21b6' },
  Amber: { primary: '#d97706', primaryDark: '#b45309' },
  Graphite: { primary: '#334155', primaryDark: '#1e293b' },
  Slate: { primary: '#475569', primaryDark: '#334155' },
};

export const useAppTheme = () => {
  const { mode, accentColor } = useThemeStore();
  const isDark = mode === 'dark';
  const baseTheme = Colors[isDark ? 'dark' : 'light'];
  
  const customColors = ACCENT_COLORS[accentColor] || ACCENT_COLORS.Sunset;
  
  return {
    ...baseTheme,
    primary: customColors.primary,
    primaryDark: customColors.primaryDark,
    isDark,
  };
};
