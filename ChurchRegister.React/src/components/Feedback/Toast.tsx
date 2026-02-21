import React from 'react';
import { Snackbar, Alert, AlertTitle, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

export interface ToastProps {
  /** Whether the toast is open */
  open: boolean;
  /** Toast message */
  message: string;
  /** Toast title (optional) */
  title?: string;
  /** Toast severity */
  severity?: 'success' | 'error' | 'warning' | 'info';
  /** Duration in milliseconds (0 for persistent) */
  duration?: number;
  /** Position of the toast */
  position?: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
  /** Callback when toast is closed */
  onClose?: (event?: React.SyntheticEvent | Event, reason?: string) => void;
  /** Whether to show close button */
  showCloseButton?: boolean;
  /** Custom action buttons */
  action?: React.ReactNode;
}

export const Toast: React.FC<ToastProps> = ({
  open,
  message,
  title,
  severity = 'info',
  duration = 6000,
  position = { vertical: 'bottom', horizontal: 'left' },
  onClose,
  showCloseButton = true,
  action,
}) => {
  const handleClose = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === 'clickaway') {
      return;
    }
    onClose?.(event, reason);
  };

  const closeButton = showCloseButton ? (
    <IconButton
      size="small"
      aria-label="close"
      color="inherit"
      onClick={handleClose}
    >
      <CloseIcon fontSize="small" />
    </IconButton>
  ) : null;

  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={handleClose}
      anchorOrigin={position}
      sx={{
        '& .MuiSnackbarContent-root': {
          padding: 0,
        },
      }}
    >
      <Alert
        onClose={showCloseButton ? handleClose : undefined}
        severity={severity}
        variant="filled"
        action={action || closeButton}
        sx={{
          width: '100%',
          minWidth: 300,
          maxWidth: 500,
          '& .MuiAlert-message': {
            width: '100%',
          },
        }}
      >
        {title && <AlertTitle>{title}</AlertTitle>}
        {message}
      </Alert>
    </Snackbar>
  );
};
