import { forwardRef } from 'react';
import { ButtonGroup as MUIButtonGroup, Box } from '@mui/material';
import type { ButtonGroupProps as MUIButtonGroupProps } from '@mui/material';

export interface ButtonGroupProps extends MUIButtonGroupProps {
  /** Spacing between buttons when not using MUI ButtonGroup */
  spacing?: number;
  /** Whether to use stack layout instead of MUI ButtonGroup */
  stack?: boolean;
  /** Stack direction when using stack layout */
  direction?: 'row' | 'column';
  /** Full width for all buttons */
  fullWidth?: boolean;
}

const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(
  (
    {
      children,
      spacing = 1,
      stack = false,
      direction = 'row',
      fullWidth = false,
      sx,
      ...props
    },
    ref
  ) => {
    if (stack) {
      return (
        <Box
          ref={ref}
          sx={{
            display: 'flex',
            flexDirection: direction,
            gap: spacing,
            width: fullWidth ? '100%' : 'auto',
            '& > *': {
              flex: fullWidth ? 1 : 'none',
            },
            ...sx,
          }}
        >
          {children}
        </Box>
      );
    }

    return (
      <MUIButtonGroup
        ref={ref}
        sx={{
          '& .MuiButton-root': {
            borderRadius: 0,
            '&:first-of-type': {
              borderTopLeftRadius: 8,
              borderBottomLeftRadius: 8,
            },
            '&:last-of-type': {
              borderTopRightRadius: 8,
              borderBottomRightRadius: 8,
            },
          },
          ...sx,
        }}
        {...props}
      >
        {children}
      </MUIButtonGroup>
    );
  }
);

ButtonGroup.displayName = 'ButtonGroup';

export default ButtonGroup;
