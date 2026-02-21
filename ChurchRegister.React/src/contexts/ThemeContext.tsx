import React, { useState, useEffect, type ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { lightTheme, darkTheme } from '../theme';
import { ThemeContext, type ThemeContextType } from './contexts';

type ThemeMode = 'light' | 'dark';

interface ChurchThemeProviderProps {
  children: ReactNode;
}

export const ChurchThemeProvider: React.FC<ChurchThemeProviderProps> = ({
  children,
}) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    // Check if user has a saved preference
    const savedMode = localStorage.getItem('church-theme-mode') as ThemeMode;
    if (savedMode === 'light' || savedMode === 'dark') {
      return savedMode;
    }

    // Check system preference
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;
    return prefersDark ? 'dark' : 'light';
  });

  useEffect(() => {
    // Save theme preference to localStorage
    localStorage.setItem('church-theme-mode', mode);
  }, [mode]);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (newMode: ThemeMode) => {
    setMode(newMode);
  };

  const theme = mode === 'light' ? lightTheme : darkTheme;

  const contextValue: ThemeContextType = {
    mode,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
