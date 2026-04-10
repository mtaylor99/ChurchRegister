import React, { useState, useEffect, useCallback } from 'react';
import { FocusContext } from '../components/Accessibility/FocusManager';
import type { FocusContextType } from '../components/Accessibility/FocusManager';

/**
 * Hook to access the focus management context.
 * Must be used within a FocusManager component.
 * @returns FocusContextType with focus management utilities
 * @throws Error if used outside FocusManager
 */
export const useFocusManager = (): FocusContextType => {
  const context = React.useContext(FocusContext);
  if (!context) {
    throw new Error('useFocusManager must be used within a FocusManager');
  }
  return context;
};

/**
 * Hook that tracks whether focus is within a given container element.
 * @param containerRef - Ref to the container element to track focus within
 * @returns boolean - true when focus is within the container
 */
export const useFocusWithin = (containerRef: React.RefObject<HTMLElement>) => {
  const [focusWithin, setFocusWithin] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleFocusIn = () => setFocusWithin(true);
    const handleFocusOut = (event: FocusEvent) => {
      if (!container.contains(event.relatedTarget as Node)) {
        setFocusWithin(false);
      }
    };

    container.addEventListener('focusin', handleFocusIn);
    container.addEventListener('focusout', handleFocusOut);

    return () => {
      container.removeEventListener('focusin', handleFocusIn);
      container.removeEventListener('focusout', handleFocusOut);
    };
  }, [containerRef]);

  return focusWithin;
};

/**
 * Hook for implementing roving tabindex keyboard navigation pattern.
 * Used in composite widgets like toolbars, menus, and tab lists (WCAG 2.1).
 * @param items - Array of refs to the navigable elements
 * @returns Object with activeIndex and setActiveIndex for controlling focus
 */
export const useRovingTabIndex = (items: React.RefObject<HTMLElement>[]) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    items.forEach((itemRef, index) => {
      if (itemRef.current) {
        itemRef.current.tabIndex = index === activeIndex ? 0 : -1;
      }
    });
  }, [items, activeIndex]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      let newIndex = activeIndex;

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          newIndex = (activeIndex + 1) % items.length;
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          newIndex = (activeIndex - 1 + items.length) % items.length;
          break;
        case 'Home':
          event.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          event.preventDefault();
          newIndex = items.length - 1;
          break;
      }

      if (newIndex !== activeIndex) {
        setActiveIndex(newIndex);
        items[newIndex].current?.focus();
      }
    },
    [items, activeIndex]
  );

  return {
    activeIndex,
    setActiveIndex,
    handleKeyDown,
  };
};
