import { useContext } from 'react';
import React from 'react';
import { AccessibilityContext } from '../components/Accessibility/AccessibilityProvider';
import type { AccessibilityContextType } from '../components/Accessibility/AccessibilityProvider';
import { LiveRegion } from '../components/Accessibility/ScreenReaderOnly';

// Hook to use accessibility context
export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error(
      'useAccessibility must be used within an AccessibilityProvider'
    );
  }
  return context;
};

// Hook for managing screen reader announcements
export const useScreenReaderAnnouncement = () => {
  const [announcement, setAnnouncement] = React.useState<string>('');
  const [announcementPriority, setAnnouncementPriority] = React.useState<
    'polite' | 'assertive'
  >('polite');

  const announce = React.useCallback(
    (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      // Clear the announcement first to ensure it's re-read if the same message is announced
      setAnnouncement('');
      setAnnouncementPriority(priority);

      // Use a small delay to ensure the screen reader picks up the change
      setTimeout(() => {
        setAnnouncement(message);
      }, 100);

      // Clear the announcement after a delay to prevent it from being read multiple times
      setTimeout(() => {
        setAnnouncement('');
      }, 1000);
    },
    []
  );

  const AnnouncementRegion = React.useMemo(() => {
    return (
      <LiveRegion
        priority={announcementPriority}
        aria-label="Status announcements"
      >
        {announcement}
      </LiveRegion>
    );
  }, [announcement, announcementPriority]);

  return { announce, AnnouncementRegion };
};
