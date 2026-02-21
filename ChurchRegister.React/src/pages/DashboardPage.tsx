import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Avatar,
  LinearProgress,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  Alert,
} from '@mui/material';
import {
  People as PeopleIcon,
  EventAvailable as AttendanceIcon,
  TrendingUp,
  TrendingDown,
  MoreVert as MoreIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { styled, useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { enGB } from 'date-fns/locale';
import { AttendanceRecordForm } from '../components/Attendance';
import { ChurchMemberDrawer } from '../components/ChurchMembers/ChurchMemberDrawer';
import { RemindersSummaryWidget } from '../components/Dashboard/RemindersSummaryWidget';
import { RiskAssessmentWidget } from '../components/Dashboard/RiskAssessmentWidget';
import { MonthlyReportPackWidget } from '../components/MonthlyReportPack';
import { useRecentAttendance } from '../hooks/useAttendance';
import { dashboardApi } from '../services/api/dashboardApi';
import type { TrainingAlertItem } from '../services/api/dashboardApi';
import { useNavigate } from 'react-router-dom';
import { useAuthPermissions } from '../contexts';

interface DashboardMetric {
  id: string;
  title: string;
  value: number | string;
  change: number;
  changeLabel: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

const MetricCard = styled(Card)(({ theme }) => ({
  height: '100%',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

const MetricValue = styled(Typography)(({ theme }) => ({
  fontSize: '2.5rem',
  fontWeight: 'bold',
  lineHeight: 1.2,
  [theme.breakpoints.down('md')]: {
    fontSize: '2rem',
  },
}));

const TrendIndicator = styled(Box)<{ trend: 'up' | 'down' | 'neutral' }>(
  ({ theme, trend }) => ({
    display: 'flex',
    alignItems: 'center',
    color:
      trend === 'up'
        ? theme.palette.success.main
        : trend === 'down'
          ? theme.palette.error.main
          : theme.palette.text.secondary,
    gap: theme.spacing(0.5),
  })
);

export const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
  const [trainingAlerts, setTrainingAlerts] = useState<TrainingAlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const { hasAnyRole } = useAuthPermissions();

  // Attendance widget state
  const [showAttendanceDialog, setShowAttendanceDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  // Member drawer state
  const [memberDrawerOpen, setMemberDrawerOpen] = useState(false);

  // Hooks for attendance functionality
  const { error: attendanceError } = useRecentAttendance();

  // Mobile detection for responsive dialog
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Load real data from API
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const statistics = await dashboardApi.getStatistics();

      const dashboardMetrics: DashboardMetric[] = [
        {
          id: 'sunday-morning',
          title: 'Sunday Morning Service',
          value: statistics.sundayMorningAverage,
          change: statistics.sundayMorningChangePercentage,
          changeLabel: `${statistics.sundayMorningChangePercentage >= 0 ? '+' : ''}${statistics.sundayMorningChangePercentage.toFixed(1)}% vs previous 4 weeks`,
          icon: <AttendanceIcon sx={{ fontSize: 40 }} />,
          color: '#4CAF50',
          description: 'Average attendance (last 4 weeks)',
        },
        {
          id: 'sunday-evening',
          title: 'Sunday Evening Service',
          value: statistics.sundayEveningAverage,
          change: statistics.sundayEveningChangePercentage,
          changeLabel: `${statistics.sundayEveningChangePercentage >= 0 ? '+' : ''}${statistics.sundayEveningChangePercentage.toFixed(1)}% vs previous 4 weeks`,
          icon: <AttendanceIcon sx={{ fontSize: 40 }} />,
          color: '#FF9800',
          description: 'Average attendance (last 4 weeks)',
        },
        {
          id: 'bible-study',
          title: 'Bible Study',
          value: statistics.bibleStudyAverage,
          change: statistics.bibleStudyChangePercentage,
          changeLabel: `${statistics.bibleStudyChangePercentage >= 0 ? '+' : ''}${statistics.bibleStudyChangePercentage.toFixed(1)}% vs previous 4 weeks`,
          icon: <AttendanceIcon sx={{ fontSize: 40 }} />,
          color: '#3F51B5',
          description: 'Average attendance (last 4 weeks)',
        },
        {
          id: 'members',
          title: 'Church Members',
          value: statistics.totalMembers,
          change: statistics.memberGrowthPercentage,
          changeLabel: `${statistics.memberGrowthPercentage >= 0 ? '+' : ''}${statistics.memberGrowthPercentage.toFixed(1)}% vs last month`,
          icon: <PeopleIcon sx={{ fontSize: 40 }} />,
          color: '#2196F3',
          description: 'Total active church members',
        },
        {
          id: 'new-members',
          title: 'New Members',
          value: statistics.newMembersThisMonth,
          change: statistics.newMembersThisWeek,
          changeLabel: `+${statistics.newMembersThisWeek} this week`,
          icon: <PeopleIcon sx={{ fontSize: 40 }} />,
          color: '#9C27B0',
          description: 'New members this month',
        },
      ];

      setMetrics(dashboardMetrics);
      setTrainingAlerts(statistics.trainingAlerts || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load dashboard statistics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAddMember = () => {
    setMemberDrawerOpen(true);
  };

  const handleMemberDrawerClose = () => {
    setMemberDrawerOpen(false);
  };

  const handleMemberSuccess = () => {
    handleMemberDrawerClose();
    // Refresh metrics after adding member
    handleRefresh();
  };

  const getTrendDirection = (change: number): 'up' | 'down' | 'neutral' => {
    if (change > 0) return 'up';
    if (change < 0) return 'down';
    return 'neutral';
  };

  const formatLastUpdated = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Calculate unique members from training alerts
  const getUniqueTrainingMemberCount = () => {
    const memberNames = new Set<string>();
    let groupedMemberCount = 0;

    trainingAlerts.forEach((alert) => {
      // Check if it's a grouped alert (starts with a number like "5 members")
      const groupedMatch = alert.message.match(/^(\d+) members/);
      if (groupedMatch) {
        groupedMemberCount += parseInt(groupedMatch[1], 10);
      } else {
        // Individual alert - extract member name (format: "Name - TrainingType ...")
        const nameMatch = alert.message.match(/^([^-]+) -/);
        if (nameMatch) {
          memberNames.add(nameMatch[1].trim());
        }
      }
    });

    return memberNames.size + groupedMemberCount;
  };

  const uniqueMemberCount = getUniqueTrainingMemberCount();

  if (isLoading && metrics.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress size={60} />
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
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="flex-start"
        mb={2}
      >
        <Box>
          <Typography variant="h4" gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Overview of church management metrics and activity
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Last updated: {formatLastUpdated(lastUpdated)}
          </Typography>

          <IconButton
            onClick={handleRefresh}
            disabled={isLoading}
            color="primary"
          >
            {isLoading ? <CircularProgress size={24} /> : <RefreshIcon />}
          </IconButton>

          <IconButton onClick={handleMenuOpen}>
            <MoreIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Main Layout - KPIs on Left, Quick Actions on Right */}
      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
        {/* Left Side - KPIs in 3x3 Grid */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Key Performance Indicators
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
              },
              gap: 3,
            }}
          >
            {/* Reminders Summary Widget */}
            <RemindersSummaryWidget />

            {/* Training & Checks Widget */}
            <Box>
              <MetricCard onClick={() => navigate('/app/training')}>
                <CardContent sx={{ p: 3 }}>
                  {/* Header */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 2,
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: trainingAlerts.length > 0 ? '#FF9800' : '#4CAF50',
                        width: 56,
                        height: 56,
                      }}
                    >
                      <WarningIcon sx={{ fontSize: 32 }} />
                    </Avatar>

                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        color: trainingAlerts.length > 0 ? '#F57C00' : '#388E3C',
                        gap: 0.5,
                      }}
                    >
                      <Typography variant="body2" fontWeight="medium">
                        {trainingAlerts.length > 0 ? 'Action Required' : 'All Clear'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Title */}
                  <Typography
                    variant="h6"
                    color="text.secondary"
                    gutterBottom
                    sx={{ fontSize: '0.875rem', fontWeight: 500 }}
                  >
                    Training & Checks
                  </Typography>

                  {/* Value */}
                  {trainingAlerts.length > 0 ? (
                    <>
                      <MetricValue color="text.primary">
                        {uniqueMemberCount}
                      </MetricValue>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1, mb: 2 }}
                      >
                        {uniqueMemberCount === 1 ? 'person' : 'people'} with expiring training
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {trainingAlerts.length} {trainingAlerts.length === 1 ? 'item' : 'items'} requiring attention
                      </Typography>
                    </>
                  ) : (
                    <>
                      <MetricValue color="success.main">✓</MetricValue>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1, mb: 2 }}
                      >
                        All items up to date
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        No items expiring in 60 days
                      </Typography>
                    </>
                  )}

                  <LinearProgress
                    variant="determinate"
                    value={trainingAlerts.length > 0 ? 100 : 0}
                    sx={{
                      mt: 2,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: (theme) =>
                        theme.palette.mode === 'light'
                          ? 'rgba(0, 0, 0, 0.08)'
                          : 'rgba(255, 255, 255, 0.08)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 3,
                        backgroundColor: trainingAlerts.length > 0 ? '#FF9800' : '#4CAF50',
                      },
                    }}
                  />
                </CardContent>
              </MetricCard>
            </Box>

            {/* Risk Assessment Widget */}
            <RiskAssessmentWidget />

            {metrics.map((metric) => (
          <Box key={metric.id}>
            <MetricCard>
              <CardContent sx={{ p: 3 }}>
                {/* Header */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 2,
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: metric.color,
                      width: 56,
                      height: 56,
                    }}
                  >
                    {metric.icon}
                  </Avatar>

                  <TrendIndicator trend={getTrendDirection(metric.change)}>
                    {getTrendDirection(metric.change) === 'up' && (
                      <TrendingUp />
                    )}
                    {getTrendDirection(metric.change) === 'down' && (
                      <TrendingDown />
                    )}
                    <Typography variant="body2" fontWeight="medium">
                      {Math.abs(metric.change).toFixed(1)}%
                    </Typography>
                  </TrendIndicator>
                </Box>

                {/* Title */}
                <Typography
                  variant="h6"
                  color="text.secondary"
                  gutterBottom
                  sx={{ fontSize: '0.875rem', fontWeight: 500 }}
                >
                  {metric.title}
                </Typography>

                {/* Value */}
                <MetricValue color="text.primary">{metric.value}</MetricValue>

                {/* Change Indicator */}
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1, mb: 2 }}
                >
                  {metric.changeLabel}
                </Typography>

                {/* Description */}
                <Typography variant="caption" color="text.secondary">
                  {metric.description}
                </Typography>

                {/* Progress Bar */}
                <LinearProgress
                  variant="determinate"
                  value={Math.min(Math.abs(metric.change) * 10, 100)}
                  sx={{
                    mt: 2,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: (theme) =>
                      theme.palette.mode === 'light'
                        ? 'rgba(0, 0, 0, 0.08)'
                        : 'rgba(255, 255, 255, 0.08)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 3,
                      backgroundColor: metric.color,
                    },
                  }}
                />
              </CardContent>
            </MetricCard>
          </Box>
        ))}
      </Box>
        </Box>

        {/* Right Side - Quick Actions */}
        <Box sx={{ width: { xs: '100%', lg: '300px' } }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Quick Actions
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Card
              sx={{
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
              }}
              onClick={() => setShowAttendanceDialog(true)}
            >
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <AttendanceIcon
                  sx={{ fontSize: 48, color: 'primary.main', mb: 1 }}
                />
                <Typography variant="h6">Record Attendance</Typography>
                <Typography variant="body2" color="text.secondary">
                  Log service attendance
                </Typography>

                {attendanceError && (
                  <Alert severity="error" sx={{ mt: 2, fontSize: '0.75rem' }}>
                    Unable to load data
                  </Alert>
                )}
              </CardContent>
            </Card>
            {/* Monthly Report Pack Widget - Only for authorized users */}
            {hasAnyRole(['SystemAdministration', 'MonthlyReportPack']) && (
              <MonthlyReportPackWidget />
            )}
            <Card
              sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
              onClick={handleAddMember}
            >
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <PeopleIcon
                  sx={{ fontSize: 48, color: 'primary.main', mb: 1 }}
                />
                <Typography variant="h6">Add New Member</Typography>
                <Typography variant="body2" color="text.secondary">
                  Register a new church member
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>

      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleRefresh}>
          <RefreshIcon sx={{ mr: 1 }} />
          Refresh Data
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>Export Report</MenuItem>
        <MenuItem onClick={handleMenuClose}>Settings</MenuItem>
      </Menu>

      {/* Attendance Entry Dialog */}
      <Dialog
        open={showAttendanceDialog}
        onClose={() => setShowAttendanceDialog(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            m: { xs: 0, sm: 2 },
            maxHeight: { xs: '100vh', sm: '90vh' },
          },
        }}
      >
        <DialogTitle>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              bgcolor: 'grey.100',
              p: 2,
              m: -3,
              mb: 0,
              borderRadius: '4px 4px 0 0',
            }}
          >
            <AttendanceIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h5" color="primary.main" fontWeight="bold">
              Record Attendance
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enGB}>
            <Box
              sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
            >
              <DatePicker
                label="Service Date"
                value={selectedDate}
                onChange={(newDate) => setSelectedDate(newDate)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: 'outlined',
                  },
                }}
              />
              <AttendanceRecordForm
                defaultDate={selectedDate || new Date()}
                onSuccess={() => {
                  setShowAttendanceDialog(false);
                  // Refresh dashboard data
                  handleRefresh();
                }}
                onCancel={() => setShowAttendanceDialog(false)}
              />
            </Box>
          </LocalizationProvider>
        </DialogContent>
      </Dialog>

      {/* Church Member Drawer for Add */}
      <ChurchMemberDrawer
        open={memberDrawerOpen}
        onClose={handleMemberDrawerClose}
        mode="add"
        member={null}
        onSuccess={handleMemberSuccess}
      />
    </Box>
  );
};
