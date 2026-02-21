import { forwardRef } from 'react';
import {
  LinearProgress,
  CircularProgress,
  Box,
  Typography,
  Paper,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { SxProps, Theme } from '@mui/material/styles';

export interface ProgressBarProps {
  /** Current progress value (0-100) */
  value?: number;
  /** Progress variant */
  variant?: 'determinate' | 'indeterminate';
  /** Progress type */
  type?: 'linear' | 'circular';
  /** Progress color */
  color?:
    | 'primary'
    | 'secondary'
    | 'error'
    | 'warning'
    | 'info'
    | 'success'
    | 'inherit';
  /** Size for circular progress */
  size?: number;
  /** Height for linear progress */
  height?: number;
  /** Show percentage label */
  showLabel?: boolean;
  /** Custom label text */
  label?: string;
  /** Show progress inside container */
  contained?: boolean;
  /** Animated progress */
  animated?: boolean;
  /** Custom styling */
  sx?: SxProps<Theme>;
}

const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      value = 0,
      variant = 'determinate',
      type = 'linear',
      color = 'primary',
      size = 40,
      height = 8,
      showLabel = false,
      label,
      contained = false,
      animated = true,
      sx,
    },
    ref
  ) => {
    const theme = useTheme();

    const normalizedValue = Math.min(Math.max(value, 0), 100);
    const displayLabel =
      label || (showLabel ? `${Math.round(normalizedValue)}%` : '');

    const renderLinearProgress = () => (
      <Box width="100%" display="flex" alignItems="center" gap={2}>
        <Box width="100%" position="relative">
          <LinearProgress
            variant={variant}
            value={variant === 'determinate' ? normalizedValue : undefined}
            color={color}
            sx={{
              height,
              borderRadius: height / 2,
              backgroundColor: theme.palette.action.hover,
              '& .MuiLinearProgress-bar': {
                borderRadius: height / 2,
                ...(animated && {
                  transition: 'transform 0.3s ease-in-out',
                }),
              },
              ...sx,
            }}
          />
          {displayLabel && showLabel && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontWeight: 600,
                fontSize: '0.75rem',
              }}
            >
              {displayLabel}
            </Typography>
          )}
        </Box>
        {displayLabel && !showLabel && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ minWidth: 40, textAlign: 'right' }}
          >
            {displayLabel}
          </Typography>
        )}
      </Box>
    );

    const renderCircularProgress = () => (
      <Box
        position="relative"
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
      >
        <CircularProgress
          variant={variant}
          value={variant === 'determinate' ? normalizedValue : undefined}
          size={size}
          thickness={4}
          color={color}
          sx={{
            ...(animated &&
              variant === 'determinate' && {
                transition: 'transform 0.3s ease-in-out',
              }),
          }}
        />
        {displayLabel && (
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              variant="caption"
              component="div"
              color="text.secondary"
              sx={{
                fontSize: size > 60 ? '0.875rem' : '0.75rem',
                fontWeight: 600,
              }}
            >
              {displayLabel}
            </Typography>
          </Box>
        )}
      </Box>
    );

    const progressComponent =
      type === 'circular' ? renderCircularProgress() : renderLinearProgress();

    if (contained) {
      return (
        <Paper
          ref={ref}
          elevation={1}
          sx={{
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
            ...sx,
          }}
        >
          {label && type === 'circular' && (
            <Typography variant="body2" color="text.primary" sx={{ mb: 1 }}>
              {label}
            </Typography>
          )}
          {progressComponent}
          {label && type === 'linear' && (
            <Typography variant="body2" color="text.primary" textAlign="center">
              {label}
            </Typography>
          )}
        </Paper>
      );
    }

    return (
      <Box ref={ref} sx={sx}>
        {progressComponent}
      </Box>
    );
  }
);

ProgressBar.displayName = 'ProgressBar';

export default ProgressBar;
