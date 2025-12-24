import React from 'react';

export interface ToastMessage {
  id: string;
  message: string;
  title?: string;
  severity: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

// Hook for managing toast state
export const useToast = () => {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const showToast = React.useCallback(
    (
      message: string,
      options?: {
        title?: string;
        severity?: 'success' | 'error' | 'warning' | 'info';
        duration?: number;
      }
    ) => {
      const id = Date.now().toString();
      const newToast: ToastMessage = {
        id,
        message,
        title: options?.title,
        severity: options?.severity || 'info',
        duration: options?.duration || 6000,
      };

      setToasts((prev) => [...prev, newToast]);

      // Auto-remove toast after duration
      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, newToast.duration);
      }

      return id;
    },
    []
  );

  const hideToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showSuccess = React.useCallback(
    (message: string, title?: string) => {
      return showToast(message, { severity: 'success', title });
    },
    [showToast]
  );

  const showError = React.useCallback(
    (message: string, title?: string) => {
      return showToast(message, { severity: 'error', title, duration: 8000 });
    },
    [showToast]
  );

  const showWarning = React.useCallback(
    (message: string, title?: string) => {
      return showToast(message, { severity: 'warning', title });
    },
    [showToast]
  );

  const showInfo = React.useCallback(
    (message: string, title?: string) => {
      return showToast(message, { severity: 'info', title });
    },
    [showToast]
  );

  const clearAll = React.useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    showToast,
    hideToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearAll,
  };
};
