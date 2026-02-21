import React, { useState, useCallback, useMemo } from 'react';
import { DataGrid, GridActionsCellItem, GridToolbar } from '@mui/x-data-grid';
import type {
  GridColDef,
  GridPaginationModel,
  GridSortModel,
} from '@mui/x-data-grid';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  CalendarToday as DateIcon,
  People as AttendanceIcon,
  MoreVert as MoreIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { ConfirmationModal } from '../Administration/ConfirmationModal';
import { ErrorBoundary } from '../Administration/ErrorBoundary';
import {
  useAttendanceGridData,
  useDeleteAttendance,
} from '../../hooks/useAttendance';
import { useNotification } from '../../hooks/useNotification';
import { useRBAC } from '../../hooks/useRBAC';
import type {
  AttendanceRecord,
  AttendanceGridQuery,
} from '../../types/attendance';

export interface AttendanceGridProps {
  /** Grid query configuration */
  query?: AttendanceGridQuery;
  /** Callback when query changes (pagination, sorting, filtering) */
  onQueryChange?: (query: AttendanceGridQuery) => void;
  /** Callback when edit action is triggered */
  onEditRecord?: (record: AttendanceRecord) => void;
  /** Callback when view action is triggered */
  onViewRecord?: (record: AttendanceRecord) => void;
}

interface ConfirmationState {
  open: boolean;
  record: AttendanceRecord | null;
  loading: boolean;
}

export const AttendanceGrid: React.FC<AttendanceGridProps> = React.memo(
  ({ query, onQueryChange, onEditRecord, onViewRecord }) => {
    const { showNotification } = useNotification();
    const { canRecordAttendance } = useRBAC();

    // Action menu state
    const [actionMenuAnchorEl, setActionMenuAnchorEl] =
      useState<null | HTMLElement>(null);
    const [selectedRecord, setSelectedRecord] =
      useState<AttendanceRecord | null>(null);

    // Default query if not provided
    const defaultQuery: AttendanceGridQuery = {
      page: 1,
      pageSize: 20,
      sortBy: 'date',
      sortDirection: 'desc',
      filters: {
        eventTypeId: undefined,
        startDate: undefined,
        endDate: undefined,
      },
    };

    const currentQuery = query || defaultQuery;

    // Local state for client mode fallback
    const [localPaginationModel, setLocalPaginationModel] =
      useState<GridPaginationModel>({
        page: 0,
        pageSize: 20,
      });

    const [localSortModel, setLocalSortModel] = useState<GridSortModel>([
      {
        field: 'date',
        sort: 'desc',
      },
    ]);

    // Confirmation modal state
    const [confirmation, setConfirmation] = useState<ConfirmationState>({
      open: false,
      record: null,
      loading: false,
    });

    // Fetch attendance grid data
    const {
      data: gridResponse,
      isLoading: isLoadingAttendance,
      error: attendanceError,
    } = useAttendanceGridData(currentQuery);

    // Delete attendance mutation
    const deleteAttendanceMutation = useDeleteAttendance();

    // Extract data from grid response
    const attendanceData = gridResponse?.data || [];
    const totalCount = gridResponse?.totalCount || 0;

    // Handle pagination changes
    const handlePaginationModelChange = useCallback(
      (model: GridPaginationModel) => {
        if (onQueryChange) {
          onQueryChange({
            ...currentQuery,
            page: model.page + 1, // DataGrid uses 0-based, our query uses 1-based
            pageSize: model.pageSize,
          });
        } else {
          setLocalPaginationModel(model);
        }
      },
      [onQueryChange, currentQuery]
    );

    // Handle sorting changes
    const handleSortModelChange = useCallback(
      (model: GridSortModel) => {
        if (onQueryChange && model.length > 0) {
          const { field, sort } = model[0];
          onQueryChange({
            ...currentQuery,
            sortBy: field,
            sortDirection: sort || 'asc',
          });
        } else if (onQueryChange) {
          // No sort selected, use default
          onQueryChange({
            ...currentQuery,
            sortBy: 'date',
            sortDirection: 'desc',
          });
        } else {
          setLocalSortModel(model);
        }
      },
      [onQueryChange, currentQuery]
    );

    // Handle action menu
    const handleActionMenuOpen = useCallback(
      (event: React.MouseEvent<HTMLElement>, record: AttendanceRecord) => {
        setActionMenuAnchorEl(event.currentTarget);
        setSelectedRecord(record);
      },
      []
    );

    const handleActionMenuClose = useCallback(() => {
      setActionMenuAnchorEl(null);
      setSelectedRecord(null);
    }, []);

    // Action handlers
    const handleViewRecord = useCallback(
      (record: AttendanceRecord) => {
        handleActionMenuClose();
        onViewRecord?.(record);
      },
      [onViewRecord, handleActionMenuClose]
    );

    const handleEditRecord = useCallback(
      (record: AttendanceRecord) => {
        handleActionMenuClose();
        onEditRecord?.(record);
      },
      [onEditRecord, handleActionMenuClose]
    );

    const handleDeleteRecord = useCallback(
      (record: AttendanceRecord) => {
        handleActionMenuClose();
        setConfirmation({
          open: true,
          record,
          loading: false,
        });
      },
      [handleActionMenuClose]
    );

    const handleConfirmDelete = async () => {
      if (!confirmation.record) return;

      setConfirmation((prev) => ({ ...prev, loading: true }));

      try {
        await deleteAttendanceMutation.mutateAsync(confirmation.record.id);
        showNotification('Attendance record deleted successfully', 'success');
        setConfirmation({ open: false, record: null, loading: false });
      } catch (error) {
        console.error('Failed to delete attendance record:', error);
        showNotification(
          'Failed to delete attendance record. Please try again.',
          'error'
        );
        setConfirmation((prev) => ({ ...prev, loading: false }));
      }
    };

    // Define grid columns
    const columns: GridColDef[] = useMemo(
      () => [
        {
          field: 'eventName',
          headerName: 'Event',
          flex: 1,
          minWidth: 200,
        },
        {
          field: 'date',
          headerName: 'Date',
          flex: 0.8,
          minWidth: 120,
          type: 'date',
          valueFormatter: (value) => {
            try {
              return format(parseISO(value), 'PPP');
            } catch {
              return value;
            }
          },
          renderCell: (params) => (
            <Box display="flex" alignItems="center" gap={1}>
              <DateIcon fontSize="small" color="action" />
              <Typography variant="body2">{params.formattedValue}</Typography>
            </Box>
          ),
        },
        {
          field: 'attendance',
          headerName: 'Attendance',
          flex: 0.6,
          minWidth: 100,
          type: 'number',
          align: 'center',
          headerAlign: 'center',
          renderCell: (params) => (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              gap={1}
            >
              <AttendanceIcon fontSize="small" color="primary" />
              <Typography variant="body2" fontWeight={500}>
                {params.value}
              </Typography>
            </Box>
          ),
        },
        {
          field: 'recordedByName',
          headerName: 'Recorded By',
          flex: 0.8,
          minWidth: 150,
          renderCell: (params) => (
            <Typography variant="body2" color="text.secondary">
              {params.value}
            </Typography>
          ),
        },
        {
          field: 'actions',
          type: 'actions',
          headerName: 'Actions',
          width: 80,
          getActions: (params) => [
            <GridActionsCellItem
              key="more"
              icon={<MoreIcon />}
              label="More actions"
              onClick={(event) => handleActionMenuOpen(event, params.row)}
              showInMenu={false}
            />,
          ],
        },
      ],
      [handleActionMenuOpen]
    );

    if (attendanceError) {
      return (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" color="error" gutterBottom>
            Error Loading Attendance Records
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {String(attendanceError)}
          </Typography>
        </Paper>
      );
    }

    return (
      <ErrorBoundary>
        <Stack spacing={3}>
          {/* Data Grid */}
          <Paper sx={{ height: '70vh', width: '100%' }}>
            <DataGrid
              rows={attendanceData}
              columns={columns}
              loading={isLoadingAttendance}
              pageSizeOptions={[10, 20, 50, 100]}
              disableColumnMenu
              paginationModel={
                onQueryChange
                  ? {
                      page: currentQuery.page - 1, // DataGrid uses 0-based, query uses 1-based
                      pageSize: currentQuery.pageSize,
                    }
                  : localPaginationModel
              }
              onPaginationModelChange={handlePaginationModelChange}
              sortModel={
                onQueryChange
                  ? [
                      {
                        field: currentQuery.sortBy,
                        sort: currentQuery.sortDirection,
                      },
                    ]
                  : localSortModel
              }
              onSortModelChange={handleSortModelChange}
              rowCount={totalCount}
              paginationMode={onQueryChange ? 'server' : 'client'}
              sortingMode={onQueryChange ? 'server' : 'client'}
              disableRowSelectionOnClick
              slots={{
                toolbar: GridToolbar,
              }}
              slotProps={{
                toolbar: {
                  showQuickFilter: false,
                },
              }}
              sx={{
                border: 0,
                '& .MuiDataGrid-main': {
                  borderRadius: 0,
                },
              }}
            />
          </Paper>

          {/* Action Menu */}
          <Menu
            anchorEl={actionMenuAnchorEl}
            open={Boolean(actionMenuAnchorEl)}
            onClose={handleActionMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem
              onClick={() => selectedRecord && handleViewRecord(selectedRecord)}
            >
              <ListItemIcon>
                <ViewIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>View Details</ListItemText>
            </MenuItem>

            {canRecordAttendance && (
              <>
                <MenuItem
                  onClick={() =>
                    selectedRecord && handleEditRecord(selectedRecord)
                  }
                >
                  <ListItemIcon>
                    <EditIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Edit Record</ListItemText>
                </MenuItem>

                <MenuItem
                  onClick={() =>
                    selectedRecord && handleDeleteRecord(selectedRecord)
                  }
                >
                  <ListItemIcon>
                    <DeleteIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Delete Record</ListItemText>
                </MenuItem>
              </>
            )}
          </Menu>

          {/* Confirmation Modal */}
          <ConfirmationModal
            open={confirmation.open}
            onClose={() =>
              setConfirmation((prev) => ({ ...prev, open: false }))
            }
            onConfirm={handleConfirmDelete}
            title="Delete Attendance Record"
            message={
              confirmation.record
                ? `Are you sure you want to delete the attendance record for "${confirmation.record.eventName}" on ${format(parseISO(confirmation.record.date), 'PPP')}?`
                : ''
            }
            confirmText="Delete"
            loading={confirmation.loading}
          />
        </Stack>
      </ErrorBoundary>
    );
  }
);

export default AttendanceGrid;
