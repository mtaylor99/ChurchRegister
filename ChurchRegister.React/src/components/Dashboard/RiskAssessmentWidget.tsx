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
import {
  Shield as ShieldIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDashboardRiskAssessmentSummary } from '../../hooks/useRiskAssessments';

const MetricCard = Card;

const MetricValue = Typography;

export const RiskAssessmentWidget: React.FC = () => {
  const navigate = useNavigate();
  const { data, isPending, isError } = useDashboardRiskAssessmentSummary();

  const overdueCount = data?.overdueCount || 0;
  const dueSoonCount = data?.dueSoonCount || 0;
  const totalCount = data?.totalCount || 0;

  const handleClick = () => {
    navigate('/app/risk-assessments');
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
              Failed to load risk assessment summary
            </Alert>
          </CardContent>
        </MetricCard>
      </Box>
    );
  }

  // Determine status: overdue (red), due soon (amber), or all current (green)
  const isOverdue = overdueCount > 0;
  const isDueSoon = !isOverdue && dueSoonCount > 0;

  // Colors based on status
  const avatarColor = isOverdue ? '#D32F2F' : isDueSoon ? '#ED6C02' : '#4CAF50';
  const statusColor = isOverdue
    ? 'error.main'
    : isDueSoon
      ? 'warning.main'
      : 'success.main';
  const progressColor = isOverdue ? '#D32F2F' : isDueSoon ? '#ED6C02' : '#4CAF50';

  // Status text
  const statusText = isOverdue
    ? `${overdueCount} overdue`
    : isDueSoon
      ? `${dueSoonCount} due soon`
      : 'All assessments current ✓';

  // Breakdown text
  const breakdownText = isOverdue || isDueSoon
    ? `${overdueCount} overdue, ${dueSoonCount} due within 60 days`
    : 'All current';

  // Status icon
  const StatusIcon = isOverdue
    ? ErrorIcon
    : isDueSoon
      ? WarningIcon
      : CheckCircleIcon;

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
                bgcolor: avatarColor,
                width: 56,
                height: 56,
              }}
            >
              <ShieldIcon sx={{ fontSize: 32 }} />
            </Avatar>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                color: statusColor,
                gap: 0.5,
              }}
            >
              <StatusIcon sx={{ fontSize: 20 }} />
              <Typography variant="body2" fontWeight="medium">
                {isOverdue ? 'Overdue' : isDueSoon ? 'Due Soon' : 'Current'}
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
            Risk Assessments
          </Typography>

          {/* Value */}
          {isOverdue || isDueSoon ? (
            <>
              <MetricValue
                sx={{
                  fontSize: '2.5rem',
                  fontWeight: 'bold',
                  lineHeight: 1.2,
                }}
                color={statusColor}
              >
                {isOverdue ? overdueCount : dueSoonCount}
              </MetricValue>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1, mb: 2 }}
              >
                {statusText}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {breakdownText}
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
                {statusText}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {totalCount} {totalCount === 1 ? 'assessment' : 'assessments'} up to date
              </Typography>
            </>
          )}

          <LinearProgress
            variant="determinate"
            value={isOverdue || isDueSoon ? 100 : 0}
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
                backgroundColor: progressColor,
              },
            }}
          />
        </CardContent>
      </MetricCard>
    </Box>
  );
};
