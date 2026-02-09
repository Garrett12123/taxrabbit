'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes';
import {
  COLOR_THEMES,
  applyColorTheme,
  getStoredColorTheme,
  setStoredColorTheme,
  type ColorTheme,
} from '@/lib/themes';

type ColorThemeContextValue = {
  colorTheme: string;
  setColorTheme: (id: string) => void;
  themes: ColorTheme[];
};

const ColorThemeContext = React.createContext<ColorThemeContextValue>({
  colorTheme: 'default',
  setColorTheme: () => {},
  themes: COLOR_THEMES,
});

export function useTheme() {
  return useNextTheme();
}

export function useColorTheme() {
  return React.useContext(ColorThemeContext);
}

function ColorThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorTheme, setColorThemeState] = React.useState('default');

  React.useEffect(() => {
    const stored = getStoredColorTheme();
    setColorThemeState(stored);
    applyColorTheme(stored);
  }, []);

  const setColorTheme = React.useCallback((id: string) => {
    setColorThemeState(id);
    setStoredColorTheme(id);
    applyColorTheme(id);
  }, []);

  const value = React.useMemo(
    () => ({ colorTheme, setColorTheme, themes: COLOR_THEMES }),
    [colorTheme, setColorTheme]
  );

  return (
    <ColorThemeContext.Provider value={value}>
      {children}
    </ColorThemeContext.Provider>
  );
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
    >
      <ColorThemeProvider>
        {children}
      </ColorThemeProvider>
    </NextThemesProvider>
  );
}
