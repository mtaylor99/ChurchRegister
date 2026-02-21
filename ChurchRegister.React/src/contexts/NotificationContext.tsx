import React, { createContext, useState, useCallback, useEffect } from 'react';
import {
  Snackbar,
  Alert,
  Slide,
  type SlideProps,
  type AlertColor,
} from '@mui/material';
import { notificationManager } from '../utils/notificationManager';

export interface NotificationState {
  open: boolean;
  message: string;
  severity: AlertColor;
  autoHideDuration?: number;
}

export interface NotificationContextValue {
  showNotification: (
    message: string,
    severity?: AlertColor,
    autoHideDuration?: number
  ) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
  hideNotification: () => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined
);

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

export interface NotificationProviderProps {
  children: React.ReactNode;
  defaultAutoHideDuration?: number;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  defaultAutoHideDuration = 6000,
}) => {
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: '',
    severity: 'info',
    autoHideDuration: defaultAutoHideDuration,
  });

  const showNotification = useCallback(
    (
      message: string,
      severity: AlertColor = 'info',
      autoHideDuration = defaultAutoHideDuration
    ) => {
      setNotification({
        open: true,
        message,
        severity,
        autoHideDuration,
      });
    },
    [defaultAutoHideDuration]
  );

  const showSuccess = useCallback(
    (message: string) => {
      showNotification(message, 'success');
    },
    [showNotification]
  );

  const showError = useCallback(
    (message: string) => {
      showNotification(message, 'error', 8000); // Longer duration for errors
    },
    [showNotification]
  );

  const showWarning = useCallback(
    (message: string) => {
      showNotification(message, 'warning');
    },
    [showNotification]
  );

  const showInfo = useCallback(
    (message: string) => {
      showNotification(message, 'info');
    },
    [showNotification]
  );

  const hideNotification = useCallback(() => {
    setNotification((prev) => ({
      ...prev,
      open: false,
    }));
  }, []);

  // Register the notification handler with the global notification manager
  useEffect(() => {
    notificationManager.setNotificationHandler((message, severity = 'info') => {
      showNotification(message, severity);
    });
  }, [showNotification]);

  const handleClose = useCallback(
    (_event?: React.SyntheticEvent | Event, reason?: string) => {
      if (reason === 'clickaway') {
        return;
      }
      hideNotification();
    },
    [hideNotification]
  );

  const contextValue: NotificationContextValue = {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideNotification,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <Snackbar
        open={notification.open}
        autoHideDuration={notification.autoHideDuration}
        onClose={handleClose}
        TransitionComponent={SlideTransition}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ zIndex: (theme) => theme.zIndex.snackbar }}
      >
        <Alert
          onClose={handleClose}
          severity={notification.severity}
          variant="filled"
          sx={{
            width: '100%',
            fontWeight: 500,
            '& .MuiAlert-icon': {
              fontSize: '1.25rem',
            },
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextValue => {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotification must be used within a NotificationProvider'
    );
  }
  return context;
};

export default NotificationContext;
