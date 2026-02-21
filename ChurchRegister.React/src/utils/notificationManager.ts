/**
 * Global notification manager for showing toast messages
 * This allows notifications to be triggered from anywhere in the app,
 * including API interceptors and services outside React components
 */

type NotificationCallback = (
  message: string,
  severity?: 'success' | 'error' | 'warning' | 'info'
) => void;

class NotificationManager {
  private notificationHandler: NotificationCallback | null = null;

  /**
   * Register the notification handler (should be called by NotificationProvider)
   */
  setNotificationHandler(handler: NotificationCallback) {
    this.notificationHandler = handler;
  }

  /**
   * Show a notification
   */
  showNotification(
    message: string,
    severity: 'success' | 'error' | 'warning' | 'info' = 'info'
  ) {
    if (this.notificationHandler) {
      this.notificationHandler(message, severity);
    } else {
      console.warn('Notification handler not registered. Message:', message);
    }
  }

  /**
   * Show success notification
   */
  showSuccess(message: string) {
    this.showNotification(message, 'success');
  }

  /**
   * Show error notification
   */
  showError(message: string) {
    this.showNotification(message, 'error');
  }

  /**
   * Show warning notification
   */
  showWarning(message: string) {
    this.showNotification(message, 'warning');
  }

  /**
   * Show info notification
   */
  showInfo(message: string) {
    this.showNotification(message, 'info');
  }
}

// Export singleton instance
export const notificationManager = new NotificationManager();
