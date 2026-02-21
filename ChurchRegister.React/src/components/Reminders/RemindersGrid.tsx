import { useState } from 'react';
import {
  Box,
  Chip,
  Tooltip,
  CircularProgress,
  Alert,
  Typography,
  Stack,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Checkbox,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  DataGrid,
  GridActionsCellItem,
} from '@mui/x-data-grid';
import type { GridColDef, GridRowParams } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import { useReminders, useDeleteReminder } from '../../hooks/useReminders';
import { useReminderCategories } from '../../hooks/useReminderCategories';
import type { Reminder } from '../../types/reminders';
import { format } from 'date-fns';

interface RemindersGridProps {
  onEditClick: (reminder: Reminder) => void;
  onCompleteClick: (reminder: Reminder) => void;
}

export function RemindersGrid({ onEditClick, onCompleteClick }: RemindersGridProps) {
  // Filter state
  const [status, setStatus] = useState<string>('');
  const [assignedToUserId, setAssignedToUserId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [description, setDescription] = useState<string>('');
  const [showCompleted, setShowCompleted] = useState<boolean>(false);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reminderToDelete, setReminderToDelete] = useState<Reminder | null>(null);

  // Fetch data
  const { data: reminders, isPending, isError } = useReminders({
    status: status || undefined,
    assignedToUserId: assignedToUserId || undefined,
    categoryId: categoryId || undefined,
    description: description || undefined,
    showCompleted: showCompleted,
  });

  // Debug logging
  console.log('RemindersGrid - Query params:', {
    status: status || undefined,
    assignedToUserId: assignedToUserId || undefined,
    categoryId: categoryId || undefined,
    description: description || undefined,
    showCompleted,
  });
  console.log('RemindersGrid - Reminders data:', reminders);
  console.log('RemindersGrid - isPending:', isPending, 'isError:', isError);

  const { data: categories } = useReminderCategories();
  const deleteMutation = useDeleteReminder();

  const handleClearFilters = () => {
    setStatus('');
    setAssignedToUserId('');
    setCategoryId(null);
    setDescription('');
    setShowCompleted(false);
  };

  // Check if any filters are active
  const hasActiveFilters = 
    status !== '' || 
    assignedToUserId !== '' || 
    categoryId !== null || 
    description !== '' || 
    showCompleted;

  const handleDeleteClick = (reminder: Reminder) => {
    setReminderToDelete(reminder);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (reminderToDelete) {
      deleteMutation.mutate(reminderToDelete.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setReminderToDelete(null);
        },
      });
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setReminderToDelete(null);
  };

  const columns: GridColDef[] = [
    {
      field: 'description',
      headerName: 'Description',
      flex: 2,
      minWidth: 200,
    },
    {
      field: 'dueDate',
      headerName: 'Due Date',
      width: 120,
      valueFormatter: (value) => {
        return value ? format(new Date(value), 'dd/MM/yyyy') : '';
      },
    },
    {
      field: 'alertStatus',
      headerName: 'Alert',
      width: 80,
      align: 'center',
      renderCell: (params) => {
        const alertStatus = params.row.alertStatus;
        if (alertStatus === 'red') {
          return (
            <Tooltip title="Due within 30 days">
              <ErrorIcon sx={{ color: '#f44336' }} />
            </Tooltip>
          );
        } else if (alertStatus === 'amber') {
          return (
            <Tooltip title="Due within 60 days">
              <WarningIcon sx={{ color: '#ff9800' }} />
            </Tooltip>
          );
        }
        return null;
      },
    },
    {
      field: 'assignedToUserName',
      headerName: 'Assigned To',
      width: 150,
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 150,
      renderCell: (params) => {
        const categoryName = params.row.categoryName || 'None';
        const categoryColor = params.row.categoryColorHex || '#9e9e9e';
        return (
          <Chip
            label={categoryName}
            size="small"
            sx={{
              backgroundColor: categoryColor,
              color: '#fff',
              fontWeight: 500,
            }}
          />
        );
      },
    },
    {
      field: 'priority',
      headerName: 'Priority',
      width: 90,
      align: 'center',
      renderCell: (params) => {
        return params.row.priority ? (
          <StarIcon sx={{ color: '#ff9800' }} />
        ) : null;
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => {
        const status = params.row.status;
        return (
          <Chip
            label={status}
            size="small"
            color={status === 'Completed' ? 'success' : 'default'}
          />
        );
      },
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 80,
      getActions: (params: GridRowParams) => {
        const isPending = params.row.status === 'Pending';
        
        if (!isPending) {
          return [];
        }
        
        return [
          <GridActionsCellItem
            key="edit"
            icon={<EditIcon />}
            label="Edit"
            onClick={() => onEditClick(params.row)}
            showInMenu
          />,
          <GridActionsCellItem
            key="complete"
            icon={<CheckCircleIcon />}
            label="Complete"
            onClick={() => onCompleteClick(params.row)}
            showInMenu
          />,
          <GridActionsCellItem
            key="delete"
            icon={<DeleteIcon />}
            label="Delete"
            onClick={() => handleDeleteClick(params.row)}
            showInMenu
          />,
        ];
      },
    },
  ];

  if (isPending) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Failed to load reminders. Please try again.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Filter Bar */}
      <Box sx={{ mb: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
        <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
          <TextField
            label="Search Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
          />

          <FormControl sx={{ minWidth: 200 }} size="small">
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryId === null ? '' : categoryId}
              onChange={(e) => setCategoryId(typeof e.target.value === 'string' && e.target.value === '' ? null : Number(e.target.value))}
              label="Category"
            >
              <MenuItem value="" sx={{ fontStyle: 'italic' }}>All</MenuItem>
              {categories?.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        backgroundColor: cat.colorHex || '#9e9e9e',
                      }}
                    />
                    <span>{cat.name}</span>
                  </Stack>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 150 }} size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              label="Status"
            >
              <MenuItem value="" sx={{ fontStyle: 'italic' }}>All</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
              <MenuItem value="Overdue">Overdue</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Checkbox
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
              />
            }
            label="Show Completed"
          />

          {hasActiveFilters && (
            <Button variant="outlined" size="small" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          )}
        </Stack>
      </Box>

      {/* Data Grid */}
      {reminders && reminders.length === 0 ? (
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          No reminders found
        </Typography>
      ) : (
        <DataGrid
          rows={reminders || []}
          columns={columns}
          autoHeight
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          disableRowSelectionOnClick
          sx={{
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCancelDelete}>
        <DialogTitle>Delete Reminder</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this reminder? This action cannot be undone.
          </DialogContentText>
          {reminderToDelete && (
            <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="body2" fontWeight="bold">
                {reminderToDelete.description}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Due: {format(new Date(reminderToDelete.dueDate), 'dd/MM/yyyy')}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
