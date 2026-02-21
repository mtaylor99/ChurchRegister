import React, { createContext, useState, useEffect } from 'react';
import { useTheme } from '@mui/material';
import { SkipNavigation } from './SkipNavigation';
import { FocusManager } from './FocusManager';
import { useScreenReaderAnnouncement } from '../../hooks/useAccessibility';

export interface AccessibilitySettings {
  /** High contrast mode enabled */
  highContrast: boolean;
  /** Reduced motion preference */
  reduceMotion: boolean;
  /** Font size multiplier */
  fontSize: number;
  /** Focus indicators enhanced */
  enhancedFocus: boolean;
  /** Screen reader optimizations */
  screenReaderMode: boolean;
  /** Keyboard navigation only */
  keyboardOnly: boolean;
}

export interface AccessibilityContextType {
  /** Current accessibility settings */
  settings: AccessibilitySettings;
  /** Update accessibility settings */
  updateSettings: (settings: Partial<AccessibilitySettings>) => void;
  /** Announce message to screen readers */
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  /** Check if user prefers reduced motion */
  prefersReducedMotion: boolean;
  /** Check if high contrast is preferred */
  prefersHighContrast: boolean;
  /** Toggle setting */
  toggleSetting: (setting: keyof AccessibilitySettings) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(
  null
);

// Export the context for use in custom hooks
export { AccessibilityContext };

export interface AccessibilityProviderProps {
  children: React.ReactNode;
  /** Default accessibility settings */
  defaultSettings?: Partial<AccessibilitySettings>;
  /** Whether to detect system preferences */
  detectSystemPreferences?: boolean;
  /** Whether to include skip navigation */
  includeSkipNavigation?: boolean;
}

const defaultAccessibilitySettings: AccessibilitySettings = {
  highContrast: false,
  reduceMotion: false,
  fontSize: 1,
  enhancedFocus: false,
  screenReaderMode: false,
  keyboardOnly: false,
};

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({
  children,
  defaultSettings = {},
  detectSystemPreferences = true,
  includeSkipNavigation = true,
}) => {
  const theme = useTheme();
  const { announce, AnnouncementRegion } = useScreenReaderAnnouncement();

  // Detect system preferences
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);

  // Initialize settings
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    const storedSettings = localStorage.getItem('accessibility-settings');
    const parsedSettings = storedSettings ? JSON.parse(storedSettings) : {};

    return {
      ...defaultAccessibilitySettings,
      ...defaultSettings,
      ...parsedSettings,
    };
  });

  // Detect system preferences on mount
  useEffect(() => {
    if (!detectSystemPreferences) return;

    // Check for reduced motion preference
    const reducedMotionQuery = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    );
    setPrefersReducedMotion(reducedMotionQuery.matches);

    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
      if (e.matches) {
        updateSettings({ reduceMotion: true });
      }
    };

    // Check for high contrast preference
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    setPrefersHighContrast(highContrastQuery.matches);

    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      setPrefersHighContrast(e.matches);
      if (e.matches) {
        updateSettings({ highContrast: true });
      }
    };

    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
    highContrastQuery.addEventListener('change', handleHighContrastChange);

    return () => {
      reducedMotionQuery.removeEventListener(
        'change',
        handleReducedMotionChange
      );
      highContrastQuery.removeEventListener('change', handleHighContrastChange);
    };
  }, [detectSystemPreferences]);

  // Apply settings to document
  useEffect(() => {
    const root = document.documentElement;

    // High contrast mode
    if (settings.highContrast) {
      root.style.setProperty('--accessibility-high-contrast', '1');
      document.body.classList.add('high-contrast');
    } else {
      root.style.removeProperty('--accessibility-high-contrast');
      document.body.classList.remove('high-contrast');
    }

    // Reduced motion
    if (settings.reduceMotion) {
      root.style.setProperty('--accessibility-reduced-motion', '1');
      document.body.classList.add('reduce-motion');
    } else {
      root.style.removeProperty('--accessibility-reduced-motion');
      document.body.classList.remove('reduce-motion');
    }

    // Font size
    if (settings.fontSize !== 1) {
      root.style.setProperty(
        '--accessibility-font-scale',
        settings.fontSize.toString()
      );
      document.body.style.fontSize = `${settings.fontSize}rem`;
    } else {
      root.style.removeProperty('--accessibility-font-scale');
      document.body.style.removeProperty('font-size');
    }

    // Enhanced focus
    if (settings.enhancedFocus) {
      document.body.classList.add('enhanced-focus');
    } else {
      document.body.classList.remove('enhanced-focus');
    }

    // Screen reader mode
    if (settings.screenReaderMode) {
      document.body.classList.add('screen-reader-mode');
    } else {
      document.body.classList.remove('screen-reader-mode');
    }

    // Keyboard only mode
    if (settings.keyboardOnly) {
      document.body.classList.add('keyboard-only');
    } else {
      document.body.classList.remove('keyboard-only');
    }
  }, [settings]);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
  }, [settings]);

  // Detect keyboard usage
  useEffect(() => {
    let isKeyboardUser = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        isKeyboardUser = true;
        document.body.classList.add('keyboard-navigation');
      }
    };

    const handleMouseDown = () => {
      if (isKeyboardUser) {
        document.body.classList.remove('keyboard-navigation');
        isKeyboardUser = false;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const toggleSetting = (setting: keyof AccessibilitySettings) => {
    setSettings((prev) => ({
      ...prev,
      [setting]:
        typeof prev[setting] === 'boolean' ? !prev[setting] : prev[setting],
    }));
  };

  const contextValue: AccessibilityContextType = {
    settings,
    updateSettings,
    announce,
    prefersReducedMotion,
    prefersHighContrast,
    toggleSetting,
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      <FocusManager>
        {includeSkipNavigation && <SkipNavigation />}
        {children}
        {AnnouncementRegion}
      </FocusManager>

      {/* CSS for accessibility enhancements */}
      <style>{`
        /* High contrast mode */
        .high-contrast {
          filter: contrast(150%);
        }
        
        .high-contrast * {
          border-color: currentColor !important;
        }

        /* Reduced motion */
        .reduce-motion *,
        .reduce-motion *::before,
        .reduce-motion *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }

        /* Enhanced focus indicators */
        .enhanced-focus *:focus {
          outline: 3px solid ${theme.palette.primary.main} !important;
          outline-offset: 2px !important;
          box-shadow: 0 0 0 5px rgba(33, 150, 243, 0.3) !important;
        }

        /* Keyboard navigation indicators */
        .keyboard-navigation *:focus {
          outline: 2px solid ${theme.palette.primary.main} !important;
          outline-offset: 1px !important;
        }

        /* Screen reader mode optimizations */
        .screen-reader-mode {
          font-family: monospace;
          line-height: 1.6;
        }

        .screen-reader-mode * {
          speak: always;
        }

        /* Keyboard only mode */
        .keyboard-only [tabindex="-1"]:focus {
          outline: 2px solid ${theme.palette.secondary.main} !important;
        }

        /* Text sizing */
        @media (prefers-reduced-motion: reduce) {
          .reduce-motion *,
          .reduce-motion *::before,
          .reduce-motion *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }

        @media (prefers-contrast: high) {
          .high-contrast {
            filter: contrast(200%);
          }
        }
      `}</style>
    </AccessibilityContext.Provider>
  );
};

export default AccessibilityProvider;
