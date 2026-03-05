/**
 * Unit tests for useEscapeKey hook
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEscapeKey } from './useEscapeKey';

function fireKeydown(key: string) {
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

describe('useEscapeKey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('calls onClose when Escape key is pressed and enabled=true (default)', () => {
    const onClose = vi.fn();
    renderHook(() => useEscapeKey(onClose));

    fireKeydown('Escape');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('does not call onClose for other keys', () => {
    const onClose = vi.fn();
    renderHook(() => useEscapeKey(onClose));

    fireKeydown('Enter');
    fireKeydown('ArrowDown');
    fireKeydown(' ');
    expect(onClose).not.toHaveBeenCalled();
  });

  test('does not call onClose when enabled=false', () => {
    const onClose = vi.fn();
    renderHook(() => useEscapeKey(onClose, false));

    fireKeydown('Escape');
    expect(onClose).not.toHaveBeenCalled();
  });

  test('does not call onClose when onClose is undefined', () => {
    // Should not throw when no handler is provided
    expect(() => {
      renderHook(() => useEscapeKey(undefined));
      fireKeydown('Escape');
    }).not.toThrow();
  });

  test('cleans up listener on unmount', () => {
    const onClose = vi.fn();
    const { unmount } = renderHook(() => useEscapeKey(onClose));
    unmount();

    fireKeydown('Escape');
    expect(onClose).not.toHaveBeenCalled();
  });

  test('re-attaches listener when enabled changes to true', () => {
    const onClose = vi.fn();
    const { rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) => useEscapeKey(onClose, enabled),
      {
        initialProps: { enabled: false },
      }
    );

    fireKeydown('Escape');
    expect(onClose).not.toHaveBeenCalled();

    rerender({ enabled: true });
    fireKeydown('Escape');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('removes listener when enabled changes to false', () => {
    const onClose = vi.fn();
    const { rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) => useEscapeKey(onClose, enabled),
      {
        initialProps: { enabled: true },
      }
    );

    rerender({ enabled: false });
    fireKeydown('Escape');
    expect(onClose).not.toHaveBeenCalled();
  });
});
