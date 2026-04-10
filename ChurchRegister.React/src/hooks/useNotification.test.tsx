/**
 * Unit tests for useNotification hook
 */

import { describe, test, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useNotification } from './useNotification';
import { NotificationProvider } from '../contexts/NotificationContext';
import type { ReactNode } from 'react';

const wrapper = ({ children }: { children: ReactNode }) => (
  <NotificationProvider>{children}</NotificationProvider>
);

describe('useNotification', () => {
  test('throws when used outside NotificationProvider', () => {
    // Suppress the expected error output
    expect(() => renderHook(() => useNotification())).toThrow(
      'useNotification must be used within a NotificationProvider'
    );
  });

  test('returns context value within NotificationProvider', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });
    expect(typeof result.current.showNotification).toBe('function');
    expect(typeof result.current.showSuccess).toBe('function');
    expect(typeof result.current.showError).toBe('function');
    expect(typeof result.current.showWarning).toBe('function');
    expect(typeof result.current.showInfo).toBe('function');
    expect(typeof result.current.hideNotification).toBe('function');
  });
});
