import { forwardRef } from 'react';
import {
  IconButton as MUIIconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { IconButtonProps as MUIIconButtonProps } from '@mui/material';

export interface IconButtonProps extends Omit<MUIIconButtonProps, 'size'> {
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
    | 'success'
    | 'default';
  /** Button variant for styling */
  variant?: 'standard' | 'outlined' | 'contained';
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      children,
      size = 'medium',
      loading = false,
      tooltip,
      disabled,
      colorVariant = 'default',
      variant = 'standard',
      sx,
      ...props
    },
    ref
  ) => {
    const theme = useTheme();

    const getSizeStyles = () => {
      switch (size) {
        case 'small':
          return {
            width: 32,
            height: 32,
            '& > *': {
              fontSize: '1rem',
            },
          };
        case 'medium':
          return {
            width: 40,
            height: 40,
            '& > *': {
              fontSize: '1.25rem',
            },
          };
        case 'large':
          return {
            width: 48,
            height: 48,
            '& > *': {
              fontSize: '1.5rem',
            },
          };
        default:
          return {};
      }
    };

    const getVariantStyles = () => {
      const colors = theme.palette;

      switch (variant) {
        case 'contained':
          return {
            backgroundColor:
              colors[colorVariant === 'default' ? 'primary' : colorVariant]
                .main,
            color:
              colors[colorVariant === 'default' ? 'primary' : colorVariant]
                .contrastText,
            '&:hover': {
              backgroundColor:
                colors[colorVariant === 'default' ? 'primary' : colorVariant]
                  .dark,
            },
          };
        case 'outlined':
          return {
            border: `1px solid ${colors[colorVariant === 'default' ? 'primary' : colorVariant].main}`,
            color:
              colors[colorVariant === 'default' ? 'primary' : colorVariant]
                .main,
            '&:hover': {
              backgroundColor: `${colors[colorVariant === 'default' ? 'primary' : colorVariant].main}08`,
            },
          };
        case 'standard':
        default:
          return {
            color:
              colorVariant === 'default'
                ? colors.text.primary
                : colors[colorVariant].main,
          };
      }
    };

    const getColorProps = () => {
      if (variant !== 'standard' || colorVariant === 'default') {
        return {};
      }

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
          return {};
      }
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

    const iconButton = (
      <MUIIconButton
        ref={ref}
        disabled={isDisabled}
        {...getColorProps()}
        sx={{
          ...getSizeStyles(),
          ...getVariantStyles(),
          borderRadius: 2,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: theme.shadows[2],
          },
          '&:active': {
            transform: 'translateY(0)',
          },
          ...sx,
        }}
        {...props}
      >
        {buttonContent}
      </MUIIconButton>
    );

    if (tooltip && !isDisabled) {
      return (
        <Tooltip title={tooltip} arrow>
          {iconButton}
        </Tooltip>
      );
    }

    return iconButton;
  }
);

IconButton.displayName = 'IconButton';

export default IconButton;
