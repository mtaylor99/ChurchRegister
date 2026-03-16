import { useContext } from 'react';
import { ThemeContext, type ThemeContextType } from '../contexts/contexts';

/**
 * Hook to access the theme context for light/dark mode management.
 * Must be used within a ChurchThemeProvider.
 * @returns ThemeContextType with mode ('light'|'dark') and toggleTheme function
 * @throws Error if used outside ChurchThemeProvider
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ChurchThemeProvider');
  }
  return context;
};
