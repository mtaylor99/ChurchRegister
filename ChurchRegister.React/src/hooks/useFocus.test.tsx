/**
 * Unit tests for useFocus hooks
 */

import { describe, test, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React, { useRef } from 'react';
import { useFocusWithin, useRovingTabIndex } from './useFocus';

describe('useFocusWithin', () => {
  test('returns false initially when ref has no current', () => {
    const { result } = renderHook(() => {
      const ref = useRef<HTMLElement>(null);
      const focusWithin = useFocusWithin(ref as React.RefObject<HTMLElement>);
      return { focusWithin, ref };
    });
    expect(result.current.focusWithin).toBe(false);
  });

  test('returns false initially when container exists', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const refObj = { current: container };

    const { result } = renderHook(() => useFocusWithin(refObj));
    expect(result.current).toBe(false);

    document.body.removeChild(container);
  });

  test('becomes true on focusin event', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const refObj = { current: container };

    const { result } = renderHook(() => useFocusWithin(refObj));

    act(() => {
      container.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    });

    expect(result.current).toBe(true);
    document.body.removeChild(container);
  });

  test('becomes false on focusout when focus leaves container', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const refObj = { current: container };

    const { result } = renderHook(() => useFocusWithin(refObj));

    // Simulate focus entering
    act(() => {
      container.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    });
    expect(result.current).toBe(true);

    // Simulate focus leaving (relatedTarget outside container)
    act(() => {
      container.dispatchEvent(
        new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body })
      );
    });
    expect(result.current).toBe(false);

    document.body.removeChild(container);
  });

  test('stays true on focusout when focus stays within container', () => {
    const container = document.createElement('div');
    const inner = document.createElement('button');
    container.appendChild(inner);
    document.body.appendChild(container);
    const refObj = { current: container };

    const { result } = renderHook(() => useFocusWithin(refObj));

    act(() => {
      container.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    });
    expect(result.current).toBe(true);

    // Focus moves to a child — relatedTarget is inside container
    act(() => {
      container.dispatchEvent(
        new FocusEvent('focusout', { bubbles: true, relatedTarget: inner })
      );
    });
    expect(result.current).toBe(true);

    document.body.removeChild(container);
  });
});

describe('useRovingTabIndex', () => {
  const makeItems = (count: number) =>
    Array.from({ length: count }, () => ({
      current: document.createElement('button'),
    }));

  test('initial activeIndex is 0', () => {
    const items = makeItems(3);
    const { result } = renderHook(() => useRovingTabIndex(items));
    expect(result.current.activeIndex).toBe(0);
  });

  test('handleKeyDown moves to next on ArrowRight', () => {
    const items = makeItems(3);
    const { result } = renderHook(() => useRovingTabIndex(items));

    act(() => {
      result.current.handleKeyDown({
        key: 'ArrowRight',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent);
    });

    expect(result.current.activeIndex).toBe(1);
  });

  test('handleKeyDown moves to next on ArrowDown', () => {
    const items = makeItems(3);
    const { result } = renderHook(() => useRovingTabIndex(items));

    act(() => {
      result.current.handleKeyDown({
        key: 'ArrowDown',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent);
    });

    expect(result.current.activeIndex).toBe(1);
  });

  test('handleKeyDown moves to previous on ArrowLeft', () => {
    const items = makeItems(3);
    const { result } = renderHook(() => useRovingTabIndex(items));

    act(() => {
      result.current.setActiveIndex(2);
    });
    act(() => {
      result.current.handleKeyDown({
        key: 'ArrowLeft',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent);
    });

    expect(result.current.activeIndex).toBe(1);
  });

  test('handleKeyDown moves to previous on ArrowUp', () => {
    const items = makeItems(3);
    const { result } = renderHook(() => useRovingTabIndex(items));

    act(() => {
      result.current.setActiveIndex(2);
    });
    act(() => {
      result.current.handleKeyDown({
        key: 'ArrowUp',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent);
    });

    expect(result.current.activeIndex).toBe(1);
  });

  test('handles Home key', () => {
    const items = makeItems(3);
    const { result } = renderHook(() => useRovingTabIndex(items));

    act(() => {
      result.current.setActiveIndex(2);
    });
    act(() => {
      result.current.handleKeyDown({
        key: 'Home',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent);
    });

    expect(result.current.activeIndex).toBe(0);
  });

  test('handles End key', () => {
    const items = makeItems(3);
    const { result } = renderHook(() => useRovingTabIndex(items));

    act(() => {
      result.current.handleKeyDown({
        key: 'End',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent);
    });

    expect(result.current.activeIndex).toBe(2);
  });

  test('wraps around to start when past last item', () => {
    const items = makeItems(3);
    const { result } = renderHook(() => useRovingTabIndex(items));

    act(() => {
      result.current.setActiveIndex(2);
    });
    act(() => {
      result.current.handleKeyDown({
        key: 'ArrowRight',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent);
    });

    expect(result.current.activeIndex).toBe(0);
  });

  test('wraps around to end when before first item', () => {
    const items = makeItems(3);
    const { result } = renderHook(() => useRovingTabIndex(items));

    act(() => {
      result.current.handleKeyDown({
        key: 'ArrowLeft',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent);
    });

    expect(result.current.activeIndex).toBe(2);
  });

  test('ignores unknown keys', () => {
    const items = makeItems(3);
    const { result } = renderHook(() => useRovingTabIndex(items));

    act(() => {
      result.current.handleKeyDown({
        key: 'Enter',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent);
    });

    expect(result.current.activeIndex).toBe(0);
  });
});
