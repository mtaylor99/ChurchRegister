import React, { useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Box,
  Typography,
  Skeleton,
  Alert,
  useTheme,
  alpha,
  Chip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import type { MonthlyAverage } from '../../types/attendance';

export interface ChartDataPoint {
  date: string;
  attendance: number;
  monthYear?: string;
  formattedDate?: string;
}

export interface AttendanceChartProps {
  /**
   * Chart data points
   */
  data: ChartDataPoint[];
  /**
   * Monthly data points (alternative to data for monthly charts)
   */
  monthlyData?: MonthlyAverage[];
  /**
   * Chart title
   */
  title: string;
  /**
   * Chart subtitle or description
   */
  subtitle?: string;
  /**
   * Chart type
   */
  type?: 'line' | 'bar' | 'monthlyAverage';
  /**
   * Show trend indicators
   */
  showTrend?: boolean;
  /**
   * Chart height in pixels
   */
  height?: number;
  /**
   * Loading state
   */
  loading?: boolean;
  /**
   * Error state
   */
  error?: string;
  /**
   * Color scheme
   */
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  /**
   * Show grid lines
   */
  showGrid?: boolean;
  /**
   * Show legend
   */
  showLegend?: boolean;
  /**
   * Date format for X-axis
   */
  dateFormat?: string;
  /**
   * Animate the chart
   */
  animate?: boolean;
}

/**
 * Chart component for visualizing attendance data over time
 */
export const AttendanceChart: React.FC<AttendanceChartProps> = React.memo(({
  data,
  monthlyData,
  title,
  subtitle,
  type = 'line',
  height = 300,
  loading = false,
  error,
  color = 'primary',
  showGrid = true,
  showLegend = false,
  dateFormat = 'MMM dd',
  animate = true,
  showTrend = false,
}) => {
  const theme = useTheme();
  const chartColor = theme.palette[color].main;

  // Determine which data to use and process accordingly
  const isMonthlyChart = type === 'monthlyAverage' && monthlyData;
  const chartData = isMonthlyChart ? monthlyData : data;

  // Process data for chart display
  const processedData = useMemo(() => {
    if (isMonthlyChart && monthlyData) {
      // Process monthly data
      return [...monthlyData].reverse().map((point) => ({
        displayDate: point.month,
        attendance: point.averageAttendance,
        monthYear: point.monthYear,
        recordCount: point.recordCount,
        date: point.monthYear, // For compatibility
      }));
    } else {
      // Process regular data
      return data.map((point) => ({
        ...point,
        // Format date for display
        displayDate:
          point.formattedDate || format(parseISO(point.date), dateFormat),
        // Ensure attendance is a number
        attendance: Number(point.attendance) || 0,
      }));
    }
  }, [data, monthlyData, isMonthlyChart, dateFormat]);

  // Calculate statistics with trend analysis
  const stats = useMemo(() => {
    if (chartData.length === 0) return null;

    const attendanceValues =
      isMonthlyChart && monthlyData
        ? monthlyData.map((d) => Number(d.averageAttendance) || 0)
        : data.map((d) => Number(d.attendance) || 0);

    const total = attendanceValues.reduce((sum, val) => sum + val, 0);
    const average = total / attendanceValues.length;
    const max = Math.max(...attendanceValues);
    const min = Math.min(...attendanceValues);

    // Calculate trend (compare first half vs second half)
    let trendPercentage = 0;
    let trendDirection: 'up' | 'down' | 'flat' = 'flat';

    if (attendanceValues.length >= 4) {
      const midPoint = Math.floor(attendanceValues.length / 2);
      const firstHalf = attendanceValues.slice(0, midPoint);
      const secondHalf = attendanceValues.slice(midPoint);

      const firstAvg =
        firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
      const secondAvg =
        secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

      if (firstAvg > 0) {
        trendPercentage = ((secondAvg - firstAvg) / firstAvg) * 100;

        if (trendPercentage > 5) {
          trendDirection = 'up';
        } else if (trendPercentage < -5) {
          trendDirection = 'down';
        } else {
          trendDirection = 'flat';
        }
      }
    }

    // Calculate period-over-period change
    let periodChange = 0;
    if (attendanceValues.length >= 2) {
      const latest = attendanceValues[attendanceValues.length - 1];
      const previous = attendanceValues[attendanceValues.length - 2];
      if (previous > 0) {
        periodChange = ((latest - previous) / previous) * 100;
      }
    }

    return {
      total,
      average: Math.round(average),
      max,
      min,
      count: attendanceValues.length,
      trendPercentage: Math.round(trendPercentage * 10) / 10,
      trendDirection,
      periodChange: Math.round(periodChange * 10) / 10,
    };
  }, [chartData.length, isMonthlyChart, monthlyData, data]);

  // Custom tooltip formatter
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{
      color: string;
      value: number;
      payload?: { monthYear?: string; recordCount?: number };
    }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const payloadData = data.payload;

      return (
        <Box
          sx={{
            backgroundColor: 'background.paper',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            p: 1.5,
            boxShadow: theme.shadows[4],
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            {isMonthlyChart ? payloadData?.monthYear || label : label}
          </Typography>
          <Typography variant="body2" sx={{ color: data.color }}>
            {isMonthlyChart ? 'Average Attendance' : 'Attendance'}:{' '}
            <strong>{data.value?.toLocaleString()}</strong>
          </Typography>
          {isMonthlyChart && payloadData?.recordCount && (
            <Typography variant="caption" color="text.secondary">
              Records: {payloadData.recordCount}
            </Typography>
          )}
        </Box>
      );
    }
    return null;
  };

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title={title}
        subheader={subtitle}
        action={
          stats && (
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" color="text.secondary">
                Avg: {stats.average.toLocaleString()} | Max:{' '}
                {stats.max.toLocaleString()}
              </Typography>
              {/* Trend Indicator */}
              {showTrend && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mt: 0.5,
                  }}
                >
                  <Chip
                    icon={
                      stats.trendDirection === 'up' ? (
                        <TrendingUpIcon />
                      ) : stats.trendDirection === 'down' ? (
                        <TrendingDownIcon />
                      ) : (
                        <TrendingFlatIcon />
                      )
                    }
                    label={`${stats.trendPercentage > 0 ? '+' : ''}${stats.trendPercentage}%`}
                    color={
                      stats.trendDirection === 'up'
                        ? 'success'
                        : stats.trendDirection === 'down'
                          ? 'error'
                          : 'default'
                    }
                    size="small"
                    variant="outlined"
                  />
                </Box>
              )}
            </Box>
          )
        }
      />
      <CardContent>
        {loading ? (
          <Box sx={{ height }}>
            <Skeleton variant="rectangular" width="100%" height="100%" />
          </Box>
        ) : processedData.length === 0 ? (
          <Box
            sx={{
              height,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: alpha(theme.palette.grey[100], 0.5),
              borderRadius: 1,
            }}
          >
            <Typography color="text.secondary">
              No attendance data available
            </Typography>
          </Box>
        ) : (
          <Box sx={{ width: '100%', height }}>
            <ResponsiveContainer>
              {type === 'line' ? (
                <LineChart
                  data={processedData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  {showGrid && (
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={alpha(theme.palette.grey[400], 0.3)}
                    />
                  )}
                  <XAxis
                    dataKey="displayDate"
                    stroke={theme.palette.text.secondary}
                    fontSize={12}
                  />
                  <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  {showLegend && <Legend />}
                  <Line
                    type="monotone"
                    dataKey="attendance"
                    stroke={chartColor}
                    strokeWidth={3}
                    dot={{
                      fill: chartColor,
                      strokeWidth: 2,
                      r: 4,
                    }}
                    activeDot={{
                      r: 6,
                      stroke: chartColor,
                      strokeWidth: 2,
                      fill: theme.palette.background.paper,
                    }}
                    animationDuration={animate ? 1000 : 0}
                  />
                </LineChart>
              ) : (
                <BarChart
                  data={processedData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  {showGrid && (
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={alpha(theme.palette.grey[400], 0.3)}
                    />
                  )}
                  <XAxis
                    dataKey="displayDate"
                    stroke={theme.palette.text.secondary}
                    fontSize={12}
                  />
                  <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  {showLegend && <Legend />}
                  <Bar
                    dataKey="attendance"
                    fill={chartColor}
                    radius={[4, 4, 0, 0]}
                    animationDuration={animate ? 1000 : 0}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
});

export default AttendanceChart;
