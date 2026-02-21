import React from 'react';
import { Box } from '@mui/material';
import type { BoxProps } from '@mui/material';

export interface ScreenReaderOnlyProps extends Omit<BoxProps, 'component'> {
  /** Content to be hidden visually but available to screen readers */
  children: React.ReactNode;
  /** Whether to show content when focused (for skip links, etc.) */
  showOnFocus?: boolean;
  /** HTML element to render as */
  component?: React.ElementType;
  /** Whether to use clip method instead of position method */
  useClip?: boolean;
}

export const ScreenReaderOnly: React.FC<ScreenReaderOnlyProps> = ({
  children,
  showOnFocus = false,
  component = 'span',
  useClip = false,
  sx,
  ...props
}) => {
  // CSS to visually hide content while keeping it accessible to screen readers
  const visuallyHiddenStyles = useClip
    ? {
        // Clip method - more compatible with older browsers
        position: 'absolute' as const,
        clip: 'rect(1px, 1px, 1px, 1px)',
        clipPath: 'inset(50%)',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
        whiteSpace: 'nowrap' as const,
      }
    : {
        // Position method - more modern approach
        position: 'absolute' as const,
        left: '-10000px',
        top: 'auto',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
      };

  const showOnFocusStyles = showOnFocus
    ? {
        '&:focus': {
          position: 'static' as const,
          clip: 'auto',
          clipPath: 'none',
          width: 'auto',
          height: 'auto',
          overflow: 'visible',
          whiteSpace: 'normal' as const,
          left: 'auto',
          top: 'auto',
        },
      }
    : {};

  return (
    <Box
      component={component}
      sx={{
        ...visuallyHiddenStyles,
        ...showOnFocusStyles,
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

// Utility component for screen reader announcements
export interface LiveRegionProps {
  /** Content to announce */
  children: React.ReactNode;
  /** How urgent the announcement is */
  priority?: 'polite' | 'assertive' | 'off';
  /** Whether the region should be atomic (read all at once) */
  atomic?: boolean;
  /** Additional ARIA properties */
  'aria-label'?: string;
  /** Custom styling */
  sx?: object;
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  children,
  priority = 'polite',
  atomic = false,
  'aria-label': ariaLabel,
  sx,
}) => {
  return (
    <ScreenReaderOnly
      component="div"
      role="status"
      aria-live={priority}
      aria-atomic={atomic}
      aria-label={ariaLabel}
      sx={sx}
    >
      {children}
    </ScreenReaderOnly>
  );
};

// Component for providing additional context to screen readers
export interface DescriptiveTextProps {
  /** The ID to reference this description */
  id: string;
  /** Description text */
  children: React.ReactNode;
  /** Whether to show the text visually */
  visuallyHidden?: boolean;
}

export const DescriptiveText: React.FC<DescriptiveTextProps> = ({
  id,
  children,
  visuallyHidden = true,
}) => {
  const Component = visuallyHidden ? ScreenReaderOnly : Box;

  return (
    <Component id={id} component="div">
      {children}
    </Component>
  );
};

export default ScreenReaderOnly;
