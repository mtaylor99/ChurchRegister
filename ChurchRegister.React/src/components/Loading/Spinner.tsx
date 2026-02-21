import { forwardRef } from 'react';
import {
  CircularProgress,
  Box,
  Typography,
  Backdrop,
  Fade,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { SxProps, Theme } from '@mui/material/styles';

export interface SpinnerProps {
  /** Loading state */
  loading?: boolean;
  /** Spinner size */
  size?: number | 'small' | 'medium' | 'large';
  /** Spinner color */
  color?:
    | 'primary'
    | 'secondary'
    | 'error'
    | 'warning'
    | 'info'
    | 'success'
    | 'inherit';
  /** Loading text */
  text?: string;
  /** Show as overlay */
  overlay?: boolean;
  /** Center the spinner */
  center?: boolean;
  /** Full screen overlay */
  fullScreen?: boolean;
  /** Custom styling */
  sx?: SxProps<Theme>;
  /** Variant of spinner display */
  variant?: 'default' | 'dots' | 'bars' | 'pulse';
}

const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  (
    {
      loading = true,
      size = 'medium',
      color = 'primary',
      text,
      overlay = false,
      center = false,
      fullScreen = false,
      sx,
      variant = 'default',
    },
    ref
  ) => {
    const theme = useTheme();

    const getSizeValue = () => {
      if (typeof size === 'number') return size;
      switch (size) {
        case 'small':
          return 24;
        case 'medium':
          return 40;
        case 'large':
          return 56;
        default:
          return 40;
      }
    };

    const renderDefaultSpinner = () => (
      <CircularProgress size={getSizeValue()} color={color} thickness={4} />
    );

    const renderDotsSpinner = () => (
      <Box display="flex" alignItems="center" gap={0.5}>
        {[0, 1, 2].map((index) => (
          <Box
            key={index}
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor:
                theme.palette[color === 'inherit' ? 'primary' : color].main,
              animation: 'spinnerDots 1.4s ease-in-out infinite both',
              animationDelay: `${index * 0.16}s`,
              '@keyframes spinnerDots': {
                '0%, 80%, 100%': {
                  transform: 'scale(0)',
                },
                '40%': {
                  transform: 'scale(1)',
                },
              },
            }}
          />
        ))}
      </Box>
    );

    const renderBarsSpinner = () => (
      <Box display="flex" alignItems="center" gap={0.5}>
        {[0, 1, 2, 3, 4].map((index) => (
          <Box
            key={index}
            sx={{
              width: 4,
              height: 20,
              backgroundColor:
                theme.palette[color === 'inherit' ? 'primary' : color].main,
              animation: 'spinnerBars 1.2s ease-in-out infinite',
              animationDelay: `${index * 0.1}s`,
              '@keyframes spinnerBars': {
                '0%, 40%, 100%': {
                  transform: 'scaleY(0.4)',
                },
                '20%': {
                  transform: 'scaleY(1.0)',
                },
              },
            }}
          />
        ))}
      </Box>
    );

    const renderPulseSpinner = () => (
      <Box
        sx={{
          width: getSizeValue(),
          height: getSizeValue(),
          borderRadius: '50%',
          backgroundColor:
            theme.palette[color === 'inherit' ? 'primary' : color].main,
          animation: 'spinnerPulse 1.5s ease-in-out infinite',
          '@keyframes spinnerPulse': {
            '0%': {
              transform: 'scale(0)',
            },
            '100%': {
              transform: 'scale(1)',
              opacity: 0,
            },
          },
        }}
      />
    );

    const renderSpinner = () => {
      switch (variant) {
        case 'dots':
          return renderDotsSpinner();
        case 'bars':
          return renderBarsSpinner();
        case 'pulse':
          return renderPulseSpinner();
        case 'default':
        default:
          return renderDefaultSpinner();
      }
    };

    const spinnerContent = (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        gap={2}
        sx={{
          ...(center && {
            minHeight: '200px',
            justifyContent: 'center',
          }),
        }}
      >
        {renderSpinner()}
        {text && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {text}
          </Typography>
        )}
      </Box>
    );

    if (!loading) {
      return null;
    }

    if (overlay || fullScreen) {
      return (
        <Backdrop
          open={loading}
          sx={{
            ...(fullScreen
              ? {
                  zIndex: theme.zIndex.modal + 1,
                }
              : {
                  position: 'absolute',
                  zIndex: 1,
                }),
            color: 'common.white',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            ...sx,
          }}
        >
          <Fade in={loading}>
            <Box ref={ref}>{spinnerContent}</Box>
          </Fade>
        </Backdrop>
      );
    }

    return (
      <Box
        ref={ref}
        sx={{
          display: 'flex',
          alignItems: center ? 'center' : 'flex-start',
          justifyContent: center ? 'center' : 'flex-start',
          width: '100%',
          ...sx,
        }}
      >
        {spinnerContent}
      </Box>
    );
  }
);

Spinner.displayName = 'Spinner';

export default Spinner;
