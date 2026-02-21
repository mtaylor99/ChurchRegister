import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  AccountCircle as AccountIcon,
  ExitToApp as LogoutIcon,
  Lock as LockIcon,
  Church as ChurchIcon,
  AdminPanelSettings as AdminIcon,
  Menu as MenuIcon,
  EventNote as AttendanceIcon,
  Groups as MembersIcon,
  Numbers as RegisterNumbersIcon,
  AccountBalance as AccountBalanceIcon,
  School as TrainingIcon,
  Checklist as RemindersIcon,
  Shield as ShieldIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAuth, useAuthPermissions } from '../../contexts/useAuth';
import { useRBAC } from '../../hooks/useRBAC';
import { UserProfileDrawer } from '../profile/UserProfileDrawer';
import { ChangePasswordDrawer } from '../profile/ChangePasswordDrawer';

const DRAWER_WIDTH = 240;

const Main = styled('main')<{
  open?: boolean;
}>(({ theme }) => ({
  flexGrow: 1,
  width: '100%',
  padding: 0,
  marginLeft: 0, // No left margin - content starts right after drawer
  overflow: 'hidden', // Prevent horizontal scroll
  [theme.breakpoints.down('md')]: {
    marginLeft: 0, // No margin on mobile
  },
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'center',
}));

interface NavigationItem {
  text: string;
  icon: React.ReactNode;
  path: string;
  requiredRole?: string;
  requiredPermission?: string;
  children?: NavigationItem[];
}

const allNavigationItems: NavigationItem[] = [
  {
    text: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/app/dashboard',
  },
  {
    text: 'Reminders',
    icon: <RemindersIcon />,
    path: '/app/reminders',
    requiredPermission: 'Reminders.View',
  },
  {
    text: 'Attendance',
    icon: <AttendanceIcon />,
    path: '/app/attendance',
    requiredPermission: 'Attendance.View',
  },
  {
    text: 'Members',
    icon: <MembersIcon />,
    path: '/app/members',
    requiredPermission: 'ChurchMembers.View',
  },
  {
    text: 'Training',
    icon: <TrainingIcon />,
    path: '/app/training',
    requiredPermission: 'TrainingCertificates.View',
  },
  {
    text: 'Risk Assessments',
    icon: <ShieldIcon />,
    path: '/app/risk-assessments',
    requiredPermission: 'RiskAssessments.View',
  },
  {
    text: 'Contributions',
    icon: <AccountBalanceIcon />,
    path: '/app/contributions',
    requiredPermission: 'Financial.View',
  },
  {
    text: 'Administration',
    icon: <AdminIcon />,
    path: '/app/administration/users',
    requiredRole: 'SystemAdministration',
    children: [
      {
        text: 'User Management',
        icon: <AdminIcon />,
        path: '/app/administration/users',
        requiredRole: 'SystemAdministration',
      },
      {
        text: 'Generate Register Numbers',
        icon: <RegisterNumbersIcon />,
        path: '/app/administration/register-numbers',
        requiredRole: 'FinancialAdministrator',
      },
    ],
  },
];

export const Layout: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
  const [changePasswordDrawerOpen, setChangePasswordDrawerOpen] = useState(false);

  const { user, logout } = useAuth();
  const { hasRole } = useAuthPermissions();
  const { hasPermission } = useRBAC();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Drawer state - always open on desktop, toggleable on mobile
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const drawerOpen = isMobile ? mobileDrawerOpen : true;

  // Generate user initials from first and last name, fallback to email
  const getUserInitials = (): string => {
    // Handle case where firstName contains email (backend bug)
    if (
      user?.firstName &&
      user?.lastName &&
      !user.firstName.includes('@') &&
      !user.lastName.includes('@')
    ) {
      // Normal case: proper first and last names
      const firstInitial = user.firstName.charAt(0).toUpperCase();
      const lastInitial = user.lastName.charAt(0).toUpperCase();
      return firstInitial + lastInitial;
    }

    // Handle case where we have email in firstName or other data issues
    if (user?.email) {
      // For admin@churchregister.com, we know it should be "SA" (System Administrator)
      if (user.email === 'admin@churchregister.com') {
        return 'SA';
      }

      // For other emails, extract name parts if possible
      const emailParts = user.email.split('@')[0];
      if (emailParts.includes('.')) {
        const nameParts = emailParts.split('.');
        if (nameParts.length >= 2) {
          return (
            nameParts[0].charAt(0) + nameParts[1].charAt(0)
          ).toUpperCase();
        }
      }

      // Final fallback to first letter of email
      return user.email.charAt(0).toUpperCase();
    }

    return 'U';
  };

  // Generate user display name, handling backend data issues
  const getUserDisplayName = (): string => {
    // Handle case where firstName contains email (backend bug)
    if (
      user?.firstName &&
      user?.lastName &&
      !user.firstName.includes('@') &&
      !user.lastName.includes('@')
    ) {
      // Normal case: proper first and last names
      return `${user.firstName} ${user.lastName}`;
    }

    // Handle case where we have incorrect data
    if (user?.email) {
      // For admin@churchregister.com, we know it should be "System Administrator"
      if (user.email === 'admin@churchregister.com') {
        return 'System Administrator';
      }

      // For other emails, try to extract a reasonable display name
      const emailParts = user.email.split('@')[0];
      if (emailParts.includes('.')) {
        const nameParts = emailParts.split('.');
        return nameParts
          .map(
            (part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
          )
          .join(' ');
      }

      // Final fallback to email
      return user.email;
    }

    return 'User';
  };

  // Filter navigation items based on user roles and permissions
  const navigationItems = React.useMemo(() => {
    return allNavigationItems.filter((item) => {
      // SystemAdministration role has access to everything
      if (hasRole('SystemAdministration')) return true;

      // If role required, check if user has that role
      if (item.requiredRole && !hasRole(item.requiredRole)) return false;

      // If permission required, check if user has that permission
      if (item.requiredPermission && !hasPermission(item.requiredPermission))
        return false;

      // Show the item if no requirements or requirements are met
      return true;
    });
  }, [hasRole, hasPermission]);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleOpenProfile = () => {
    handleProfileMenuClose();
    setProfileDrawerOpen(true);
  };

  const handleChangePassword = () => {
    handleProfileMenuClose();
    setChangePasswordDrawerOpen(true);
  };

  const handleDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    // On mobile, close drawer after navigation
    if (isMobile) {
      setMobileDrawerOpen(false);
    }
  };

  const handleLogout = async () => {
    handleProfileMenuClose();
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Still navigate to login page even if logout fails
      navigate('/login');
    }
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <DrawerHeader>
        <ChurchIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ color: 'primary.main', fontWeight: 'bold' }}
        >
          Church Register
        </Typography>
      </DrawerHeader>

      <Divider />

      <List sx={{ flex: 1 }}>
        {navigationItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigate(item.path)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  '&:hover': {
                    backgroundColor: 'primary.light',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color:
                    location.pathname === item.path
                      ? 'primary.main'
                      : 'inherit',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                sx={{
                  color:
                    location.pathname === item.path
                      ? 'primary.main'
                      : 'inherit',
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />

      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary" display="block">
          Logged in as
        </Typography>
        <Typography variant="body2" fontWeight="medium">
          {getUserDisplayName()}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        width: '100vw',
        overflow: 'hidden',
      }}
    >
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {navigationItems.find((item) => item.path === location.pathname)
              ?.text || 'Church Register'}
          </Typography>

          <IconButton
            size="large"
            edge="end"
            aria-label="account menu"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
              {getUserInitials()}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        anchor="left"
        open={drawerOpen}
        onClose={isMobile ? handleDrawerToggle : undefined}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
      >
        {drawerContent}
      </Drawer>

      <Main open={true}>
        <DrawerHeader />
        <Outlet />
      </Main>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleProfileMenuClose}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>{getUserInitials()}</Avatar>
          <Box>
            <Typography variant="body2">{getUserDisplayName()}</Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.roles?.join(', ') || 'User'}
            </Typography>
          </Box>
        </MenuItem>

        <Divider />

        <MenuItem onClick={handleOpenProfile}>
          <ListItemIcon>
            <AccountIcon fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>

        <MenuItem onClick={handleChangePassword}>
          <ListItemIcon>
            <LockIcon fontSize="small" />
          </ListItemIcon>
          Change Password
        </MenuItem>

        <Divider />

        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
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
};
