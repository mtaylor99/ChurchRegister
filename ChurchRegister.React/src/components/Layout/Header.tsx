import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  useMediaQuery,
  useTheme as useMuiTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Brightness4,
  Brightness7,
} from '@mui/icons-material';
import { useTheme } from '../../hooks/useTheme';
import { churchColors } from '../../theme';
import { UserProfileDropdown } from '../profile';

interface HeaderProps {
  onMenuToggle?: () => void;
  showMenuButton?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onMenuToggle,
  showMenuButton = false,
}) => {
  const { mode, toggleTheme } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));

  return (
    <AppBar
      position="sticky"
      elevation={2}
      sx={{
        background: `linear-gradient(135deg, ${churchColors.primaryOcean} 0%, ${churchColors.oceanLight} 100%)`,
        borderBottom: `2px solid ${churchColors.primaryOcean}`,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
        {/* Left section */}
        <Box display="flex" alignItems="center" gap={2}>
          {showMenuButton && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={onMenuToggle}
              sx={{ display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo and Brand */}
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${churchColors.primaryAqua} 0%, ${churchColors.aquaLight} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                fontSize: '1.5rem',
              }}
            >
              ⛪
            </Box>

            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 600,
                color: 'white',
                display: { xs: isMobile ? 'none' : 'block', sm: 'block' },
              }}
            >
              Church Register
            </Typography>
          </Box>
        </Box>

        {/* Right section */}
        <Box display="flex" alignItems="center" gap={1}>
          {/* Theme Toggle */}
          <IconButton
            onClick={toggleTheme}
            color="inherit"
            aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
            size="small"
          >
            {mode === 'light' ? <Brightness4 /> : <Brightness7 />}
          </IconButton>

          {/* User Profile Dropdown */}
          <UserProfileDropdown />
        </Box>
      </Toolbar>
    </AppBar>
  );
};
