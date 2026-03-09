import { useContext } from 'react';
import NotificationContext, {
  type NotificationContextValue,
} from '../contexts/NotificationContext';

/**
 * Hook to access the notification context for displaying toast messages.
 * Must be used within a NotificationProvider.
 * @returns NotificationContextValue with showSuccess, showError, showWarning, showInfo methods
 * @throws Error if used outside NotificationProvider
 */
export const useNotification = (): NotificationContextValue => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      'useNotification must be used within a NotificationProvider'
    );
  }
  return context;
};
