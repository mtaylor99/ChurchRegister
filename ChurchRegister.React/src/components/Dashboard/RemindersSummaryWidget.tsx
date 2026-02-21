import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Alert,
  LinearProgress,
  Skeleton,
} from '@mui/material';
import { Notifications as RemindersIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDashboardReminderSummary } from '../../hooks/useReminders';

const MetricCard = Card;

const MetricValue = Typography;

export const RemindersSummaryWidget: React.FC = () => {
  const navigate = useNavigate();
  const { data, isPending, isError } = useDashboardReminderSummary();

  const upcomingCount = data?.upcomingCount || 0;

  const handleClick = () => {
    navigate('/app/reminders');
  };

  if (isPending) {
    return (
      <Box>
        <MetricCard>
          <CardContent sx={{ p: 3 }}>
            <Skeleton variant="circular" width={56} height={56} />
            <Skeleton variant="text" sx={{ mt: 2 }} />
            <Skeleton variant="rectangular" height={60} sx={{ mt: 1 }} />
          </CardContent>
        </MetricCard>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box>
        <MetricCard>
          <CardContent sx={{ p: 3 }}>
            <Alert severity="error">
              Failed to load reminders summary
            </Alert>
          </CardContent>
        </MetricCard>
      </Box>
    );
  }

  return (
    <Box>
      <MetricCard
        onClick={handleClick}
        sx={{
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: (theme) => theme.shadows[8],
          },
        }}
      >
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
                bgcolor: upcomingCount > 0 ? '#2196F3' : '#4CAF50',
                width: 56,
                height: 56,
              }}
            >
              <RemindersIcon sx={{ fontSize: 32 }} />
            </Avatar>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                color: upcomingCount > 0 ? '#1976D2' : '#388E3C',
                gap: 0.5,
              }}
            >
              <Typography variant="body2" fontWeight="medium">
                {upcomingCount > 0 ? 'Upcoming' : 'All Clear'}
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
            Upcoming Reminders
          </Typography>

          {/* Value */}
          {upcomingCount > 0 ? (
            <>
              <MetricValue
                sx={{
                  fontSize: '2.5rem',
                  fontWeight: 'bold',
                  lineHeight: 1.2,
                }}
                color="text.primary"
              >
                {upcomingCount}
              </MetricValue>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1, mb: 2 }}
              >
                {upcomingCount === 1 ? 'reminder' : 'reminders'} due soon
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Due within 30 days
              </Typography>
            </>
          ) : (
            <>
              <MetricValue
                sx={{
                  fontSize: '2.5rem',
                  fontWeight: 'bold',
                  lineHeight: 1.2,
                }}
                color="success.main"
              >
                ✓
              </MetricValue>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1, mb: 2 }}
              >
                All reminders handled
              </Typography>
              <Typography variant="caption" color="text.secondary">
                No reminders due in 30 days
              </Typography>
            </>
          )}

          <LinearProgress
            variant="determinate"
            value={upcomingCount > 0 ? 100 : 0}
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
                backgroundColor: upcomingCount > 0 ? '#2196F3' : '#4CAF50',
              },
            }}
          />
        </CardContent>
      </MetricCard>
    </Box>
  );
};
