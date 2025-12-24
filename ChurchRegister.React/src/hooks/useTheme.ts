import { useContext } from 'react';
import { ThemeContext, type ThemeContextType } from '../contexts/contexts';

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ChurchThemeProvider');
  }
  return context;
};
