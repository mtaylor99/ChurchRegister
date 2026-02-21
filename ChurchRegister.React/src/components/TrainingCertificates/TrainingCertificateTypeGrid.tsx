import React, { useState, useMemo, useCallback } from 'react';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import {
  Box,
  Paper,
  Chip,
  Stack,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  TextField,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { Edit as EditIcon, Close as CloseIcon, Clear as ClearIcon, MoreVert as MoreIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { trainingCertificatesApi } from '../../services/api';
import type { TrainingCertificateTypeDto } from '../../types/trainingCertificates';
import { TRAINING_TYPE_STATUSES } from '../../types/trainingCertificates';
import { TrainingCertificateTypeForm } from './TrainingCertificateTypeForm';

export interface TrainingCertificateTypeGridProps {
  onTypeUpdated?: () => void;
}

export const TrainingCertificateTypeGrid: React.FC<
  TrainingCertificateTypeGridProps
> = React.memo(({ onTypeUpdated }) => {
  // Action menu state
  const [actionMenuAnchorEl, setActionMenuAnchorEl] =
    useState<null | HTMLElement>(null);
  const [selectedTypeForMenu, setSelectedTypeForMenu] =
    useState<TrainingCertificateTypeDto | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [nameFilter, setNameFilter] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [selectedType, setSelectedType] =
    useState<TrainingCertificateTypeDto | null>(null);

  // Fetch training types
  const { data: types = [], refetch } = useQuery({
    queryKey: ['trainingCertificateTypes', statusFilter],
    queryFn: () =>
      trainingCertificatesApi.getTrainingCertificateTypes(
        statusFilter || undefined
      ),
  });

  const handleAddType = () => {
    setSelectedType(null);
    setDialogMode('add');
    setDialogOpen(true);
  };

  const handleEditType = (type: TrainingCertificateTypeDto) => {
    setSelectedType(type);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedType(null);
  };

  const handleSuccess = () => {
    refetch();
    onTypeUpdated?.();
    handleDialogClose();
  };

  // Handle action menu
  const handleActionMenuOpen = useCallback(
    (event: React.MouseEvent<HTMLElement>, type: TrainingCertificateTypeDto) => {
      setActionMenuAnchorEl(event.currentTarget);
      setSelectedTypeForMenu(type);
    },
    []
  );

  const handleActionMenuClose = useCallback(() => {
    setActionMenuAnchorEl(null);
    setSelectedTypeForMenu(null);
  }, []);

  const handleEditFromMenu = useCallback(
    (type: TrainingCertificateTypeDto) => {
      handleActionMenuClose();
      handleEditType(type);
    },
    [handleActionMenuClose]
  );

  // Check if any filters are active
  const hasActiveFilters = useMemo(
    () => nameFilter || statusFilter,
    [nameFilter, statusFilter]
  );

  // Clear all filters
  const handleClearAllFilters = useCallback(() => {
    setNameFilter('');
    setStatusFilter('');
  }, []);

  // Column definitions
  const columns: GridColDef<TrainingCertificateTypeDto>[] = useMemo(
    () => [
    {
      field: 'type',
      headerName: 'Training/Check Type',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 2,
      minWidth: 300,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={
            params.value === TRAINING_TYPE_STATUSES.ACTIVE
              ? 'success'
              : 'default'
          }
        />
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

  // Filter types by name locally
  const filteredTypes = types.filter((type) => {
    const matchesName = nameFilter
      ? type.type.toLowerCase().includes(nameFilter.toLowerCase())
      : true;
    return matchesName;
  });

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            label="Search by Name"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            size="small"
            fullWidth
            placeholder="Filter types..."
          />

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Status Filter</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Status Filter"
            >
              <MenuItem value="">
                <em>All</em>
              </MenuItem>
              <MenuItem value={TRAINING_TYPE_STATUSES.ACTIVE}>Active</MenuItem>
              <MenuItem value={TRAINING_TYPE_STATUSES.INACTIVE}>
                InActive
              </MenuItem>
            </Select>
          </FormControl>

          {/* Clear All Button */}
          {hasActiveFilters && (
            <Button
              variant="outlined"
              onClick={handleClearAllFilters}
              startIcon={<ClearIcon />}
              size="small"
              sx={{ minWidth: 'fit-content', whiteSpace: 'nowrap' }}
            >
              Clear All
            </Button>
          )}

          {/* Add New Type Button */}
          <Button 
            variant="contained" 
            onClick={handleAddType}
            sx={{ minWidth: 'fit-content', whiteSpace: 'nowrap' }}
          >
            Add New Type
          </Button>
        </Stack>
      </Paper>

      {/* Grid */}
      <Paper sx={{ height: 500 }}>
        <DataGrid
          rows={filteredTypes}
          columns={columns}
          pageSizeOptions={[10, 20, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 20 } },
          }}
          disableRowSelectionOnClick
          sx={{
            '& .MuiDataGrid-row': {
              cursor: 'pointer',
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
          onClick={() =>
            selectedTypeForMenu && handleEditFromMenu(selectedTypeForMenu)
          }
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Training/Check Type</ListItemText>
        </MenuItem>
      </Menu>

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            {dialogMode === 'add'
              ? 'Add New Training/Check Type'
              : 'Edit Training/Check Type'}
            <IconButton onClick={handleDialogClose} edge="end">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TrainingCertificateTypeForm
              type={selectedType}
              mode={dialogMode}
              onSuccess={handleSuccess}
              onCancel={handleDialogClose}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
});

TrainingCertificateTypeGrid.displayName = 'TrainingCertificateTypeGrid';
export default TrainingCertificateTypeGrid;
