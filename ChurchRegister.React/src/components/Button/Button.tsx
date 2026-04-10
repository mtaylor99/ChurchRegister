import React, { forwardRef } from 'react';
import { Button as MUIButton, CircularProgress, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { ButtonProps as MUIButtonProps } from '@mui/material';

export interface ButtonProps extends Omit<MUIButtonProps, 'size' | 'variant'> {
  /** Button variant */
  variant?: 'contained' | 'outlined' | 'text' | 'gradient';
  /** Button size */
  size?: 'small' | 'medium' | 'large' | 'extra-large';
  /** Loading state */
  loading?: boolean;
  /** Loading text to display when loading */
  loadingText?: string;
  /** Icon to display before text */
  startIcon?: React.ReactNode;
  /** Icon to display after text */
  endIcon?: React.ReactNode;
  /** Full width button */
  fullWidth?: boolean;
  /** Custom color variant */
  colorVariant?:
    | 'primary'
    | 'secondary'
    | 'error'
    | 'warning'
    | 'info'
    | 'success';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'contained',
      size = 'medium',
      loading = false,
      loadingText,
      startIcon,
      endIcon,
      disabled,
      colorVariant = 'primary',
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
            fontSize: '0.75rem',
            padding: '4px 8px',
            minHeight: '28px',
          };
        case 'medium':
          return {
            fontSize: '0.875rem',
            padding: '6px 16px',
            minHeight: '36px',
          };
        case 'large':
          return {
            fontSize: '0.9375rem',
            padding: '8px 24px',
            minHeight: '44px',
          };
        case 'extra-large':
          return {
            fontSize: '1rem',
            padding: '12px 32px',
            minHeight: '52px',
          };
        default:
          return {};
      }
    };

    const getVariantStyles = () => {
      const colors = theme.palette;

      switch (variant) {
        case 'gradient':
          return {
            background: `linear-gradient(45deg, ${colors.primary.main} 30%, ${colors.secondary.main} 90%)`,
            color: colors.primary.contrastText,
            border: 'none',
            '&:hover': {
              background: `linear-gradient(45deg, ${colors.primary.dark} 30%, ${colors.secondary.dark} 90%)`,
              boxShadow: theme.shadows[4],
            },
            '&:disabled': {
              background: colors.action.disabledBackground,
              color: colors.action.disabled,
            },
          };
        default:
          return {};
      }
    };

    const getColorStyles = () => {
      if (variant === 'gradient') {
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
          return { color: 'primary' as const };
      }
    };

    const isDisabled = disabled || loading;

    const buttonContent = loading ? (
      <Box display="flex" alignItems="center" gap={1}>
        <CircularProgress
          size={size === 'small' ? 16 : size === 'medium' ? 18 : 20}
          color="inherit"
        />
        {loadingText || children}
      </Box>
    ) : (
      <>
        {startIcon && (
          <Box component="span" mr={1}>
            {startIcon}
          </Box>
        )}
        {children}
        {endIcon && (
          <Box component="span" ml={1}>
            {endIcon}
          </Box>
        )}
      </>
    );

    return (
      <MUIButton
        ref={ref}
        variant={variant === 'gradient' ? 'contained' : variant}
        disabled={isDisabled}
        {...getColorStyles()}
        sx={{
          ...getSizeStyles(),
          ...getVariantStyles(),
          textTransform: 'none',
          fontWeight: 500,
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
      </MUIButton>
    );
  }
);

Button.displayName = 'Button';

export default Button;
