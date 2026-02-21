import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab, Paper } from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  CheckCircle as AttendanceIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import { AttendanceAnalyticsPage } from './AttendanceAnalyticsPage';
import { AttendancePage } from './AttendancePage';
import { EventsPage } from '../EventsPage';
import { useAuth } from '../../contexts';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`attendance-tabpanel-${index}`}
      aria-labelledby={`attendance-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `attendance-tab-${index}`,
    'aria-controls': `attendance-tabpanel-${index}`,
  };
}

export const AttendanceTabsPage: React.FC = () => {
  const [value, setValue] = useState(0); // Start with Analytics tab
  const { user } = useAuth();

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const hasPermission = (permission: string) => {
    return (
      user?.permissions?.includes(permission) ||
      user?.roles?.includes('SystemAdministration') ||
      false
    );
  };

  // Filter tabs based on permissions
  const tabs = [
    {
      label: 'Analytics',
      icon: <AnalyticsIcon />,
      component: <AttendanceAnalyticsPage isActive={value === 0} />,
      permission: 'Attendance.ViewAnalytics',
    },
    {
      label: 'Attendance',
      icon: <AttendanceIcon />,
      component: <AttendancePage />,
      permission: 'Attendance.View',
    },
    {
      label: 'Events',
      icon: <EventIcon />,
      component: <EventsPage />,
      permission: 'EventManagement.View',
    },
  ].filter((tab) => hasPermission(tab.permission));

  if (tabs.length === 0) {
    return (
      <Box sx={{ py: 3, px: 2 }}>
        <Typography variant="h6" color="text.secondary">
          You don't have permission to access any attendance features.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        py: 2,
        px: { xs: 2, sm: 3, md: 4 },
        width: '100%',
        height: '100%',
      }}
    >
      <Box mb={2}>
        <Typography variant="h4" gutterBottom>
          Attendance Management
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Manage church attendance records, analytics, and events
        </Typography>
      </Box>

      <Paper sx={{ mt: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={value}
            onChange={handleChange}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                minHeight: 64,
                textTransform: 'none',
                fontSize: '1rem',
              },
            }}
          >
            {tabs.map((tab, index) => (
              <Tab
                key={tab.label}
                label={tab.label}
                icon={tab.icon}
                iconPosition="start"
                {...a11yProps(index)}
              />
            ))}
          </Tabs>
        </Box>

        {tabs.map((tab, index) => (
          <TabPanel key={tab.label} value={value} index={index}>
            {tab.component}
          </TabPanel>
        ))}
      </Paper>
    </Box>
  );
};

export default AttendanceTabsPage;
