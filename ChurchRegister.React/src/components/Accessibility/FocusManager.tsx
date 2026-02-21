import React, { useRef, useEffect, useCallback } from 'react';
import { Box } from '@mui/material';

// Focusable elements selector
const FOCUSABLE_ELEMENTS = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
  'audio[controls]',
  'video[controls]',
  'iframe',
  'embed',
  'object',
  'summary',
  'dialog',
].join(',');

export interface FocusTrapProps {
  /** Whether the focus trap is active */
  active?: boolean;
  /** Children to wrap with focus trap */
  children: React.ReactNode;
  /** Callback when focus tries to leave the trap */
  onEscapeAttempt?: () => void;
  /** Whether to restore focus to the trigger element when trap is deactivated */
  restoreFocus?: boolean;
  /** Custom initial focus target */
  initialFocus?: React.RefObject<HTMLElement> | (() => HTMLElement | null);
  /** Whether to auto-focus the first element */
  autoFocus?: boolean;
}

export const FocusTrap: React.FC<FocusTrapProps> = ({
  active = true,
  children,
  onEscapeAttempt,
  restoreFocus = true,
  initialFocus,
  autoFocus = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Store the previously focused element when trap becomes active
  useEffect(() => {
    if (active) {
      previousActiveElement.current = document.activeElement as HTMLElement;
    }
  }, [active]);

  // Focus management
  useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      FOCUSABLE_ELEMENTS
    ) as NodeListOf<HTMLElement>;

    if (focusableElements.length === 0) return;

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    // Set initial focus
    if (autoFocus) {
      if (initialFocus) {
        const targetElement =
          typeof initialFocus === 'function'
            ? initialFocus()
            : initialFocus.current;

        if (targetElement) {
          targetElement.focus();
        } else {
          firstFocusable.focus();
        }
      } else {
        firstFocusable.focus();
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      // If only one focusable element, prevent default tab behavior
      if (focusableElements.length === 1) {
        event.preventDefault();
        return;
      }

      if (event.shiftKey) {
        // Shift+Tab: moving backwards
        if (document.activeElement === firstFocusable) {
          event.preventDefault();
          lastFocusable.focus();
        }
      } else {
        // Tab: moving forwards
        if (document.activeElement === lastFocusable) {
          event.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    const handleFocusOut = (event: FocusEvent) => {
      // Check if the new focus target is outside the container
      if (!container.contains(event.relatedTarget as Node)) {
        onEscapeAttempt?.();

        // If no escape handler, bring focus back to first element
        if (!onEscapeAttempt) {
          event.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    container.addEventListener('focusout', handleFocusOut);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      container.removeEventListener('focusout', handleFocusOut);
    };
  }, [active, autoFocus, initialFocus, onEscapeAttempt]);

  // Restore focus when trap is deactivated
  useEffect(() => {
    return () => {
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [restoreFocus]);

  if (!active) {
    return <>{children}</>;
  }

  return (
    <Box
      ref={containerRef}
      sx={{
        outline: 'none',
      }}
    >
      {children}
    </Box>
  );
};

export interface FocusManagerProps {
  /** Children components */
  children: React.ReactNode;
}

// Context for focus management across the application
const FocusContext = React.createContext<{
  trapFocus: (element: HTMLElement) => void;
  releaseFocus: () => void;
  announceFocus: (message: string) => void;
}>({
  trapFocus: () => {},
  releaseFocus: () => {},
  announceFocus: () => {},
});

// Export the context for use in custom hooks
export { FocusContext };
export type FocusContextType = {
  trapFocus: (element: HTMLElement) => void;
  releaseFocus: () => void;
  announceFocus: (message: string) => void;
};

export const FocusManager: React.FC<FocusManagerProps> = ({ children }) => {
  const focusStackRef = React.useRef<HTMLElement[]>([]);

  const trapFocus = useCallback((element: HTMLElement) => {
    focusStackRef.current.push(document.activeElement as HTMLElement);
    element.focus();
  }, []);

  const releaseFocus = useCallback(() => {
    const previousElement = focusStackRef.current.pop();
    if (previousElement) {
      previousElement.focus();
    }
  }, []);

  const announceFocus = useCallback((message: string) => {
    // Create a temporary live region for the announcement
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'assertive');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.position = 'absolute';
    liveRegion.style.left = '-10000px';
    liveRegion.style.width = '1px';
    liveRegion.style.height = '1px';
    liveRegion.style.overflow = 'hidden';

    document.body.appendChild(liveRegion);
    liveRegion.textContent = message;

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(liveRegion);
    }, 1000);
  }, []);

  const contextValue = React.useMemo(
    () => ({
      trapFocus,
      releaseFocus,
      announceFocus,
    }),
    [trapFocus, releaseFocus, announceFocus]
  );

  return (
    <FocusContext.Provider value={contextValue}>
      {children}
    </FocusContext.Provider>
  );
};

export default FocusManager;
