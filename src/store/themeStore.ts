import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';
export type AccentColor = 'Sunset' | 'Ocean' | 'Rose' | 'Deep' | 'Emerald' | 'Burgundy' | 'Royal' | 'Amber' | 'Graphite' | 'Slate';
export type Typography = 'System Default' | 'Modern' | 'Classic' | 'Geometric' | 'Elegant';

interface ThemeStoreState {
  mode: ThemeMode;
  accentColor: AccentColor;
  typography: Typography;
  setMode: (mode: ThemeMode) => void;
  setAccentColor: (color: AccentColor) => void;
  setTypography: (typography: Typography) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeStoreState>()(
  persist(
    (set) => ({
      mode: 'light', // Default to light mode for this app
      accentColor: 'Sunset', // Default to Sunset
      typography: 'System Default', // Default typography
      setMode: (mode) => set({ mode }),
      setAccentColor: (accentColor) => set({ accentColor }),
      setTypography: (typography) => set({ typography }),
      toggleTheme: () => set((state) => ({ 
        mode: state.mode === 'dark' ? 'light' : 'dark' 
      })),
    }),
    {
      name: 'pooraj-theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
