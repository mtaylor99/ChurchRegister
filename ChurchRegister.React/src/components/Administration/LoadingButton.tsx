import React from 'react';
import { Button, CircularProgress, Box } from '@mui/material';
import type { ButtonProps } from '@mui/material';

export interface LoadingButtonProps
  extends Omit<ButtonProps, 'startIcon' | 'endIcon'> {
  loading?: boolean;
  loadingText?: string;
  startIcon?: React.ReactElement;
  endIcon?: React.ReactElement;
  loadingPosition?: 'start' | 'end' | 'center';
  loadingIndicator?: React.ReactNode;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  loadingText,
  children,
  disabled,
  startIcon,
  endIcon,
  loadingPosition = 'start',
  loadingIndicator,
  ...buttonProps
}) => {
  const isDisabled = disabled || loading;

  const defaultLoadingIndicator = (
    <CircularProgress size={16} color="inherit" thickness={4} />
  );

  const spinner = loadingIndicator || defaultLoadingIndicator;

  const getDisplayContent = () => {
    if (!loading) {
      return children;
    }

    if (loadingText) {
      return loadingText;
    }

    return children;
  };

  const getStartIcon = () => {
    if (loading && loadingPosition === 'start') {
      return spinner;
    }
    return startIcon;
  };

  const getEndIcon = () => {
    if (loading && loadingPosition === 'end') {
      return spinner;
    }
    return endIcon;
  };

  const getButtonContent = () => {
    const content = getDisplayContent();

    if (loading && loadingPosition === 'center') {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {spinner}
          <span>{content}</span>
        </Box>
      );
    }

    return content;
  };

  return (
    <Button
      {...buttonProps}
      disabled={isDisabled}
      startIcon={getStartIcon()}
      endIcon={getEndIcon()}
      sx={{
        ...buttonProps.sx,
        // Maintain button width during loading
        minWidth: loading ? 'auto' : undefined,
        // Reduce opacity when loading but not disabled
        opacity: loading && !disabled ? 0.7 : undefined,
        // Prevent text selection during loading
        userSelect: loading ? 'none' : undefined,
      }}
    >
      {getButtonContent()}
    </Button>
  );
};
