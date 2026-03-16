import { forwardRef } from 'react';
import { Fab as MUIFab, Tooltip, CircularProgress, Zoom } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { FabProps as MUIFabProps } from '@mui/material';

export interface FloatingActionButtonProps extends Omit<MUIFabProps, 'size'> {
  /** Button size */
  size?: 'small' | 'medium' | 'large';
  /** Loading state */
  loading?: boolean;
  /** Tooltip text */
  tooltip?: string;
  /** Color variant */
  colorVariant?:
    | 'primary'
    | 'secondary'
    | 'error'
    | 'warning'
    | 'info'
    | 'success';
  /** Show animation */
  show?: boolean;
  /** Position for fixed FAB */
  position?: {
    bottom?: number | string;
    right?: number | string;
    top?: number | string;
    left?: number | string;
  };
}

const FloatingActionButton = forwardRef<
  HTMLButtonElement,
  FloatingActionButtonProps
>(
  (
    {
      children,
      size = 'large',
      loading = false,
      tooltip,
      disabled,
      colorVariant = 'primary',
      show = true,
      position,
      sx,
      ...props
    },
    ref
  ) => {
    const theme = useTheme();

    const getColorProps = () => {
      switch (colorVariant) {
        case 'primary':
          return { color: 'primary' as const };
        case 'secondary':
          return { color: 'secondary' as const };
        case 'error':
          return { color: 'error' as const };
        case 'warning':
          return { color: 'warning' as const };
        case 'info':
          return { color: 'info' as const };
        case 'success':
          return { color: 'success' as const };
        default:
          return { color: 'primary' as const };
      }
    };

    const getPositionStyles = () => {
      if (!position) return {};

      return {
        position: 'fixed' as const,
        zIndex: theme.zIndex.fab,
        ...position,
      };
    };

    const isDisabled = disabled || loading;

    const buttonContent = loading ? (
      <CircularProgress
        size={size === 'small' ? 16 : size === 'medium' ? 20 : 24}
        color="inherit"
      />
    ) : (
      children
    );

    const fab = (
      <MUIFab
        ref={ref}
        size={size}
        disabled={isDisabled}
        {...getColorProps()}
        sx={{
          ...getPositionStyles(),
          boxShadow: theme.shadows[6],
          '&:hover': {
            boxShadow: theme.shadows[8],
            transform: 'scale(1.05)',
          },
          '&:active': {
            transform: 'scale(0.95)',
          },
          transition: 'all 0.2s ease-in-out',
          ...sx,
        }}
        {...props}
      >
        {buttonContent}
      </MUIFab>
    );

    const wrappedFab = (
      <Zoom in={show} timeout={300}>
        {fab}
      </Zoom>
    );

    if (tooltip && !isDisabled) {
      return (
        <Tooltip title={tooltip} arrow placement="left">
          {wrappedFab}
        </Tooltip>
      );
    }

    return wrappedFab;
  }
);

FloatingActionButton.displayName = 'FloatingActionButton';

export default FloatingActionButton;
