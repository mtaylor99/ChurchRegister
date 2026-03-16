import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Button,
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  EventNote as AttendanceIcon,
  Event as EventIcon,
  Add as AddIcon,
  CloudUpload as CloudUploadIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { AttendanceAnalyticsPage } from './AttendanceAnalyticsPage';
import type { AttendanceAnalyticsPageHandle } from './AttendanceAnalyticsPage';
import { AttendancePage } from './AttendancePage';
import type { AttendancePageHandle } from './AttendancePage';
import { EventsPage } from '../EventsPage';
import type { EventsPageHandle } from '../EventsPage';
import { useAuth } from '../../contexts';
import { useRBAC } from '../../hooks/useRBAC';

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
  const [value, setValue] = useState(0);
  const [analyticsShareVisible, setAnalyticsShareVisible] = useState(false);
  const { user } = useAuth();
  const { canRecordAttendance, canManageEvents } = useRBAC();
  const analyticsRef = useRef<AttendanceAnalyticsPageHandle>(null);
  const attendanceRef = useRef<AttendancePageHandle>(null);
  const eventsRef = useRef<EventsPageHandle>(null);
  const shareButtonRef = useRef<HTMLButtonElement>(null);

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

  // Tab definitions (no component - rendered explicitly below)
  const tabDefs = [
    {
      label: 'Analytics',
      icon: <AnalyticsIcon />,
      permission: 'Attendance.ViewAnalytics',
    },
    {
      label: 'Attendance',
      icon: <AttendanceIcon />,
      permission: 'Attendance.View',
    },
    {
      label: 'Events',
      icon: <EventIcon />,
      permission: 'EventManagement.View',
    },
  ].filter((tab) => hasPermission(tab.permission));

  // Named indices (relative to filtered tabs)
  const analyticsIndex = tabDefs.findIndex((t) => t.label === 'Analytics');
  const attendanceIndex = tabDefs.findIndex((t) => t.label === 'Attendance');
  const eventsIndex = tabDefs.findIndex((t) => t.label === 'Events');

  if (tabDefs.length === 0) {
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
      {/* Page Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <AttendanceIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" component="h1" fontWeight={700}>
              Attendance Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage church attendance records, analytics, and events
            </Typography>
          </Box>
        </Box>

        {/* Tab-contextual header buttons */}
        <Box display="flex" gap={2} alignItems="center">
          {value === analyticsIndex && analyticsShareVisible && (
            <Button
              ref={shareButtonRef}
              variant="outlined"
              startIcon={<ShareIcon />}
              size="large"
              onClick={() => {
                if (shareButtonRef.current) {
                  analyticsRef.current?.openShare(shareButtonRef.current);
                }
              }}
              sx={{ px: 3, py: 1.5 }}
            >
              Share
            </Button>
          )}

          {value === attendanceIndex && canRecordAttendance && (
            <Button
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              size="large"
              onClick={() => attendanceRef.current?.openUploadModal()}
              sx={{ px: 3, py: 1.5 }}
            >
              Upload Template
            </Button>
          )}

          {value === attendanceIndex && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              size="large"
              onClick={() => attendanceRef.current?.openAddRecord()}
              sx={{ px: 3, py: 1.5 }}
            >
              Add Record
            </Button>
          )}

          {value === eventsIndex && canManageEvents && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              size="large"
              onClick={() => eventsRef.current?.openAddEvent()}
              sx={{ px: 3, py: 1.5 }}
            >
              Add Event
            </Button>
          )}
        </Box>
      </Box>

      <Paper sx={{ mt: 2 }}>
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
            {tabDefs.map((tab, index) => (
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

        {analyticsIndex >= 0 && (
          <TabPanel value={value} index={analyticsIndex}>
            <AttendanceAnalyticsPage
              ref={analyticsRef}
              isActive={value === analyticsIndex}
              onShareVisibilityChange={(visible) => {
                setAnalyticsShareVisible(visible);
              }}
            />
          </TabPanel>
        )}

        {attendanceIndex >= 0 && (
          <TabPanel value={value} index={attendanceIndex}>
            <AttendancePage ref={attendanceRef} />
          </TabPanel>
        )}

        {eventsIndex >= 0 && (
          <TabPanel value={value} index={eventsIndex}>
            <EventsPage ref={eventsRef} />
          </TabPanel>
        )}
      </Paper>
    </Box>
  );
};

export default AttendanceTabsPage;
