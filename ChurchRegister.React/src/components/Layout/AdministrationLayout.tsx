import React, { useState } from 'react';
import { Outlet, useLocation, NavLink } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Tabs,
  Tab,
  Breadcrumbs,
  Typography,
  Link,
  useTheme,
  useMediaQuery,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  People as PeopleIcon,
  Security as SecurityIcon,
  History as HistoryIcon,
  Menu as MenuIcon,
  Home as HomeIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';

export interface AdministrationLayoutProps {
  children?: React.ReactNode;
}

interface AdminTab {
  label: string;
  path: string;
  icon: React.ReactElement;
  description: string;
}

interface BreadcrumbItem {
  label: string;
  path: string;
  icon: React.ReactElement | null;
}

const adminTabs: AdminTab[] = [
  {
    label: 'User Management',
    path: '/administration/users',
    icon: <PeopleIcon />,
    description: 'Manage church members and user accounts',
  },
  {
    label: 'Roles & Permissions',
    path: '/administration/roles',
    icon: <SecurityIcon />,
    description: 'Configure roles and access permissions',
  },
  {
    label: 'System Settings',
    path: '/administration/settings',
    icon: <SettingsIcon />,
    description: 'Application configuration and preferences',
  },
  {
    label: 'Audit Log',
    path: '/administration/audit',
    icon: <HistoryIcon />,
    description: 'View system activity and changes',
  },
];

export const AdministrationLayout: React.FC<AdministrationLayoutProps> = ({
  children,
}) => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Find current tab based on pathname
  const currentTabIndex = adminTabs.findIndex((tab) =>
    location.pathname.startsWith(tab.path)
  );
  const currentTab = currentTabIndex >= 0 ? adminTabs[currentTabIndex] : null;

  // Navigation handled by NavLink components

  const handleDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      {
        label: 'Dashboard',
        path: '/app/dashboard',
        icon: <HomeIcon fontSize="small" />,
      },
      {
        label: 'Administration',
        path: '/app/administration/users',
        icon: <AdminIcon fontSize="small" />,
      },
    ];

    if (currentTab) {
      breadcrumbs.push({
        label: currentTab.label,
        path: currentTab.path,
        icon: currentTab.icon,
      });
    }

    // Add any additional path segments
    if (pathSegments.length > 2) {
      const additionalSegments = pathSegments.slice(2);
      additionalSegments.forEach((segment, index) => {
        const path = '/' + pathSegments.slice(0, 3 + index).join('/');
        breadcrumbs.push({
          label: segment.charAt(0).toUpperCase() + segment.slice(1),
          path,
          icon: null,
        });
      });
    }

    return breadcrumbs;
  };

  const renderNavigationTabs = () => (
    <Tabs
      value={currentTabIndex >= 0 ? currentTabIndex : false}
      variant={isMobile ? 'scrollable' : 'standard'}
      scrollButtons={isMobile ? 'auto' : false}
      sx={{
        borderBottom: 1,
        borderColor: 'divider',
        '& .MuiTab-root': {
          minHeight: 72,
          textTransform: 'none',
          fontWeight: 500,
        },
      }}
    >
      {adminTabs.map((tab) => (
        <Tab
          key={tab.path}
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {tab.icon}
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="body2" fontWeight={600}>
                  {tab.label}
                </Typography>
                {!isMobile && (
                  <Typography variant="caption" color="text.secondary">
                    {tab.description}
                  </Typography>
                )}
              </Box>
            </Box>
          }
          component={NavLink}
          to={tab.path}
          sx={{
            '&.Mui-selected': {
              backgroundColor: 'action.selected',
            },
          }}
        />
      ))}
    </Tabs>
  );

  const renderMobileDrawer = () => (
    <Drawer
      variant="temporary"
      open={mobileDrawerOpen}
      onClose={handleDrawerToggle}
      ModalProps={{
        keepMounted: true, // Better open performance on mobile
      }}
      sx={{
        display: { xs: 'block', md: 'none' },
        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 280 },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          Administration
        </Typography>
      </Box>
      <Divider />
      <List>
        {adminTabs.map((tab) => (
          <ListItemButton
            key={tab.path}
            component={NavLink}
            to={tab.path}
            selected={location.pathname.startsWith(tab.path)}
            onClick={handleDrawerToggle}
          >
            <ListItemIcon>{tab.icon}</ListItemIcon>
            <ListItemText primary={tab.label} secondary={tab.description} />
          </ListItemButton>
        ))}
      </List>
    </Drawer>
  );

  const breadcrumbs = getBreadcrumbs();

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'grey.50' }}>
      {/* Mobile AppBar */}
      {isMobile && (
        <AppBar
          position="sticky"
          elevation={0}
          sx={{ backgroundColor: 'white', color: 'text.primary' }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{ flexGrow: 1 }}
            >
              {currentTab?.label || 'Administration'}
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      {/* Mobile Navigation Drawer */}
      {renderMobileDrawer()}

      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs
          aria-label="navigation breadcrumb"
          sx={{ mb: 3 }}
          separator="›"
        >
          {breadcrumbs.map((breadcrumb, index) => (
            <Link
              key={breadcrumb.path}
              component={NavLink}
              to={breadcrumb.path}
              color={
                index === breadcrumbs.length - 1 ? 'text.primary' : 'primary'
              }
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              {breadcrumb.icon}
              {breadcrumb.label}
            </Link>
          ))}
        </Breadcrumbs>

        {/* Navigation Tabs - Desktop only */}
        {!isMobile && (
          <Paper elevation={0} sx={{ mb: 3 }}>
            {renderNavigationTabs()}
          </Paper>
        )}

        {/* Page Content */}
        <Box>{children || <Outlet />}</Box>
      </Container>
    </Box>
  );
};

export default AdministrationLayout;
