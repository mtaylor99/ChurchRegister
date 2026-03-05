import React, { useState, useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  IconButton,
  Chip,
  Typography,
  Box,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Skeleton,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  MoreVert as MoreIcon,
  Event as EventIcon,
  CalendarToday as DateIcon,
  People as AttendanceIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import {
  useAttendanceRecords,
  useRecentAttendance,
  useDeleteAttendance,
} from '../../hooks/useAttendance';
import { useNotification } from '../../hooks/useNotification';
import { useRBAC } from '../../hooks/useRBAC';
import type { AttendanceRecord } from '../../services/attendanceService';

export interface AttendanceRecordsListProps {
  /**
   * Called when user wants to edit a record
   */
  onEditRecord?: (record: AttendanceRecord) => void;
  /**
   * Filter by specific event ID
   */
  eventId?: number;
  /**
   * Maximum number of records to show (for dashboard widgets)
   */
  maxRecords?: number;
  /**
   * Show only recent records
   */
  recentOnly?: boolean;
}

/**
 * Component to display and manage attendance records in a table format
 */
export const AttendanceRecordsList: React.FC<AttendanceRecordsListProps> = ({
  onEditRecord,
  eventId,
  maxRecords,
  recentOnly,
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(maxRecords || 10);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(
    null
  );

  const { showNotification } = useNotification();
  const { canRecordAttendance } = useRBAC();

  // Use appropriate hook based on recentOnly flag
  const {
    data: allRecords = [],
    isLoading: allLoading,
    error: allError,
  } = useAttendanceRecords();
  const {
    data: recentRecords = [],
    isLoading: recentLoading,
    error: recentError,
  } = useRecentAttendance();

  const records = recentOnly ? recentRecords : allRecords;
  const isLoading = recentOnly ? recentLoading : allLoading;
  const error = recentOnly ? recentError : allError;

  const deleteAttendance = useDeleteAttendance();

  // Filter and sort records
  const filteredRecords = useMemo(() => {
    let filtered = records;

    // Filter by event ID if specified
    if (eventId) {
      filtered = filtered.filter((record) => record.eventId === eventId);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (record) =>
          record.eventName.toLowerCase().includes(term) ||
          record.attendance.toString().includes(term) ||
          format(new Date(record.date), 'PP').toLowerCase().includes(term)
      );
    }

    // Sort by date (newest first)
    filtered = filtered.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Limit records if specified
    if (maxRecords) {
      filtered = filtered.slice(0, maxRecords);
    }

    return filtered;
  }, [records, eventId, searchTerm, maxRecords]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    record: AttendanceRecord
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedRecord(record);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRecord(null);
  };

  const handleEditRecord = () => {
    if (selectedRecord) {
      onEditRecord?.(selectedRecord);
    }
    handleMenuClose();
  };

  const handleDeleteRecord = async () => {
    if (!selectedRecord) return;

    try {
      await deleteAttendance.mutateAsync(selectedRecord.id);
      showNotification('Attendance record deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting attendance record:', error);
      showNotification('Failed to delete attendance record', 'error');
    }

    handleMenuClose();
  };

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">
            Failed to load attendance records. Please try refreshing the page.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const paginatedRecords = maxRecords
    ? filteredRecords
    : filteredRecords.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
      );

  return (
    <Card>
      <CardHeader
        title="Attendance Records"
        subheader={`${filteredRecords.length} record${filteredRecords.length !== 1 ? 's' : ''}`}
        action={
          !maxRecords && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                size="small"
                placeholder="Search records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          )
        }
      />
      <CardContent sx={{ p: 0 }}>
        <TableContainer component={Paper} elevation={0}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EventIcon fontSize="small" />
                    Event
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DateIcon fontSize="small" />
                    Date
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      justifyContent: 'flex-end',
                    }}
                  >
                    <AttendanceIcon fontSize="small" />
                    Attendance
                  </Box>
                </TableCell>
                <TableCell>Last Modified</TableCell>
                {canRecordAttendance && (
                  <TableCell align="right">Actions</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: rowsPerPage }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton variant="text" />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" />
                    </TableCell>
                    {canRecordAttendance && (
                      <TableCell>
                        <Skeleton variant="text" />
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : paginatedRecords.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={canRecordAttendance ? 5 : 4}
                    align="center"
                  >
                    <Typography color="text.secondary" sx={{ py: 2 }}>
                      {searchTerm
                        ? 'No records match your search.'
                        : 'No attendance records found.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRecords.map((record) => (
                  <TableRow key={record.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {record.eventName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {format(new Date(record.date), 'PP')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(record.date), 'EEEE')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={record.attendance.toLocaleString()}
                        color="primary"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {record.modifiedDateTime
                          ? format(new Date(record.modifiedDateTime), 'PP p')
                          : format(new Date(record.createdDateTime), 'PP p')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        by {record.modifiedBy || record.createdBy}
                      </Typography>
                    </TableCell>
                    {canRecordAttendance && (
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, record)}
                          aria-label="More actions"
                        >
                          <MoreIcon />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {!maxRecords && filteredRecords.length > rowsPerPage && (
          <TablePagination
            component="div"
            count={filteredRecords.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        )}

        {/* Actions Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleEditRecord}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Record</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleDeleteRecord} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete Record</ListItemText>
          </MenuItem>
        </Menu>
      </CardContent>
    </Card>
  );
};

export default AttendanceRecordsList;
