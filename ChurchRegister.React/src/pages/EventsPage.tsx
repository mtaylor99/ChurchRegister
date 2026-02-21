import React, { useState } from 'react';
import {
  Typography,
  Box,
  Paper,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Alert,
  Tooltip,
  Menu,
  MenuItem,
  Card,
  CardContent,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  Event as EventIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  CalendarToday as CalendarTodayIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import {
  useEvents,
  useCreateEvent,
  useUpdateEvent,
} from '../hooks/useAttendance';
import { useRBAC } from '../hooks/useRBAC';
import type {
  Event,
  CreateEventRequest,
  UpdateEventRequest,
} from '../services/eventService';

interface EventFormData {
  name: string;
  description: string;
  isActive: boolean;
  showInAnalysis: boolean;
  dayOfWeek: number | ''; // 0-6 or empty string for "None"
}

/**
 * Comprehensive Event Management Page
 */
export const EventsPage: React.FC = () => {
  const { canManageEvents } = useRBAC();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deleteConfirmEvent, setDeleteConfirmEvent] = useState<Event | null>(
    null
  );
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Day of week options for dropdown
  const dayOfWeekOptions = [
    { value: '', label: 'None (Any Day)' },
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];

  // Helper function to get day of week label
  const getDayOfWeekLabel = (dayOfWeek: number | undefined | null): string => {
    if (dayOfWeek === undefined || dayOfWeek === null) return '—';
    const option = dayOfWeekOptions.find((opt) => opt.value === dayOfWeek);
    return option ? option.label : '—';
  };

  // Data hooks
  const { data: events = [], isLoading, error } = useEvents();
  const createEventMutation = useCreateEvent();
  const updateEventMutation = useUpdateEvent();

  // Form handling
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EventFormData>({
    defaultValues: {
      name: '',
      description: '',
      isActive: true,
      showInAnalysis: true,
      dayOfWeek: '',
    },
  });

  // Event handlers
  const handleAddEvent = () => {
    reset({
      name: '',
      description: '',
      isActive: true,
      showInAnalysis: true,
      dayOfWeek: '',
    });
    setEditingEvent(null);
    setShowAddDialog(true);
  };

  const handleEditEvent = (event: Event) => {
    reset({
      name: event.name,
      description: event.description || '',
      isActive: event.isActive,
      showInAnalysis: event.showInAnalysis,
      dayOfWeek: event.dayOfWeek ?? '',
    });
    setEditingEvent(event);
    setShowAddDialog(true);
    handleCloseMenu();
  };

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    eventItem: Event
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedEvent(eventItem);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedEvent(null);
  };

  const onSubmit = async (data: EventFormData) => {
    try {
      if (editingEvent) {
        const updateRequest: UpdateEventRequest = {
          id: editingEvent.id,
          name: data.name,
          description: data.description || undefined,
          isActive: data.isActive,
          showInAnalysis: data.showInAnalysis,
          dayOfWeek: data.dayOfWeek === '' ? undefined : data.dayOfWeek,
        };
        await updateEventMutation.mutateAsync(updateRequest);
      } else {
        const createRequest: CreateEventRequest = {
          name: data.name,
          description: data.description || undefined,
          isActive: data.isActive,
          showInAnalysis: data.showInAnalysis,
          dayOfWeek: data.dayOfWeek === '' ? undefined : data.dayOfWeek,
        };
        await createEventMutation.mutateAsync(createRequest);
      }
      setShowAddDialog(false);
      reset();
    } catch (error) {
      console.error('Failed to save event:', error);
    }
  };

  const confirmDelete = async () => {
    // Delete functionality not implemented yet
    setDeleteConfirmEvent(null);
  };

  const getEventStatusColor = (
    event: Event
  ): 'success' | 'default' | 'warning' => {
    if (!event.isActive) return 'default';
    if (event.showInAnalysis) return 'success';
    return 'warning';
  };

  const getEventStatusText = (event: Event): string => {
    if (!event.isActive) return 'Inactive';
    if (event.showInAnalysis) return 'Active & In Charts';
    return 'Active';
  };

  if (!canManageEvents) {
    return (
      <Box sx={{ py: 3, px: 2 }}>
        <Alert severity="error">
          <Typography variant="h6">Access Denied</Typography>
          <Typography variant="body2">
            You don't have permission to manage events.
          </Typography>
        </Alert>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: 3, px: 2 }}>
        <Alert severity="error">
          <Typography variant="h6">Error Loading Events</Typography>
          <Typography variant="body2">
            Failed to load events. Please try refreshing the page.
          </Typography>
        </Alert>
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
      <Box mb={2}>
        <Typography variant="h4" gutterBottom>
          Event Management
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Create and manage church events for attendance tracking
        </Typography>
      </Box>

      {/* Search and Actions */}
      <Box sx={{ mb: 3 }}>
        <Paper sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              fullWidth
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                ),
              }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddEvent}
              size="small"
              sx={{ minWidth: 'fit-content', whiteSpace: 'nowrap', px: 3 }}
            >
              Add Event
            </Button>
          </Stack>
        </Paper>
      </Box>

      {/* Summary Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 2,
        }}
      >
        <Card>
          <CardContent>
            <Typography variant="h6" color="primary">
              Total Events
            </Typography>
            <Typography variant="h4">{events.length}</Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" color="success.main">
              Active Events
            </Typography>
            <Typography variant="h4">
              {events.filter((e) => e.isActive).length}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" color="info.main">
              Events In Charts
            </Typography>
            <Typography variant="h4">
              {events.filter((e) => e.showInAnalysis).length}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Events Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Event Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Day of Week</TableCell>
                <TableCell>Display In Charts</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Loading events...
                  </TableCell>
                </TableRow>
              ) : events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Box py={4}>
                      <EventIcon
                        sx={{ fontSize: 64, color: 'grey.400', mb: 2 }}
                      />
                      <Typography variant="h6" color="text.secondary">
                        No events found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Create your first event to start tracking attendance
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAddEvent}
                        sx={{ mt: 2 }}
                      >
                        Add Event
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                // Filter and sort events
                events
                  .filter(
                    (event) =>
                      searchTerm === '' ||
                      event.name
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                      (event.description &&
                        event.description
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase()))
                  )
                  .sort((a, b) => a.name.localeCompare(b.name)) // Sort by name ascending
                  .map((event) => (
                    <TableRow key={event.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight="medium">
                          {event.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {event.description || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {event.dayOfWeek !== undefined &&
                        event.dayOfWeek !== null ? (
                          <Chip
                            label={getDayOfWeekLabel(event.dayOfWeek)}
                            size="small"
                            variant="outlined"
                            icon={<CalendarTodayIcon />}
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={event.showInAnalysis ? 'Yes' : 'No'}
                          color={event.showInAnalysis ? 'success' : 'default'}
                          size="small"
                          variant={event.showInAnalysis ? 'filled' : 'outlined'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getEventStatusText(event)}
                          color={getEventStatusColor(event)}
                          size="small"
                          icon={
                            event.isActive ? (
                              <VisibilityIcon />
                            ) : (
                              <VisibilityOffIcon />
                            )
                          }
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="More actions">
                          <IconButton
                            onClick={(e) => handleMenuClick(e, event)}
                            size="small"
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem
          onClick={() => selectedEvent && handleEditEvent(selectedEvent)}
        >
          <EditIcon sx={{ mr: 1 }} />
          Edit Event
        </MenuItem>
        {/* Delete functionality not implemented yet */}
      </Menu>

      {/* Add/Edit Event Dialog */}
      <Dialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                bgcolor: 'grey.100',
                p: 2,
                m: -3,
                mb: 0,
                borderRadius: '4px 4px 0 0',
              }}
            >
              <Typography variant="h5" color="primary.main" fontWeight="bold">
                {editingEvent ? 'Edit Event' : 'Add New Event'}
              </Typography>
              <IconButton
                onClick={() => setShowAddDialog(false)}
                sx={{ color: 'primary.main' }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ mt: 1 }}>
            <Stack spacing={3}>
              <Controller
                name="name"
                control={control}
                rules={{ required: 'Event name is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Event Name"
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    placeholder="e.g., Sunday Morning Service"
                  />
                )}
              />

              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Description (Optional)"
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Brief description of the event..."
                  />
                )}
              />

              <Controller
                name="dayOfWeek"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel id="dayOfWeek-label">Day of Week</InputLabel>
                    <Select
                      {...field}
                      labelId="dayOfWeek-label"
                      label="Day of Week"
                      value={field.value}
                    >
                      {dayOfWeekOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>
                      Restrict attendance entry to specific day (optional)
                    </FormHelperText>
                  </FormControl>
                )}
              />

              <Box>
                <Controller
                  name="isActive"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={field.onChange}
                        />
                      }
                      label="Active Event"
                    />
                  )}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  Active events can have attendance recorded
                </Typography>
              </Box>

              <Box>
                <Controller
                  name="showInAnalysis"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={field.onChange}
                        />
                      }
                      label="Display In Charts"
                    />
                  )}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  Include this event in attendance analytics and reports
                </Typography>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setShowAddDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting
                ? 'Saving...'
                : editingEvent
                  ? 'Update Event'
                  : 'Create Event'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirmEvent}
        onClose={() => setDeleteConfirmEvent(null)}
        maxWidth="sm"
      >
        <DialogTitle>
          <Box
            sx={{
              bgcolor: 'grey.100',
              p: 2,
              m: -3,
              mb: 0,
              borderRadius: '4px 4px 0 0',
            }}
          >
            <Typography variant="h5" color="primary.main" fontWeight="bold">
              Delete Event
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deleteConfirmEvent?.name}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone. All attendance records for this event
            will also be removed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmEvent(null)}>Cancel</Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            disabled={false}
          >
            Delete Event
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EventsPage;
