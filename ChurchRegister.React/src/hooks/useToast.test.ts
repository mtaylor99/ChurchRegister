import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast } from './useToast';

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    test('starts with an empty toasts array', () => {
      const { result } = renderHook(() => useToast());
      expect(result.current.toasts).toEqual([]);
    });

    test('returns all required methods', () => {
      const { result } = renderHook(() => useToast());
      expect(typeof result.current.showToast).toBe('function');
      expect(typeof result.current.hideToast).toBe('function');
      expect(typeof result.current.showSuccess).toBe('function');
      expect(typeof result.current.showError).toBe('function');
      expect(typeof result.current.showWarning).toBe('function');
      expect(typeof result.current.showInfo).toBe('function');
      expect(typeof result.current.clearAll).toBe('function');
    });
  });

  describe('showToast', () => {
    test('adds a toast with the given message', () => {
      const { result } = renderHook(() => useToast());
      act(() => {
        result.current.showToast('Hello world');
      });
      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].message).toBe('Hello world');
    });

    test('defaults severity to info', () => {
      const { result } = renderHook(() => useToast());
      act(() => {
        result.current.showToast('Message');
      });
      expect(result.current.toasts[0].severity).toBe('info');
    });

    test('defaults duration to 6000ms', () => {
      const { result } = renderHook(() => useToast());
      act(() => {
        result.current.showToast('Message');
      });
      expect(result.current.toasts[0].duration).toBe(6000);
    });

    test('assigns a string id to each toast', () => {
      const { result } = renderHook(() => useToast());
      act(() => {
        result.current.showToast('Message');
      });
      expect(typeof result.current.toasts[0].id).toBe('string');
    });

    test('returns the toast id', () => {
      const { result } = renderHook(() => useToast());
      let id: string;
      act(() => {
        id = result.current.showToast('Message');
      });
      expect(result.current.toasts[0].id).toBe(id!);
    });

    test('allows custom severity', () => {
      const { result } = renderHook(() => useToast());
      act(() => {
        result.current.showToast('Message', { severity: 'error' });
      });
      expect(result.current.toasts[0].severity).toBe('error');
    });

    test('allows custom title', () => {
      const { result } = renderHook(() => useToast());
      act(() => {
        result.current.showToast('Message', { title: 'My Title' });
      });
      expect(result.current.toasts[0].title).toBe('My Title');
    });

    test('allows custom duration', () => {
      const { result } = renderHook(() => useToast());
      act(() => {
        result.current.showToast('Message', { duration: 3000 });
      });
      expect(result.current.toasts[0].duration).toBe(3000);
    });

    test('auto-removes toast after duration elapses', () => {
      const { result } = renderHook(() => useToast());
      act(() => {
        result.current.showToast('Auto remove', { duration: 1000 });
      });
      expect(result.current.toasts).toHaveLength(1);
      act(() => {
        vi.advanceTimersByTime(1100);
      });
      expect(result.current.toasts).toHaveLength(0);
    });

    test('only removes the correct toast after its duration', () => {
      const { result } = renderHook(() => useToast());
      // First toast: short duration
      act(() => {
        result.current.showToast('Short', { duration: 1000 });
      });
      // Advance time enough to expire the first toast
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      // A new toast added after should still be present
      act(() => {
        result.current.showToast('Long-lasting', { duration: 60000 });
      });
      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].message).toBe('Long-lasting');
    });

    test('keeps earlier toasts when adding multiple', () => {
      const { result } = renderHook(() => useToast());
      act(() => {
        result.current.showToast('Toast 1', { duration: 60000 });
      });
      act(() => {
        vi.advanceTimersByTime(1);
      });
      act(() => {
        result.current.showToast('Toast 2', { duration: 60000 });
      });
      expect(result.current.toasts).toHaveLength(2);
    });
  });

  describe('showSuccess', () => {
    test('creates a toast with success severity', () => {
      const { result } = renderHook(() => useToast());
      act(() => {
        result.current.showSuccess('Saved!');
      });
      expect(result.current.toasts[0].severity).toBe('success');
      expect(result.current.toasts[0].message).toBe('Saved!');
    });

    test('sets title when provided', () => {
      const { result } = renderHook(() => useToast());
      act(() => {
        result.current.showSuccess('Done', 'Great');
      });
      expect(result.current.toasts[0].title).toBe('Great');
    });
  });

  describe('showError', () => {
    test('creates a toast with error severity', () => {
      const { result } = renderHook(() => useToast());
      act(() => {
        result.current.showError('Something went wrong');
      });
      expect(result.current.toasts[0].severity).toBe('error');
    });

    test('uses 8000ms duration for errors', () => {
      const { result } = renderHook(() => useToast());
      act(() => {
        result.current.showError('Error!');
      });
      expect(result.current.toasts[0].duration).toBe(8000);
    });
  });

  describe('showWarning', () => {
    test('creates a toast with warning severity', () => {
      const { result } = renderHook(() => useToast());
      act(() => {
        result.current.showWarning('Be careful');
      });
      expect(result.current.toasts[0].severity).toBe('warning');
      expect(result.current.toasts[0].message).toBe('Be careful');
    });
  });

  describe('showInfo', () => {
    test('creates a toast with info severity', () => {
      const { result } = renderHook(() => useToast());
      act(() => {
        result.current.showInfo('Just so you know');
      });
      expect(result.current.toasts[0].severity).toBe('info');
    });
  });

  describe('hideToast', () => {
    test('removes the toast with the matching id', () => {
      const { result } = renderHook(() => useToast());
      let id: string;
      act(() => {
        id = result.current.showToast('Removable', { duration: 60000 });
      });
      act(() => {
        result.current.hideToast(id);
      });
      expect(result.current.toasts).toHaveLength(0);
    });

    test('only removes the toast with the given id', () => {
      const { result } = renderHook(() => useToast());
      let id1: string;
      // Add first toast, then advance time so next Date.now() gives a different id
      act(() => {
        id1 = result.current.showToast('First', { duration: 60000 });
      });
      act(() => {
        vi.advanceTimersByTime(1); // ensure different Date.now() value
      });
      act(() => {
        result.current.showToast('Second', { duration: 60000 });
      });
      act(() => {
        result.current.hideToast(id1);
      });
      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].message).toBe('Second');
    });

    test('does nothing if id does not exist', () => {
      const { result } = renderHook(() => useToast());
      act(() => {
        result.current.showToast('Message', { duration: 60000 });
      });
      act(() => {
        result.current.hideToast('nonexistent-id');
      });
      expect(result.current.toasts).toHaveLength(1);
    });
  });

  describe('clearAll', () => {
    test('removes all toasts at once', () => {
      const { result } = renderHook(() => useToast());
      act(() => {
        result.current.showToast('Toast 1', { duration: 60000 });
      });
      act(() => {
        vi.advanceTimersByTime(1);
      });
      act(() => {
        result.current.showToast('Toast 2', { duration: 60000 });
      });
      act(() => {
        vi.advanceTimersByTime(1);
      });
      act(() => {
        result.current.showToast('Toast 3', { duration: 60000 });
      });
      act(() => {
        result.current.clearAll();
      });
      expect(result.current.toasts).toHaveLength(0);
    });

    test('does not throw when called on empty list', () => {
      const { result } = renderHook(() => useToast());
      expect(() => {
        act(() => {
          result.current.clearAll();
        });
      }).not.toThrow();
    });
  });
});
