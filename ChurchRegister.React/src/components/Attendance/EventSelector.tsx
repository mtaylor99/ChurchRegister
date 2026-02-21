import React, { useState, useMemo } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Typography,
  TextField,
  InputAdornment,
  ListSubheader,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  Event as EventIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
} from '@mui/icons-material';
import { useEvents } from '../../hooks/useAttendance';

export interface EventSelectorProps {
  /**
   * Currently selected event ID
   */
  value?: number;
  /**
   * Called when selection changes
   */
  onChange: (eventId: number | null) => void;
  /**
   * Label for the selector
   */
  label?: string;
  /**
   * Include inactive events in the list
   */
  includeInactive?: boolean;
  /**
   * Show only events that are enabled for analysis
   */
  analysisOnly?: boolean;
  /**
   * Allow clearing the selection
   */
  allowClear?: boolean;
  /**
   * Show event descriptions as helper text
   */
  showDescriptions?: boolean;
  /**
   * Disabled state
   */
  disabled?: boolean;
  /**
   * Error state
   */
  error?: boolean;
  /**
   * Helper text
   */
  helperText?: string;
  /**
   * Required field
   */
  required?: boolean;
  /**
   * Size variant
   */
  size?: 'small' | 'medium';
}

/**
 * Component for selecting church events with search and filtering capabilities
 */
export const EventSelector: React.FC<EventSelectorProps> = ({
  value,
  onChange,
  label = 'Select Event',
  includeInactive = false,
  analysisOnly = false,
  allowClear = true,
  showDescriptions = false,
  disabled = false,
  error = false,
  helperText,
  required = false,
  size = 'medium',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: events = [], isLoading, error: loadError } = useEvents();

  // Filter events based on props and search
  const filteredEvents = useMemo(() => {
    let filtered = events;

    // Filter by active status
    if (!includeInactive) {
      filtered = filtered.filter((event) => event.isActive);
    }

    // Filter by analysis flag
    if (analysisOnly) {
      filtered = filtered.filter((event) => event.showInAnalysis);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (event) =>
          event.name.toLowerCase().includes(term) ||
          (event.description && event.description.toLowerCase().includes(term))
      );
    }

    // Sort by name
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [events, includeInactive, analysisOnly, searchTerm]);

  // Group events by status
  const activeEvents = filteredEvents.filter((event) => event.isActive);
  const inactiveEvents = filteredEvents.filter((event) => !event.isActive);

  const handleChange = (eventId: string | number) => {
    if (eventId === '' || eventId === 0) {
      onChange(null);
    } else {
      onChange(Number(eventId));
    }
  };

  const selectedEvent = events.find((event) => event.id === value);

  if (loadError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Failed to load events. Please try refreshing the page.
      </Alert>
    );
  }

  return (
    <FormControl
      fullWidth
      size={size}
      error={error}
      disabled={disabled || isLoading}
      required={required}
    >
      <InputLabel>{label}</InputLabel>
      <Select
        value={value || ''}
        onChange={(e) => handleChange(e.target.value)}
        label={label}
        MenuProps={{
          PaperProps: {
            sx: { maxHeight: 400 },
          },
        }}
      >
        {/* Search input */}
        <ListSubheader>
          <TextField
            size="small"
            placeholder="Search events..."
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Escape') {
                e.stopPropagation();
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </ListSubheader>

        {/* Clear option */}
        {allowClear && (
          <MenuItem value="">
            <em>Clear selection</em>
          </MenuItem>
        )}

        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 3 }).map((_, index) => (
            <MenuItem key={index} disabled>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  width: '100%',
                }}
              >
                <Skeleton variant="circular" width={20} height={20} />
                <Skeleton variant="text" width="60%" />
              </Box>
            </MenuItem>
          ))
        ) : filteredEvents.length === 0 ? (
          <MenuItem disabled>
            <Typography color="text.secondary">
              {searchTerm
                ? 'No events match your search'
                : 'No events available'}
            </Typography>
          </MenuItem>
        ) : (
          <>
            {/* Active Events */}
            {activeEvents.length > 0 && (
              <>
                {includeInactive && (
                  <ListSubheader sx={{ bgcolor: 'success.50' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ActiveIcon fontSize="small" color="success" />
                      Active Events
                    </Box>
                  </ListSubheader>
                )}
                {activeEvents.map((event) => (
                  <MenuItem key={event.id} value={event.id}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        width: '100%',
                      }}
                    >
                      <EventIcon fontSize="small" color="primary" />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2">{event.name}</Typography>
                        {showDescriptions && event.description && (
                          <Typography variant="caption" color="text.secondary">
                            {event.description}
                          </Typography>
                        )}
                      </Box>
                      {analysisOnly && event.showInAnalysis && (
                        <Chip label="Analytics" size="small" color="info" />
                      )}
                    </Box>
                  </MenuItem>
                ))}
              </>
            )}

            {/* Inactive Events */}
            {includeInactive && inactiveEvents.length > 0 && (
              <>
                <ListSubheader sx={{ bgcolor: 'warning.50' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InactiveIcon fontSize="small" color="warning" />
                    Inactive Events
                  </Box>
                </ListSubheader>
                {inactiveEvents.map((event) => (
                  <MenuItem key={event.id} value={event.id}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        width: '100%',
                        opacity: 0.6,
                      }}
                    >
                      <EventIcon fontSize="small" />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2">{event.name}</Typography>
                        {showDescriptions && event.description && (
                          <Typography variant="caption" color="text.secondary">
                            {event.description}
                          </Typography>
                        )}
                      </Box>
                      <Chip
                        label="Inactive"
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                    </Box>
                  </MenuItem>
                ))}
              </>
            )}
          </>
        )}
      </Select>

      {/* Helper Text */}
      {(helperText || selectedEvent?.description) && (
        <Typography
          variant="caption"
          color={error ? 'error' : 'text.secondary'}
          sx={{ mt: 0.5, ml: 1.5 }}
        >
          {helperText || (showDescriptions && selectedEvent?.description)}
        </Typography>
      )}
    </FormControl>
  );
};

export default EventSelector;
