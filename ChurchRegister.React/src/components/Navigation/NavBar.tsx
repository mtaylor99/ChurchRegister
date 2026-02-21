import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Chip,
  useTheme,
  useMediaQuery,
  styled,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  AccountCircle as AccountIcon,
  Login as LoginIcon,
  PersonAdd as RegisterIcon,
  Lock as LockIcon,
  Logout as LogoutIcon,
  Church as ChurchIcon,
} from '@mui/icons-material';
import { NavigationLink } from './NavigationLink';
import { MobileMenu } from './MobileMenu';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface NavBarProps {
  user?: User | null;
  onLogin?: () => void;
  onLogout?: () => void;
  onRegister?: () => void;
}

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  boxShadow: theme.shadows[2],
}));

const LogoContainer = styled(Box)<{
  component?: React.ElementType;
  to?: string;
}>(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginRight: theme.spacing(2),
  textDecoration: 'none',
  color: 'inherit',
  '&:hover': {
    opacity: 0.8,
  },
}));

const LogoIcon = styled(Box)(({ theme }) => ({
  width: 40,
  height: 40,
  borderRadius: '50%',
  backgroundColor: theme.palette.secondary.main,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.secondary.contrastText,
}));

const NavLinksContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  marginLeft: theme.spacing(2),
  [theme.breakpoints.down('md')]: {
    display: 'none',
  },
}));

const UserSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const AuthSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  [theme.breakpoints.down('sm')]: {
    display: 'none',
  },
}));

export const NavBar: React.FC<NavBarProps> = ({
  user,
  onLogin,
  onLogout,
  onRegister,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = () => {
    handleUserMenuClose();
    onLogout?.();
  };

  const navigationItems = user
    ? [{ to: '/', label: 'Home', icon: HomeIcon, exact: true }]
    : [{ to: '/public', label: 'Welcome', icon: HomeIcon, exact: true }];

  return (
    <>
      <StyledAppBar position="static" elevation={2}>
        <Toolbar>
          {/* Logo */}
          <LogoContainer component={Link} to="/">
            <LogoIcon>
              <ChurchIcon />
            </LogoIcon>
            <Typography variant="h6" component="div" fontWeight="bold">
              Church Register
            </Typography>
          </LogoContainer>

          {/* Desktop Navigation */}
          {!isMobile && (
            <NavLinksContainer>
              {navigationItems.map((item) => (
                <NavigationLink
                  key={item.to}
                  to={item.to}
                  variant="pill"
                  exact={item.exact}
                >
                  {item.label}
                </NavigationLink>
              ))}
            </NavLinksContainer>
          )}

          {/* Spacer */}
          <Box sx={{ flexGrow: 1 }} />

          {/* User Section */}
          {user ? (
            <UserSection>
              {/* User Status Chip */}
              <Chip
                label="Authenticated"
                color="secondary"
                size="small"
                sx={{ display: { xs: 'none', sm: 'flex' } }}
              />

              {/* User Menu */}
              <IconButton
                onClick={handleUserMenuOpen}
                color="inherit"
                sx={{ p: 0 }}
              >
                <Avatar
                  src={user.avatar}
                  alt={user.name}
                  sx={{ width: 32, height: 32 }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleUserMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem onClick={handleUserMenuClose}>
                  <AccountIcon sx={{ mr: 1 }} />
                  Profile
                </MenuItem>
                <MenuItem onClick={handleUserMenuClose}>
                  <LockIcon sx={{ mr: 1 }} />
                  Change Password
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <LogoutIcon sx={{ mr: 1 }} />
                  Logout
                </MenuItem>
              </Menu>
            </UserSection>
          ) : (
            <AuthSection>
              <NavigationLink to="/account/login" variant="pill">
                <LoginIcon fontSize="small" />
                Login
              </NavigationLink>
              <NavigationLink to="/account/register" variant="pill">
                <RegisterIcon fontSize="small" />
                Register
              </NavigationLink>
            </AuthSection>
          )}

          {/* Mobile Menu Toggle */}
          {isMobile && (
            <IconButton
              color="inherit"
              onClick={handleMobileMenuToggle}
              sx={{ ml: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </StyledAppBar>

      {/* Mobile Menu */}
      <MobileMenu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        user={user}
        navigationItems={navigationItems}
        onLogin={onLogin}
        onLogout={onLogout}
        onRegister={onRegister}
      />
    </>
  );
};
