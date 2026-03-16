import React from 'react';
import { Paper, Typography, Box, Skeleton, Chip, Alert } from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { AttendanceChart } from './AttendanceChart';
import type { MonthlyAverage } from '../../types/attendance';
import type { Event } from '../../services/eventService';

export interface MonthlyAttendanceChartProps {
  event: Event;
  monthlyData: MonthlyAverage[];
  isLoading?: boolean;
  animate?: boolean;
}

export const MonthlyAttendanceChart: React.FC<MonthlyAttendanceChartProps> =
  React.memo(({ event, monthlyData, isLoading = false, animate = true }) => {
    if (isLoading) {
      return (
        <Paper sx={{ p: 2, height: 380 }}>
          <Skeleton variant="text" width="60%" height={32} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" width="100%" height={300} />
        </Paper>
      );
    }

    if (!monthlyData || monthlyData.length === 0) {
      return (
        <Paper sx={{ p: 2, height: 380 }}>
          <Box display="flex" alignItems="center" mb={2}>
            <CalendarIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" component="h3">
              {event.name}
            </Typography>
          </Box>
          <Alert
            severity="info"
            sx={{ height: '300px', display: 'flex', alignItems: 'center' }}
          >
            No attendance data available for the last 12 months
          </Alert>
        </Paper>
      );
    }

    // Calculate statistics
    const totalRecords = monthlyData.reduce(
      (sum, month) => sum + month.recordCount,
      0
    );
    const averageAttendance =
      monthlyData.length > 0
        ? monthlyData.reduce((sum, month) => sum + month.averageAttendance, 0) /
          monthlyData.length
        : 0;
    const highestMonth = monthlyData.reduce((max, month) =>
      month.averageAttendance > max.averageAttendance ? month : max
    );
    const lowestMonth = monthlyData.reduce((min, month) =>
      month.averageAttendance < min.averageAttendance ? month : min
    );

    return (
      <Paper
        sx={{ p: 2, height: 380, display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={2}
        >
          <Box display="flex" alignItems="center" flex={1} minWidth={0}>
            <CalendarIcon
              sx={{ mr: 1, color: 'primary.main', flexShrink: 0 }}
            />
            <Typography variant="h6" component="h3" noWrap title={event.name}>
              {event.name}
            </Typography>
          </Box>
          <Chip
            icon={<PeopleIcon />}
            label={`${Math.round(averageAttendance)} avg`}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>

        {/* Chart */}
        <Box flex={1} sx={{ minHeight: 0 }}>
          <AttendanceChart
            data={[]} // Not used for monthly charts
            type="monthlyAverage"
            monthlyData={monthlyData}
            title="" // Remove redundant title
            height={200}
            showTrend={false} // Remove redundant trend info
            animate={animate}
          />
        </Box>

        {/* Stats Footer */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mt={2}
          pt={2}
          sx={{ borderTop: 1, borderColor: 'divider' }}
        >
          <Box display="flex" alignItems="center" minWidth={0} flex={1}>
            <TrendingUpIcon
              sx={{
                mr: 0.5,
                fontSize: '1rem',
                color: 'success.main',
                flexShrink: 0,
              }}
            />
            <Typography variant="caption" color="textSecondary" noWrap>
              High: {Math.round(highestMonth.averageAttendance)} (
              {highestMonth.month})
            </Typography>
          </Box>
          <Typography variant="caption" color="textSecondary" sx={{ mx: 1 }}>
            {totalRecords} records
          </Typography>
          <Typography
            variant="caption"
            color="textSecondary"
            textAlign="right"
            minWidth={0}
            flex={1}
          >
            Low: {Math.round(lowestMonth.averageAttendance)} (
            {lowestMonth.month})
          </Typography>
        </Box>
      </Paper>
    );
  });

MonthlyAttendanceChart.displayName = 'MonthlyAttendanceChart';
