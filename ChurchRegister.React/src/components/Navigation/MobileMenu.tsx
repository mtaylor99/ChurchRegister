import React from 'react';
import {
  Drawer,
  List,
  Divider,
  Box,
  Typography,
  Button,
  Avatar,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  styled,
} from '@mui/material';
import {
  Login as LoginIcon,
  PersonAdd as RegisterIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { NavigationLink } from './NavigationLink';
import type { SvgIconComponent } from '@mui/icons-material';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface NavigationItem {
  to: string;
  label: string;
  icon: SvgIconComponent;
  exact?: boolean;
}

export interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  user?: User | null;
  navigationItems: NavigationItem[];
  onLogin?: () => void;
  onLogout?: () => void;
  onRegister?: () => void;
}

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: 280,
    backgroundColor: theme.palette.background.paper,
  },
}));

const UserSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
}));

const AuthSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}));

export const MobileMenu: React.FC<MobileMenuProps> = ({
  open,
  onClose,
  user,
  navigationItems,
  onLogin,
  onLogout,
  onRegister,
}) => {
  const handleItemClick = () => {
    onClose();
  };

  const handleLogout = () => {
    onLogout?.();
    onClose();
  };

  const handleLogin = () => {
    onLogin?.();
    onClose();
  };

  const handleRegister = () => {
    onRegister?.();
    onClose();
  };

  return (
    <StyledDrawer
      anchor="right"
      open={open}
      onClose={onClose}
      variant="temporary"
      ModalProps={{
        keepMounted: true, // Better performance on mobile
      }}
    >
      {user ? (
        <>
          {/* User Header */}
          <UserSection>
            <Avatar
              src={user.avatar}
              alt={user.name}
              sx={{ width: 48, height: 48 }}
            >
              {user.name.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">
                {user.name}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {user.email}
              </Typography>
            </Box>
          </UserSection>

          {/* Navigation Items */}
          <List>
            {navigationItems.map((item) => (
              <NavigationLink
                key={item.to}
                to={item.to}
                icon={item.icon}
                exact={item.exact}
                onClick={handleItemClick}
              >
                {item.label}
              </NavigationLink>
            ))}
          </List>

          <Divider />

          {/* User Actions */}
          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={handleItemClick}>
                <ListItemIcon>
                  <AccountIcon />
                </ListItemIcon>
                <ListItemText primary="Profile" />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton onClick={handleItemClick}>
                <ListItemIcon>
                  <LockIcon />
                </ListItemIcon>
                <ListItemText primary="Change Password" />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText primary="Logout" />
              </ListItemButton>
            </ListItem>
          </List>
        </>
      ) : (
        <>
          {/* Public Navigation */}
          <List>
            {navigationItems.map((item) => (
              <NavigationLink
                key={item.to}
                to={item.to}
                icon={item.icon}
                exact={item.exact}
                onClick={handleItemClick}
              >
                {item.label}
              </NavigationLink>
            ))}
          </List>

          <Divider />

          {/* Authentication Actions */}
          <AuthSection>
            <Button
              variant="contained"
              startIcon={<LoginIcon />}
              onClick={handleLogin}
              fullWidth
            >
              Login
            </Button>
            <Button
              variant="outlined"
              startIcon={<RegisterIcon />}
              onClick={handleRegister}
              fullWidth
            >
              Register
            </Button>
          </AuthSection>
        </>
      )}
    </StyledDrawer>
  );
};
