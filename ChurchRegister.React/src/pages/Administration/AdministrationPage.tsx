import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  People as PeopleIcon,
  Map as MapIcon,
} from '@mui/icons-material';
import { UserManagementTab } from '../../components/Administration/UserManagementTab';
import { DistrictsGrid } from '../../components/Administration';

interface TabPanelProps {
  children?: React.ReactNode;
  value: number;
  index: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

function a11yProps(index: number) {
  return {
    id: `admin-tab-${index}`,
    'aria-controls': `admin-tabpanel-${index}`,
  };
}

/**
 * Administration Page - main administration interface with tabbed layout
 * Includes User Management and Districts management
 */
export const AdministrationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Parse tab from URL query parameter
  const getTabFromUrl = (): number => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    
    switch (tab) {
      case 'users':
        return 0;
      case 'districts':
        return 1;
      default:
        return 0;
    }
  };

  const [tabValue, setTabValue] = useState<number>(getTabFromUrl());

  // Update tab value when URL changes
  useEffect(() => {
    setTabValue(getTabFromUrl());
  }, [location.search]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    
    // Update URL query parameter
    const tabParam = newValue === 0 ? 'users' : 'districts';
    const newUrl = `${location.pathname}?tab=${tabParam}`;
    navigate(newUrl, { replace: true });
  };

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
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <AdminIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" component="h1" fontWeight={700}>
            Administration
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage system users, roles, and district assignments
          </Typography>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="administration tabs"
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                minHeight: 64,
                textTransform: 'none',
                fontSize: '1rem',
              },
            }}
          >
            <Tab
              icon={<PeopleIcon />}
              iconPosition="start"
              label="User Management"
              {...a11yProps(0)}
            />
            <Tab
              icon={<MapIcon />}
              iconPosition="start"
              label="Districts"
              {...a11yProps(1)}
            />
          </Tabs>
        </Box>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        <UserManagementTab />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <DistrictsGrid />
      </TabPanel>
    </Box>
  );
};

export default AdministrationPage;
