import { forwardRef } from 'react';
import { Button, CircularProgress, Box } from '@mui/material';
import type { ButtonProps } from '@mui/material/Button';

export interface LoadingButtonProps
  extends Omit<ButtonProps, 'startIcon' | 'endIcon'> {
  /** Loading state */
  loading?: boolean;
  /** Loading text */
  loadingText?: string;
  /** Icon position when loading */
  loadingPosition?: 'start' | 'end' | 'center';
  /** Start icon (disabled when loading) */
  startIcon?: React.ReactNode;
  /** End icon (disabled when loading) */
  endIcon?: React.ReactNode;
  /** Loading spinner size */
  loadingIndicatorSize?: number;
}

const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  (
    {
      children,
      loading = false,
      loadingText,
      loadingPosition = 'center',
      startIcon,
      endIcon,
      loadingIndicatorSize,
      disabled,
      ...props
    },
    ref
  ) => {
    const getSpinnerSize = () => {
      if (loadingIndicatorSize) return loadingIndicatorSize;

      const size = props.size;
      switch (size) {
        case 'small':
          return 16;
        case 'large':
          return 20;
        case 'medium':
        default:
          return 18;
      }
    };

    const renderLoadingSpinner = () => (
      <CircularProgress size={getSpinnerSize()} color="inherit" thickness={4} />
    );

    const getButtonContent = () => {
      if (!loading) {
        return children;
      }

      const displayText = loadingText || children;
      const spinner = renderLoadingSpinner();

      switch (loadingPosition) {
        case 'start':
          return (
            <Box display="flex" alignItems="center" gap={1}>
              {spinner}
              {displayText}
            </Box>
          );
        case 'end':
          return (
            <Box display="flex" alignItems="center" gap={1}>
              {displayText}
              {spinner}
            </Box>
          );
        case 'center':
        default:
          return (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              gap={1}
            >
              {spinner}
              {displayText}
            </Box>
          );
      }
    };

    const getStartIcon = () => {
      if (loading && loadingPosition === 'start') {
        return renderLoadingSpinner();
      }
      return loading ? undefined : startIcon;
    };

    const getEndIcon = () => {
      if (loading && loadingPosition === 'end') {
        return renderLoadingSpinner();
      }
      return loading ? undefined : endIcon;
    };

    return (
      <Button
        ref={ref}
        disabled={disabled || loading}
        startIcon={loadingPosition !== 'center' ? getStartIcon() : undefined}
        endIcon={loadingPosition !== 'center' ? getEndIcon() : undefined}
        {...props}
      >
        {loadingPosition === 'center'
          ? getButtonContent()
          : children || loadingText}
      </Button>
    );
  }
);

LoadingButton.displayName = 'LoadingButton';

export default LoadingButton;
