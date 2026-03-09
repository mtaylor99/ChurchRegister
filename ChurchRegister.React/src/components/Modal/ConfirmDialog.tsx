import { forwardRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
} from '@mui/icons-material';
import type { SxProps, Theme } from '@mui/material/styles';

export interface ConfirmDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Function to call when dialog should close */
  onClose: () => void;
  /** Function to call when user confirms */
  onConfirm: () => void;
  /** Dialog title */
  title?: string;
  /** Dialog message/content */
  message?: string;
  /** Custom content (overrides message) */
  children?: React.ReactNode;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Dialog variant/severity */
  variant?: 'info' | 'warning' | 'error' | 'success';
  /** Confirm button color */
  confirmColor?:
    | 'primary'
    | 'secondary'
    | 'error'
    | 'warning'
    | 'info'
    | 'success';
  /** Whether confirm action is destructive */
  destructive?: boolean;
  /** Loading state for confirm button */
  loading?: boolean;
  /** Maximum width of the dialog */
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Custom styling */
  sx?: SxProps<Theme>;
}

const ConfirmDialog = forwardRef<HTMLDivElement, ConfirmDialogProps>(
  (
    {
      open,
      onClose,
      onConfirm,
      title,
      message,
      children,
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      variant = 'info',
      confirmColor,
      destructive = false,
      loading = false,
      maxWidth = 'sm',
      sx,
    },
    ref
  ) => {
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

    const handleConfirm = () => {
      onConfirm();
    };

    const getIcon = () => {
      switch (variant) {
        case 'warning':
          return <WarningIcon color="warning" sx={{ fontSize: 24 }} />;
        case 'error':
          return <ErrorIcon color="error" sx={{ fontSize: 24 }} />;
        case 'success':
          return <SuccessIcon color="success" sx={{ fontSize: 24 }} />;
        case 'info':
        default:
          return <InfoIcon color="info" sx={{ fontSize: 24 }} />;
      }
    };

    const getConfirmColor = () => {
      if (confirmColor) {
        return confirmColor;
      }
      if (destructive) {
        return 'error';
      }
      return variant === 'error' ? 'error' : 'primary';
    };

    return (
      <Dialog
        ref={ref}
        open={open}
        onClose={onClose}
        maxWidth={maxWidth}
        fullWidth
        fullScreen={fullScreen}
        PaperProps={{
          sx: {
            borderRadius: fullScreen ? 0 : 2,
            ...sx,
          },
        }}
      >
        {title && (
          <DialogTitle sx={{ pb: 1 }}>
            <Box
              display="flex"
              alignItems="center"
              gap={1}
              sx={{
                bgcolor: 'grey.100',
                p: 2,
                m: -3,
                mb: 0,
                borderRadius: '4px 4px 0 0',
              }}
            >
              {getIcon()}
              <Typography
                variant="h6"
                component="span"
                color="primary.main"
                fontWeight="bold"
              >
                {title}
              </Typography>
            </Box>
          </DialogTitle>
        )}

        <DialogContent sx={{ pb: 2 }}>
          {children ? (
            children
          ) : message ? (
            <DialogContentText component="div">
              {typeof message === 'string' ? (
                <Typography variant="body1" color="text.primary">
                  {message}
                </Typography>
              ) : (
                message
              )}
            </DialogContentText>
          ) : null}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={onClose}
            variant="outlined"
            color="inherit"
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            color={getConfirmColor()}
            disabled={loading}
            sx={{
              minWidth: 100,
              ...(loading && {
                '&.Mui-disabled': {
                  backgroundColor: `${theme.palette[getConfirmColor()].main}80`,
                  color: theme.palette[getConfirmColor()].contrastText,
                },
              }),
            }}
          >
            {loading ? 'Processing...' : confirmText}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
);

ConfirmDialog.displayName = 'ConfirmDialog';

export default ConfirmDialog;
