import React, { useState, useRef } from 'react';
import {
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Box,
  Button,
  Fade,
} from '@mui/material';
import {
  Person as PersonIcon,
  Lock as LockIcon,
  Logout as LogoutIcon,
  Login as LoginIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/useAuth';
import { useNavigate } from 'react-router-dom';
import { UserProfileDrawer } from './UserProfileDrawer';
import { ChangePasswordDrawer } from './ChangePasswordDrawer';

/**
 * User Profile Dropdown Component
 *
 * Provides a dropdown menu for authenticated users with profile actions
 * and login/register buttons for unauthenticated users.
 * Matches the existing Blazor MyProfile component design.
 */
export const UserProfileDropdown: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
  const [changePasswordDrawerOpen, setChangePasswordDrawerOpen] =
    useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const open = Boolean(anchorEl);

  // Handle avatar click to open dropdown
  const handleAvatarClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  // Handle menu close
  const handleClose = () => {
    setAnchorEl(null);
  };

  // Handle opening profile drawer
  const handleOpenProfile = () => {
    handleClose();
    setProfileDrawerOpen(true);
  };

  // Handle opening change password drawer
  const handleOpenChangePassword = () => {
    handleClose();
    setChangePasswordDrawerOpen(true);
  };

  // Handle logout
  const handleLogout = async () => {
    handleClose();
    try {
      await logout();
      // Navigate directly to login page and replace history to prevent back navigation
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails, redirect to login for security
      navigate('/login', { replace: true });
    }
  }; // Generate user initials for avatar
  const getUserInitials = (): string => {
    if (!user) return 'U';

    const { firstName, lastName, email } = user;

    if (!firstName && !lastName) {
      if (!email) return 'U';
      const emailPart = email.split('@')[0];
      return emailPart.length >= 2
        ? emailPart.substring(0, 2).toUpperCase()
        : emailPart.toUpperCase();
    }

    const firstInitial = firstName?.charAt(0) || '';
    const lastInitial = lastName?.charAt(0) || '';

    if (!lastName) {
      if (firstName?.length === 1) return firstName.toUpperCase();
      if (firstName && firstName.length > 1)
        return `${firstName[0]}${firstName[1]}`.toUpperCase();
      return firstInitial.toUpperCase();
    }

    return `${firstInitial}${lastInitial}`.toUpperCase();
  };

  // Get user display name
  const getUserDisplayName = (): string => {
    if (!user) return 'User';

    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    if (fullName) return fullName;

    return user.email?.split('@')[0] || 'User';
  };

  // Authenticated user view
  if (isAuthenticated && user) {
    return (
      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Avatar
          ref={avatarRef}
          onClick={handleAvatarClick}
          sx={{
            width: 36,
            height: 36,
            cursor: 'pointer',
            background: (theme) =>
              `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            border: '2px solid rgba(255, 255, 255, 0.2)',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: (theme) => theme.shadows[4],
              borderColor: 'rgba(255, 255, 255, 0.3)',
            },
            '&:focus': {
              outline: '2px solid',
              outlineColor: 'primary.main',
              outlineOffset: '2px',
            },
          }}
          aria-label="User profile menu"
          aria-expanded={open ? 'true' : undefined}
          aria-haspopup="true"
        >
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              fontSize: '0.75rem',
              color: 'white',
            }}
          >
            {getUserInitials()}
          </Typography>
        </Avatar>

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          TransitionComponent={Fade}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            elevation: 8,
            sx: {
              minWidth: 220,
              mt: 1,
              borderRadius: 2,
              overflow: 'visible',
              backdropFilter: 'blur(10px)',
              backgroundColor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              '&::before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: -6,
                right: 16,
                width: 12,
                height: 12,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                borderBottom: 'none',
                borderRight: 'none',
                transform: 'rotate(45deg)',
                zIndex: 0,
              },
            },
          }}
          MenuListProps={{
            'aria-labelledby': 'user-profile-button',
            sx: { py: 1 },
          }}
        >
          {/* User info header */}
          <Box sx={{ px: 2, py: 1, pb: 0 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                color: 'text.primary',
                mb: 0.5,
              }}
            >
              {getUserDisplayName()}
            </Typography>
          </Box>

          <Divider sx={{ my: 1 }} />

          {/* Profile menu items */}
          <MenuItem
            onClick={handleOpenProfile}
            sx={{
              py: 1,
              '&:hover': {
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                '& .MuiListItemIcon-root': {
                  color: 'primary.contrastText',
                },
              },
            }}
          >
            <ListItemIcon>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="My Profile" />
          </MenuItem>

          <MenuItem
            onClick={handleOpenChangePassword}
            sx={{
              py: 1,
              '&:hover': {
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                '& .MuiListItemIcon-root': {
                  color: 'primary.contrastText',
                },
              },
            }}
          >
            <ListItemIcon>
              <LockIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Change Password" />
          </MenuItem>

          <Divider sx={{ my: 1 }} />

          {/* Logout */}
          <MenuItem
            onClick={handleLogout}
            sx={{
              py: 1,
              color: 'error.main',
              '&:hover': {
                backgroundColor: 'error.main',
                color: 'error.contrastText',
                '& .MuiListItemIcon-root': {
                  color: 'error.contrastText',
                },
              },
            }}
          >
            <ListItemIcon>
              <LogoutIcon fontSize="small" sx={{ color: 'error.main' }} />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </MenuItem>
        </Menu>

        {/* User Profile Drawer */}
        <UserProfileDrawer
          open={profileDrawerOpen}
          onClose={() => setProfileDrawerOpen(false)}
        />

        {/* Change Password Drawer */}
        <ChangePasswordDrawer
          open={changePasswordDrawerOpen}
          onClose={() => setChangePasswordDrawerOpen(false)}
        />
      </Box>
    );
  }

  // Unauthenticated user view - Login/Register buttons
  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      <Button
        variant="outlined"
        size="small"
        startIcon={<PersonAddIcon />}
        onClick={() => navigate('/register')}
        sx={{
          color: 'white',
          borderColor: 'rgba(255, 255, 255, 0.5)',
          '&:hover': {
            borderColor: 'white',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
        }}
      >
        Register
      </Button>
      <Button
        variant="contained"
        size="small"
        startIcon={<LoginIcon />}
        onClick={() => navigate('/login')}
        sx={{
          backgroundColor: 'white',
          color: 'primary.main',
          '&:hover': {
            backgroundColor: 'grey.100',
          },
        }}
      >
        Login
      </Button>
    </Box>
  );
};

export default UserProfileDropdown;
