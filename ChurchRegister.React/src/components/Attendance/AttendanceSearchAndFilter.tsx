import React, { useCallback, useMemo } from 'react';
import {
  Box,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
} from '@mui/material';
import {
  Clear as ClearIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { enGB } from 'date-fns/locale';
import { useEvents } from '../../hooks/useAttendance';
import type { AttendanceFilterState } from '../../types/attendance';

export interface AttendanceSearchAndFilterProps {
  /** Current filter state */
  filters: AttendanceFilterState;
  /** Callback when filters change */
  onFiltersChange: (filters: AttendanceFilterState) => void;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Whether to show compact layout */
  compact?: boolean;
}

/**
 * Search and filter component for attendance records
 * Provides event type dropdown and date range filters without text search
 */
export const AttendanceSearchAndFilter: React.FC<
  AttendanceSearchAndFilterProps
> = ({ filters, onFiltersChange, disabled = false, compact = false }) => {
  const { data: events = [], isLoading: eventsLoading } = useEvents();

  // Filter to only active events for the dropdown
  const activeEvents = useMemo(
    () =>
      events
        .filter((event) => event.isActive)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [events]
  );

  // Check if any filters are applied
  const hasAnyFilters = useMemo(
    () => filters.eventTypeId || filters.startDate || filters.endDate,
    [filters.eventTypeId, filters.startDate, filters.endDate]
  );

  // Check if there are active filters to display as chips
  const hasActiveFilters = useMemo(
    () => filters.eventTypeId || filters.startDate || filters.endDate,
    [filters.eventTypeId, filters.startDate, filters.endDate]
  );

  // Get event name for display
  const getEventName = useCallback(
    (eventId: string) => {
      const event = events.find((e) => e.id.toString() === eventId);
      return event?.name || 'Unknown Event';
    },
    [events]
  );

  // Format date for display
  const formatDate = useCallback((date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  // Event handlers
  const handleEventChange = useCallback(
    (eventTypeId: string | undefined) => {
      onFiltersChange({
        ...filters,
        eventTypeId,
      });
    },
    [filters, onFiltersChange]
  );

  const handleStartDateChange = useCallback(
    (date: Date | null) => {
      onFiltersChange({
        ...filters,
        startDate: date || undefined,
      });
    },
    [filters, onFiltersChange]
  );

  const handleEndDateChange = useCallback(
    (date: Date | null) => {
      onFiltersChange({
        ...filters,
        endDate: date || undefined,
      });
    },
    [filters, onFiltersChange]
  );

  const clearAllFilters = useCallback(() => {
    onFiltersChange({
      eventTypeId: undefined,
      startDate: undefined,
      endDate: undefined,
    });
  }, [onFiltersChange]);

  const clearEventFilter = useCallback(() => {
    handleEventChange(undefined);
  }, [handleEventChange]);

  const clearStartDateFilter = useCallback(() => {
    handleStartDateChange(null);
  }, [handleStartDateChange]);

  const clearEndDateFilter = useCallback(() => {
    handleEndDateChange(null);
  }, [handleEndDateChange]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enGB}>
      <Box sx={{ mb: 1.5 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ mb: 1 }}
        >
          {/* Event Type Filter */}
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Event Type</InputLabel>
            <Select
              value={filters.eventTypeId || ''}
              onChange={(e) => handleEventChange(e.target.value || undefined)}
              label="Event Type"
              disabled={disabled || eventsLoading}
            >
              <MenuItem value="">
                <em>All</em>
              </MenuItem>
              {activeEvents.map((event) => (
                <MenuItem key={event.id} value={event.id.toString()}>
                  {event.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Start Date Filter */}
          <DatePicker
            label="Start Date"
            value={filters.startDate}
            onChange={handleStartDateChange}
            disabled={disabled}
            slotProps={{
              textField: {
                sx: { minWidth: 160 },
              },
            }}
          />

          {/* End Date Filter */}
          <DatePicker
            label="End Date"
            value={filters.endDate}
            onChange={handleEndDateChange}
            disabled={disabled}
            slotProps={{
              textField: {
                sx: { minWidth: 160 },
              },
            }}
          />

          {/* Clear All Button */}
          {hasAnyFilters && (
            <Button
              variant="outlined"
              onClick={clearAllFilters}
              disabled={disabled}
              startIcon={<ClearIcon />}
              sx={{ minWidth: 'fit-content', whiteSpace: 'nowrap' }}
            >
              Clear All
            </Button>
          )}
        </Stack>

        {/* Active Filters Display */}
        {hasActiveFilters && !compact && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap',
            }}
          >
            <FilterIcon color="action" sx={{ fontSize: 20 }} />
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
              {filters.eventTypeId && (
                <Chip
                  label={`Event: ${getEventName(filters.eventTypeId)}`}
                  onDelete={clearEventFilter}
                  size="small"
                  variant="outlined"
                />
              )}
              {filters.startDate && (
                <Chip
                  label={`Start: ${formatDate(filters.startDate)}`}
                  onDelete={clearStartDateFilter}
                  size="small"
                  variant="outlined"
                />
              )}
              {filters.endDate && (
                <Chip
                  label={`End: ${formatDate(filters.endDate)}`}
                  onDelete={clearEndDateFilter}
                  size="small"
                  variant="outlined"
                />
              )}
            </Stack>
          </Box>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default AttendanceSearchAndFilter;
