import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export type ColorTheme = 'green' | 'blue' | 'purple' | 'orange';
type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  colorTheme: ColorTheme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setColorTheme: (theme: ColorTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  // Storage keys depend on the user ID
  const themeKey = user ? `theme_${user.id}` : 'theme_guest';
  const colorKey = user ? `color-theme_${user.id}` : 'color-theme_guest';

  const [theme, setThemeState] = useState<Theme>('light');
  const [colorTheme, setColorThemeState] = useState<ColorTheme>('green');

  // Load preferences whenever the user changes or component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem(themeKey) as Theme;
      if (storedTheme) {
        setThemeState(storedTheme);
      } else {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        setThemeState(systemTheme);
      }

      const storedColor = localStorage.getItem(colorKey) as ColorTheme;
      if (storedColor) setColorThemeState(storedColor);
      else setColorThemeState('green');
    }
  }, [user?.id, themeKey, colorKey]);

  // Apply theme classes and persist on change
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem(themeKey, theme);
  }, [theme, themeKey]);

  // Apply color attributes and persist on change
  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute('data-theme', colorTheme);
    localStorage.setItem(colorKey, colorTheme);
  }, [colorTheme, colorKey]);

  const toggleTheme = () => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const setColorTheme = (newColorTheme: ColorTheme) => {
    setColorThemeState(newColorTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, colorTheme, toggleTheme, setTheme, setColorTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
