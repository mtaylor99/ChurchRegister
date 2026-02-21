import { forwardRef } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';

export interface FormDialogAction {
  label: string;
  onClick: () => void;
  variant?: 'text' | 'outlined' | 'contained';
  color?:
    | 'inherit'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'error'
    | 'info'
    | 'warning';
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export interface FormDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Function to call when dialog should close */
  onClose: () => void;
  /** Dialog title */
  title?: string;
  /** Dialog subtitle */
  subtitle?: string;
  /** Dialog content */
  children: React.ReactNode;
  /** Action buttons */
  actions?: FormDialogAction[];
  /** Maximum width of the dialog */
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Full width dialog */
  fullWidth?: boolean;
  /** Whether to show dividers */
  dividers?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Custom styling */
  sx?: SxProps<Theme>;
  /** Custom content styling */
  contentSx?: SxProps<Theme>;
  /** Custom actions styling */
  actionsSx?: SxProps<Theme>;
  /** Form submission handler */
  onSubmit?: (event: React.FormEvent) => void;
  /** Disable backdrop click to close */
  disableBackdropClick?: boolean;
  /** Disable escape key to close */
  disableEscapeKeyDown?: boolean;
}

const FormDialog = forwardRef<HTMLDivElement, FormDialogProps>(
  (
    {
      open,
      onClose,
      title,
      subtitle,
      children,
      actions = [],
      maxWidth = 'md',
      fullWidth = true,
      dividers = true,
      loading = false,
      sx,
      contentSx,
      actionsSx,
      onSubmit,
      disableBackdropClick = false,
      disableEscapeKeyDown = false,
    },
    ref
  ) => {
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

    const handleClose = (
      _event: object,
      reason: 'backdropClick' | 'escapeKeyDown'
    ) => {
      if (reason === 'backdropClick' && disableBackdropClick) {
        return;
      }
      if (reason === 'escapeKeyDown' && disableEscapeKeyDown) {
        return;
      }
      onClose();
    };

    const handleSubmit = (event: React.FormEvent) => {
      event.preventDefault();
      if (onSubmit) {
        onSubmit(event);
      }
    };

    const defaultActions: FormDialogAction[] =
      actions.length > 0
        ? actions
        : [
            {
              label: 'Cancel',
              onClick: onClose,
              variant: 'outlined',
              color: 'inherit',
            },
            {
              label: 'Save',
              onClick: () => {},
              variant: 'contained',
              color: 'primary',
              type: 'submit',
            },
          ];

    const content = (
      <>
        {(title || subtitle) && (
          <>
            <DialogTitle sx={{ pb: subtitle ? 1 : 2 }}>
              <Box
                sx={{
                  bgcolor: 'grey.100',
                  p: 2,
                  m: -3,
                  mb: subtitle ? 0 : 2,
                  borderRadius: '4px 4px 0 0',
                }}
              >
                <Typography
                  variant="h5"
                  component="h2"
                  gutterBottom={!!subtitle}
                  color="primary.main"
                  fontWeight="bold"
                >
                  {title}
                </Typography>
                {subtitle && (
                  <Typography variant="body2" color="text.secondary">
                    {subtitle}
                  </Typography>
                )}
              </Box>
            </DialogTitle>
            {dividers && <Divider />}
          </>
        )}

        <DialogContent
          dividers={dividers && !title}
          sx={{
            p: 3,
            ...contentSx,
          }}
        >
          {children}
        </DialogContent>

        {defaultActions.length > 0 && (
          <>
            {dividers && <Divider />}
            <DialogActions
              sx={{
                p: 3,
                gap: 1,
                justifyContent: 'flex-end',
                ...actionsSx,
              }}
            >
              {defaultActions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || 'text'}
                  color={action.color || 'primary'}
                  onClick={action.onClick}
                  disabled={action.disabled || loading}
                  type={action.type || 'button'}
                  sx={{
                    minWidth: 100,
                    ...(action.loading &&
                      action.color &&
                      action.color !== 'inherit' && {
                        '&.Mui-disabled': {
                          backgroundColor: `${theme.palette[action.color].main}80`,
                          color: theme.palette[action.color].contrastText,
                        },
                      }),
                  }}
                >
                  {action.loading ? 'Processing...' : action.label}
                </Button>
              ))}
            </DialogActions>
          </>
        )}
      </>
    );

    return (
      <Dialog
        ref={ref}
        open={open}
        onClose={handleClose}
        maxWidth={maxWidth}
        fullWidth={fullWidth}
        fullScreen={fullScreen}
        PaperProps={{
          component: onSubmit ? 'form' : 'div',
          onSubmit: onSubmit ? handleSubmit : undefined,
          sx: {
            borderRadius: fullScreen ? 0 : 2,
            ...sx,
          },
        }}
      >
        {content}
      </Dialog>
    );
  }
);

FormDialog.displayName = 'FormDialog';

export default FormDialog;
