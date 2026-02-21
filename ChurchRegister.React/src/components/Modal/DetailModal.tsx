import { forwardRef } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Divider,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import type { SxProps, Theme } from '@mui/material/styles';

export interface DetailModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Function to call when modal should close */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Modal subtitle */
  subtitle?: string;
  /** Modal content */
  children: React.ReactNode;
  /** Action buttons */
  actions?: React.ReactNode;
  /** Maximum width of the modal */
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Full width modal */
  fullWidth?: boolean;
  /** Full screen on mobile */
  fullScreenOnMobile?: boolean;
  /** Whether to show dividers */
  dividers?: boolean;
  /** Whether to show close button */
  showCloseButton?: boolean;
  /** Custom styling */
  sx?: SxProps<Theme>;
  /** Custom content styling */
  contentSx?: SxProps<Theme>;
  /** Custom title styling */
  titleSx?: SxProps<Theme>;
  /** Custom actions styling */
  actionsSx?: SxProps<Theme>;
}

const DetailModal = forwardRef<HTMLDivElement, DetailModalProps>(
  (
    {
      open,
      onClose,
      title,
      subtitle,
      children,
      actions,
      maxWidth = 'lg',
      fullWidth = true,
      fullScreenOnMobile = true,
      dividers = true,
      showCloseButton = true,
      sx,
      contentSx,
      titleSx,
      actionsSx,
    },
    ref
  ) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const fullScreen = fullScreenOnMobile && isMobile;

    return (
      <Dialog
        ref={ref}
        open={open}
        onClose={onClose}
        maxWidth={maxWidth}
        fullWidth={fullWidth}
        fullScreen={fullScreen}
        scroll="paper"
        PaperProps={{
          sx: {
            borderRadius: fullScreen ? 0 : 2,
            maxHeight: fullScreen ? '100vh' : 'calc(100vh - 64px)',
            ...sx,
          },
        }}
      >
        {(title || subtitle) && (
          <>
            <DialogTitle
              sx={{
                position: 'relative',
                pr: showCloseButton ? 6 : 3,
                ...titleSx,
              }}
            >
              <Box
                sx={{
                  bgcolor: 'grey.100',
                  p: 2,
                  m: -3,
                  mb: 0,
                  borderRadius: '4px 4px 0 0',
                  pr: showCloseButton ? 6 : 2,
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

                {showCloseButton && (
                  <IconButton
                    onClick={onClose}
                    sx={{
                      position: 'absolute',
                      right: 8,
                      top: 8,
                      color: 'primary.main',
                    }}
                    size="small"
                  >
                    <CloseIcon />
                  </IconButton>
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
            flex: 1,
            overflow: 'auto',
            ...contentSx,
          }}
        >
          {children}
        </DialogContent>

        {actions && (
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
              {actions}
            </DialogActions>
          </>
        )}
      </Dialog>
    );
  }
);

DetailModal.displayName = 'DetailModal';

export default DetailModal;
