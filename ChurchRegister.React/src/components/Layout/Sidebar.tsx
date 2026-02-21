import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  CloudQueue as WeatherIcon,
  AdminPanelSettings as AdminIcon,
  CheckCircle as AttendanceIcon,
  Groups as MembersIcon,
  AccountBalance as AccountBalanceIcon,
  School as TrainingIcon,
  Notifications as RemindersIcon,
  Shield as ShieldIcon,
} from '@mui/icons-material';
import { churchColors } from '../../theme';

export interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: string | number;
  disabled?: boolean;
  roles?: string[]; // Required roles for visibility
}

const defaultNavigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/app/dashboard',
  },
  {
    id: 'attendance',
    label: 'Attendance',
    icon: <AttendanceIcon />,
    path: '/app/attendance',
  },
  {
    id: 'members',
    label: 'Members',
    icon: <MembersIcon />,
    path: '/app/members',
  },
  {
    id: 'training',
    label: 'Training',
    icon: <TrainingIcon />,
    path: '/app/training',
    roles: [
      'TrainingViewer',
      'TrainingContributor',
      'TrainingAdministrator',
      'SystemAdministration',
    ],
  },
  {
    id: 'risk-assessments',
    label: 'Risk Assessments',
    icon: <ShieldIcon />,
    path: '/app/risk-assessments',
    roles: [
      'RiskAssessmentsViewer',
      'RiskAssessmentsContributor',
      'RiskAssessmentsAdmin',
      'SystemAdministration',
    ],
  },
  {
    id: 'reminders',
    label: 'Reminders',
    icon: <RemindersIcon />,
    path: '/app/reminders',
  },
  {
    id: 'contributions',
    label: 'Contributions',
    icon: <AccountBalanceIcon />,
    path: '/app/contributions',
    roles: [
      'FinancialViewer',
      'FinancialContributor',
      'FinancialAdministrator',
      'SystemAdministration',
    ],
  },
  {
    id: 'weather',
    label: 'Weather',
    icon: <WeatherIcon />,
    path: '/weather',
    disabled: true, // Coming soon
  },
  {
    id: 'people',
    label: 'People',
    icon: <PeopleIcon />,
    path: '/people',
    disabled: true, // Coming soon
  },
  {
    id: 'administration',
    label: 'Administration',
    icon: <AdminIcon />,
    path: '/app/administration/users',
  },
];

// Account items - Currently disabled until profile/settings pages are implemented
const accountItems: NavigationItem[] = [
  // {
  //   id: 'profile',
  //   label: 'My Profile',
  //   icon: <ProfileIcon />,
  //   path: '/app/profile',
  // },
  // {
  //   id: 'settings',
  //   label: 'Settings',
  //   icon: <SettingsIcon />,
  //   path: '/app/settings',
  // },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
  currentPath?: string;
  navigationItems?: NavigationItem[];
  variant?: 'permanent' | 'temporary';
}

export const Sidebar: React.FC<SidebarProps> = ({
  open,
  onClose,
  onNavigate,
  currentPath = '',
  navigationItems = defaultNavigationItems,
  variant = 'temporary',
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const drawerWidth = 280;

  const handleNavigation = (path: string) => {
    onNavigate(path);
    if (isMobile) {
      onClose();
    }
  };

  const renderNavigationList = (items: NavigationItem[], title?: string) => (
    <>
      {title && (
        <>
          <Box sx={{ px: 2, py: 1 }}>
            <Typography
              variant="overline"
              sx={{
                color: 'text.secondary',
                fontWeight: 600,
                fontSize: '0.75rem',
                letterSpacing: '0.1em',
              }}
            >
              {title}
            </Typography>
          </Box>
        </>
      )}

      <List dense>
        {items.map((item) => {
          const isActive = currentPath === item.path;

          return (
            <ListItem key={item.id} disablePadding>
              <ListItemButton
                onClick={() => !item.disabled && handleNavigation(item.path)}
                disabled={item.disabled}
                sx={{
                  mx: 1,
                  borderRadius: 2,
                  mb: 0.5,
                  backgroundColor: isActive
                    ? `${churchColors.primaryOcean}15`
                    : 'transparent',
                  color: isActive ? churchColors.primaryOcean : 'text.primary',
                  '&:hover': {
                    backgroundColor: isActive
                      ? `${churchColors.primaryOcean}25`
                      : `${churchColors.primaryOcean}08`,
                  },
                  '&.Mui-disabled': {
                    opacity: 0.6,
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: 'inherit',
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  sx={{
                    '& .MuiListItemText-primary': {
                      fontWeight: isActive ? 600 : 400,
                      fontSize: '0.875rem',
                    },
                  }}
                />
                {item.badge && (
                  <Box
                    sx={{
                      backgroundColor: churchColors.primaryAqua,
                      color: churchColors.textPrimary,
                      borderRadius: '12px',
                      px: 1,
                      py: 0.25,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      minWidth: '20px',
                      textAlign: 'center',
                    }}
                  >
                    {item.badge}
                  </Box>
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </>
  );

  const drawerContent = (
    <Box
      sx={{
        width: drawerWidth,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2 }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${churchColors.primaryOcean} 0%, ${churchColors.oceanLight} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.2rem',
            }}
          >
            ⛪
          </Box>

          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: 'text.primary',
            }}
          >
            Navigation
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Main Navigation */}
      <Box sx={{ flexGrow: 1, py: 1 }}>
        {renderNavigationList(navigationItems, 'Main')}

        <Divider sx={{ my: 2, mx: 2 }} />

        {renderNavigationList(accountItems, 'Account')}
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: 'block',
            textAlign: 'center',
            fontStyle: 'italic',
          }}
        >
          Church Register v1.0
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      ModalProps={{
        keepMounted: true, // Better mobile performance
      }}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          borderRight: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};
