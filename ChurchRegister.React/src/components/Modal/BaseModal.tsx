import { forwardRef } from 'react';
import { Modal, Box, Paper, IconButton, Fade, Backdrop } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import type { SxProps, Theme } from '@mui/material/styles';

export interface BaseModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Function to call when modal should close */
  onClose: () => void;
  /** Modal content */
  children: React.ReactNode;
  /** Modal title */
  title?: string;
  /** Maximum width of the modal */
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  /** Whether to show close button */
  showCloseButton?: boolean;
  /** Whether clicking backdrop closes modal */
  closeOnBackdropClick?: boolean;
  /** Whether pressing escape closes modal */
  closeOnEscapeKey?: boolean;
  /** Custom styling for the modal container */
  sx?: SxProps<Theme>;
  /** Custom styling for the modal content */
  contentSx?: SxProps<Theme>;
  /** Full screen modal */
  fullScreen?: boolean;
  /** Keep mounted for animation purposes */
  keepMounted?: boolean;
}

const BaseModal = forwardRef<HTMLDivElement, BaseModalProps>(
  (
    {
      open,
      onClose,
      children,
      maxWidth = 'md',
      showCloseButton = true,
      closeOnBackdropClick = true,
      closeOnEscapeKey = true,
      sx,
      contentSx,
      fullScreen = false,
      keepMounted = false,
    },
    ref
  ) => {
    const theme = useTheme();

    const handleClose = (
      _event: object,
      reason: 'backdropClick' | 'escapeKeyDown'
    ) => {
      if (reason === 'backdropClick' && !closeOnBackdropClick) {
        return;
      }
      if (reason === 'escapeKeyDown' && !closeOnEscapeKey) {
        return;
      }
      onClose();
    };

    const getMaxWidth = () => {
      if (typeof maxWidth === 'number') {
        return maxWidth;
      }

      switch (maxWidth) {
        case 'xs':
          return 320;
        case 'sm':
          return 480;
        case 'md':
          return 640;
        case 'lg':
          return 896;
        case 'xl':
          return 1152;
        default:
          return 640;
      }
    };

    return (
      <Modal
        ref={ref}
        open={open}
        onClose={handleClose}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 500,
          },
        }}
        keepMounted={keepMounted}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: fullScreen ? 0 : 2,
          ...sx,
        }}
      >
        <Fade in={open}>
          <Paper
            elevation={8}
            sx={{
              position: 'relative',
              width: fullScreen ? '100vw' : '100%',
              height: fullScreen ? '100vh' : 'auto',
              maxWidth: fullScreen ? 'none' : getMaxWidth(),
              maxHeight: fullScreen ? 'none' : 'calc(100vh - 64px)',
              borderRadius: fullScreen ? 0 : 2,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              '&:focus-visible': {
                outline: `2px solid ${theme.palette.primary.main}`,
                outlineOffset: 2,
              },
              ...contentSx,
            }}
          >
            {/* Close Button */}
            {showCloseButton && (
              <IconButton
                onClick={onClose}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                  zIndex: 1,
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.08)',
                  },
                }}
                size="small"
              >
                <CloseIcon />
              </IconButton>
            )}

            {/* Content */}
            <Box
              sx={{
                flex: 1,
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {children}
            </Box>
          </Paper>
        </Fade>
      </Modal>
    );
  }
);

BaseModal.displayName = 'BaseModal';

export default BaseModal;
