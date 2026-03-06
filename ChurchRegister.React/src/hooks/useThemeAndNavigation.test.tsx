/**
 * Unit tests for useTheme and useNavigation hooks
 */

import { describe, test, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useTheme } from './useTheme';
import { useNavigation } from './useNavigation';
import { ThemeContext, type ThemeContextType } from '../contexts/contexts';
import { NavigationContext } from '../components/Navigation/NavigationProvider';
import type { NavigationContextType } from '../components/Navigation/NavigationProvider';

// ─── useTheme ─────────────────────────────────────────────────────────────────
describe('useTheme', () => {
  test('throws error when used outside ChurchThemeProvider', () => {
    expect(() => renderHook(() => useTheme())).toThrow(
      'useTheme must be used within a ChurchThemeProvider'
    );
  });

  test('returns theme context when inside provider', () => {
    const mockTheme: ThemeContextType = {
      mode: 'light',
      toggleTheme: () => {},
      setTheme: () => {},
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <ThemeContext.Provider value={mockTheme}>{children}</ThemeContext.Provider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.mode).toBe('light');
    expect(typeof result.current.toggleTheme).toBe('function');
    expect(typeof result.current.setTheme).toBe('function');
  });

  test('returns dark mode when provider supplies dark mode', () => {
    const mockTheme: ThemeContextType = {
      mode: 'dark',
      toggleTheme: () => {},
      setTheme: () => {},
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <ThemeContext.Provider value={mockTheme}>{children}</ThemeContext.Provider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.mode).toBe('dark');
  });
});

// ─── useNavigation ────────────────────────────────────────────────────────────
describe('useNavigation', () => {
  test('throws error when used outside NavigationProvider', () => {
    expect(() => renderHook(() => useNavigation())).toThrow(
      'useNavigation must be used within a NavigationProvider'
    );
  });

  test('returns navigation context when inside provider', () => {
    const mockNavigation: NavigationContextType = {
      currentPath: '/members',
      isMenuOpen: false,
      toggleMenu: () => {},
      closeMenu: () => {},
      navigateTo: () => {},
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <NavigationContext.Provider value={mockNavigation}>
        {children}
      </NavigationContext.Provider>
    );

    const { result } = renderHook(() => useNavigation(), { wrapper });
    expect(result.current.currentPath).toBe('/members');
    expect(result.current.isMenuOpen).toBe(false);
    expect(typeof result.current.toggleMenu).toBe('function');
    expect(typeof result.current.closeMenu).toBe('function');
    expect(typeof result.current.navigateTo).toBe('function');
  });

  test('returns open menu state correctly', () => {
    const mockNavigation: NavigationContextType = {
      currentPath: '/dashboard',
      isMenuOpen: true,
      toggleMenu: () => {},
      closeMenu: () => {},
      navigateTo: () => {},
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <NavigationContext.Provider value={mockNavigation}>
        {children}
      </NavigationContext.Provider>
    );

    const { result } = renderHook(() => useNavigation(), { wrapper });
    expect(result.current.isMenuOpen).toBe(true);
  });

  test('works correctly inside BrowserRouter and NavigationProvider', () => {
    const mockNavigation: NavigationContextType = {
      currentPath: '/risk-assessments',
      isMenuOpen: false,
      toggleMenu: () => {},
      closeMenu: () => {},
      navigateTo: () => {},
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <BrowserRouter>
        <NavigationContext.Provider value={mockNavigation}>
          {children}
        </NavigationContext.Provider>
      </BrowserRouter>
    );

    const { result } = renderHook(() => useNavigation(), { wrapper });
    expect(result.current.currentPath).toBe('/risk-assessments');
  });
});
