import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Skeleton,
  useTheme,
  alpha,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  People as PeopleIcon,
  Event as EventIcon,
  CalendarToday as CalendarIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';

export interface AttendanceStatsCardProps {
  /**
   * Title of the stat
   */
  title: string;
  /**
   * Main value to display
   */
  value?: number | string;
  /**
   * Previous value for comparison (optional)
   */
  previousValue?: number;
  /**
   * Icon to display
   */
  icon?: React.ReactNode;
  /**
   * Color theme for the card
   */
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  /**
   * Show trend indicator
   */
  showTrend?: boolean;
  /**
   * Custom trend percentage (overrides calculated trend)
   */
  trendPercentage?: number;
  /**
   * Additional subtitle or description
   */
  subtitle?: string;
  /**
   * Loading state
   */
  loading?: boolean;
  /**
   * Format the value as a number with commas
   */
  formatNumber?: boolean;
  /**
   * Custom suffix for the value (e.g., '%', 'people')
   */
  suffix?: string;
}

/**
 * Card component for displaying attendance statistics with trend indicators
 */
export const AttendanceStatsCard: React.FC<AttendanceStatsCardProps> = ({
  title,
  value,
  previousValue,
  icon,
  color = 'primary',
  showTrend = false,
  trendPercentage,
  subtitle,
  loading = false,
  formatNumber = true,
  suffix = '',
}) => {
  const theme = useTheme();

  // Calculate trend if not provided
  const calculatedTrend = React.useMemo(() => {
    if (trendPercentage !== undefined) return trendPercentage;

    if (
      typeof value === 'number' &&
      typeof previousValue === 'number' &&
      previousValue > 0
    ) {
      return ((value - previousValue) / previousValue) * 100;
    }

    return 0;
  }, [value, previousValue, trendPercentage]);

  // Determine trend direction and color
  const getTrendInfo = () => {
    if (calculatedTrend > 5) {
      return {
        direction: 'up' as const,
        color: 'success' as const,
        icon: <TrendingUpIcon fontSize="small" />,
      };
    } else if (calculatedTrend < -5) {
      return {
        direction: 'down' as const,
        color: 'error' as const,
        icon: <TrendingDownIcon fontSize="small" />,
      };
    } else {
      return {
        direction: 'flat' as const,
        color: 'info' as const,
        icon: <TrendingFlatIcon fontSize="small" />,
      };
    }
  };

  const trendInfo = showTrend ? getTrendInfo() : null;

  // Format the value for display
  const formatValue = (val: number | string) => {
    if (typeof val === 'number') {
      return formatNumber ? val.toLocaleString() : val.toString();
    }
    return val;
  };

  // Get default icon based on title
  const getDefaultIcon = () => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('attendance') || lowerTitle.includes('people')) {
      return <PeopleIcon />;
    }
    if (lowerTitle.includes('event')) {
      return <EventIcon />;
    }
    if (lowerTitle.includes('month') || lowerTitle.includes('date')) {
      return <CalendarIcon />;
    }
    if (lowerTitle.includes('analytics') || lowerTitle.includes('trend')) {
      return <AnalyticsIcon />;
    }
    return <PeopleIcon />;
  };

  const cardIcon = icon || getDefaultIcon();
  const colorTheme = theme.palette[color];

  return (
    <Card
      sx={{
        position: 'relative',
        overflow: 'visible',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          backgroundColor: colorTheme.main,
          borderRadius: '4px 4px 0 0',
        },
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Box>
            <Typography
              color="text.secondary"
              gutterBottom
              variant="body2"
              component="div"
            >
              {title}
            </Typography>
            {loading ? (
              <Skeleton variant="text" width={80} height={40} />
            ) : (
              <Typography
                variant="h4"
                component="div"
                sx={{ fontWeight: 'bold', color: colorTheme.main }}
              >
                {formatValue(value || 0)}
                {suffix}
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: '50%',
              backgroundColor: alpha(colorTheme.main, 0.1),
              color: colorTheme.main,
            }}
          >
            {cardIcon}
          </Box>
        </Box>

        {/* Subtitle */}
        {subtitle && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: showTrend ? 1 : 0 }}
          >
            {subtitle}
          </Typography>
        )}

        {/* Trend Indicator */}
        {showTrend && trendInfo && !loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              icon={trendInfo.icon}
              label={`${calculatedTrend > 0 ? '+' : ''}${calculatedTrend.toFixed(1)}%`}
              color={trendInfo.color}
              size="small"
              variant="outlined"
            />
            <Typography variant="caption" color="text.secondary">
              {trendInfo.direction === 'up' && 'Increased'}
              {trendInfo.direction === 'down' && 'Decreased'}
              {trendInfo.direction === 'flat' && 'No change'}
              {previousValue !== undefined && ' from last period'}
            </Typography>
          </Box>
        )}

        {/* Loading trend */}
        {showTrend && loading && (
          <Skeleton
            variant="rectangular"
            width={120}
            height={24}
            sx={{ borderRadius: 1 }}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default AttendanceStatsCard;
