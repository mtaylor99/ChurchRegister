import { createTheme } from '@mui/material/styles';

// ChurchRegister Color Palette
const colors = {
  primary: {
    main: '#1976d2', // Professional blue
    light: '#42a5f5',
    dark: '#1565c0',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#9c27b0', // Purple accent
    light: '#ba68c8',
    dark: '#7b1fa2',
    contrastText: '#ffffff',
  },
  success: {
    main: '#2e7d32', // Success green
    light: '#4caf50',
    dark: '#1b5e20',
  },
  warning: {
    main: '#ed6c02', // Warning orange
    light: '#ff9800',
    dark: '#e65100',
  },
  error: {
    main: '#d32f2f', // Error red
    light: '#f44336',
    dark: '#c62828',
  },
  info: {
    main: '#0288d1', // Info blue
    light: '#03a9f4',
    dark: '#01579b',
  },
  // Custom colors for administration features
  administration: {
    main: '#6366f1', // Indigo for admin features
    light: '#818cf8',
    dark: '#4f46e5',
    contrastText: '#ffffff',
  },
  status: {
    active: '#10b981', // Green for active status
    inactive: '#6b7280', // Gray for inactive status
    locked: '#ef4444', // Red for locked status
    pending: '#f59e0b', // Amber for pending status
  },
  // Backward compatibility mappings for old component color references
  primaryOcean: '#1976d2', // Maps to primary.main
  oceanLight: '#42a5f5', // Maps to primary.light
  oceanDark: '#1565c0', // Maps to primary.dark
  primaryAqua: '#9c27b0', // Maps to secondary.main
  aquaLight: '#ba68c8', // Maps to secondary.light
  bgSecondary: '#f8fafc', // Maps to background.default
  textPrimary: '#1e293b', // Maps to text.primary
};

const themeOptions = {
  palette: {
    mode: 'light' as const,
    primary: colors.primary,
    secondary: colors.secondary,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    info: colors.info,
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
    },
    divider: '#e2e8f0',
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.25rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '1.875rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.4,
    },
  },
  shape: {
    borderRadius: 8,
  },
  spacing: 8,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none' as const,
          fontWeight: 600,
          borderRadius: 8,
          paddingTop: 10,
          paddingBottom: 10,
          paddingLeft: 24,
          paddingRight: 24,
        },
        containedPrimary: {
          boxShadow: '0 2px 4px rgba(25, 118, 210, 0.2)',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(25, 118, 210, 0.3)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined' as const,
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          fontWeight: 500,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRadius: '16px 0 0 16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        },
      },
    },
  },
};

export const theme = createTheme(themeOptions);

// Export colors for backward compatibility
export const churchColors = colors;

// Export light/dark themes for backward compatibility
export const lightTheme = theme;
export const darkTheme = theme; // For now, we'll use the same theme

// Custom theme extensions for TypeScript
declare module '@mui/material/styles' {
  interface Palette {
    administration: Palette['primary'];
    status: {
      active: string;
      inactive: string;
      locked: string;
      pending: string;
    };
  }

  interface PaletteOptions {
    administration?: PaletteOptions['primary'];
    status?: {
      active?: string;
      inactive?: string;
      locked?: string;
      pending?: string;
    };
  }
}

// Add custom colors to theme
export const extendedTheme = createTheme({
  ...themeOptions,
  palette: {
    ...themeOptions.palette,
    administration: colors.administration,
    status: colors.status,
  },
});

export default extendedTheme;
