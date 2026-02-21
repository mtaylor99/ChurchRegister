import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { DataGrid, GridActionsCellItem, GridToolbar } from '@mui/x-data-grid';
import type {
  GridColDef,
  GridPaginationModel,
  GridSortModel,
} from '@mui/x-data-grid';
import {
  Box,
  Paper,
  Chip,
  Stack,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Button,
  Menu,
  ListItemIcon,
  ListItemText,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as ViewIcon,
  Clear as ClearIcon,
  MoreVert as MoreIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { trainingCertificatesApi } from '../../services/api';
import type {
  TrainingCertificateDto,
  TrainingCertificateGridQuery,
} from '../../types/trainingCertificates';
import {
  TRAINING_CERTIFICATE_STATUSES,
  RAG_STATUS,
} from '../../types/trainingCertificates';

export interface TrainingCertificateGridProps {
  onEditCertificate?: (certificate: TrainingCertificateDto) => void;
  onViewCertificate?: (certificate: TrainingCertificateDto) => void;
  initialQuery?: Partial<TrainingCertificateGridQuery>;
  onFilterChange?: (showExpired: boolean) => void;
}

export const TrainingCertificateGrid: React.FC<
  TrainingCertificateGridProps
> = React.memo(({ onEditCertificate, onViewCertificate, initialQuery, onFilterChange }) => {
  // Action menu state
  const [actionMenuAnchorEl, setActionMenuAnchorEl] =
    useState<null | HTMLElement>(null);
  const [selectedCertificate, setSelectedCertificate] =
    useState<TrainingCertificateDto | null>(null);

  // Grid state
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: initialQuery?.page ? initialQuery.page - 1 : 0,
    pageSize: initialQuery?.pageSize || 20,
  });

  const [sortModel, setSortModel] = useState<GridSortModel>([
    {
      field: initialQuery?.sortBy || 'expires',
      sort: (initialQuery?.sortDirection || 'asc') as 'asc' | 'desc',
    },
  ]);

  const [searchTerm, setSearchTerm] = useState(initialQuery?.name || '');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    initialQuery?.status
  );
  const [typeFilter, setTypeFilter] = useState<number | undefined>(
    initialQuery?.typeId
  );
  const [showExpired, setShowExpired] = useState(false);

  const [searchQuery, setSearchQuery] =
    useState<TrainingCertificateGridQuery>({
      page: paginationModel.page + 1,
      pageSize: paginationModel.pageSize,
      name: initialQuery?.name,
      status: initialQuery?.status || (showExpired ? undefined : `!${TRAINING_CERTIFICATE_STATUSES.EXPIRED}`),
      typeId: initialQuery?.typeId,
      expiringWithinDays: 60, // Used for RAG status calculation (alert chips)
      sortBy: sortModel[0]?.field || 'expires',
      sortDirection: sortModel[0]?.sort || 'asc',
    });

  // Fetch training certificates data
  const { data: certificatesResponse, isLoading } = useQuery({
    queryKey: ['trainingCertificates', searchQuery],
    queryFn: () => trainingCertificatesApi.getTrainingCertificates(searchQuery),
    placeholderData: (previousData) => previousData,
  });

  // Fetch types for filtering
  const { data: types = [] } = useQuery({
    queryKey: ['trainingCertificateTypes'],
    queryFn: () => trainingCertificatesApi.getTrainingCertificateTypes(),
  });

  // Handle search with debounce
  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setSearchTerm(value);

      const timeoutId = setTimeout(() => {
        setSearchQuery((prev) => ({
          ...prev,
          name: value || undefined,
          page: 1,
        }));
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
      }, 500);

      return () => clearTimeout(timeoutId);
    },
    []
  );

  // Handle filter changes
  const handleFilterChange = useCallback(() => {
    // If statusFilter is set, use it; otherwise exclude expired when showExpired is false
    const effectiveStatus = statusFilter || (showExpired ? undefined : `!${TRAINING_CERTIFICATE_STATUSES.EXPIRED}`);
    
    setSearchQuery((prev) => ({
      ...prev,
      status: effectiveStatus,
      typeId: typeFilter,
      page: 1,
    }));
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
    
    // Notify parent of filter change
    onFilterChange?.(showExpired);
  }, [statusFilter, typeFilter, showExpired, onFilterChange]);

  // Apply filters when they change
  useEffect(() => {
    handleFilterChange();
  }, [handleFilterChange]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(
    () =>
      searchTerm ||
      statusFilter !== undefined ||
      typeFilter !== undefined ||
      showExpired,
    [searchTerm, statusFilter, typeFilter, showExpired]
  );

  // Clear all filters
  const handleClearAllFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter(undefined);
    setTypeFilter(undefined);
    setShowExpired(false);
    setSearchQuery((prev) => ({
      ...prev,
      name: undefined,
      status: `!${TRAINING_CERTIFICATE_STATUSES.EXPIRED}`,
      typeId: undefined,
      page: 1,
    }));
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
    onFilterChange?.(false);
  }, [onFilterChange]);

  // Handle action menu
  const handleActionMenuOpen = useCallback(
    (event: React.MouseEvent<HTMLElement>, certificate: TrainingCertificateDto) => {
      setActionMenuAnchorEl(event.currentTarget);
      setSelectedCertificate(certificate);
    },
    []
  );

  const handleActionMenuClose = useCallback(() => {
    setActionMenuAnchorEl(null);
    setSelectedCertificate(null);
  }, []);

  // Action handlers
  const handleEditCertificate = useCallback(
    (certificate: TrainingCertificateDto) => {
      handleActionMenuClose();
      onEditCertificate?.(certificate);
    },
    [onEditCertificate, handleActionMenuClose]
  );

  const handleViewCertificate = useCallback(
    (certificate: TrainingCertificateDto) => {
      handleActionMenuClose();
      onViewCertificate?.(certificate);
    },
    [onViewCertificate, handleActionMenuClose]
  );

  // Handle pagination changes
  const handlePaginationModelChange = useCallback(
    (model: GridPaginationModel) => {
      setPaginationModel(model);
      setSearchQuery((prev) => ({
        ...prev,
        page: model.page + 1,
        pageSize: model.pageSize,
      }));
    },
    []
  );

  // Handle sorting changes
  const handleSortModelChange = useCallback((model: GridSortModel) => {
    setSortModel(model);
    const sort = model[0];
    if (sort) {
      setSearchQuery((prev) => ({
        ...prev,
        sortBy: sort.field,
        sortDirection: sort.sort || 'asc',
      }));
    }
  }, []);

  // Column definitions
  const columns: GridColDef<TrainingCertificateDto>[] = useMemo(
    () => [
    {
      field: 'memberName',
      headerName: 'Member Name',
      flex: 1,
      minWidth: 180,
    },
    {
      field: 'trainingType',
      headerName: 'Training/Check Type',
      flex: 1,
      minWidth: 180,
    },
    {
      field: 'ragStatus',
      headerName: 'Alert',
      width: 100,
      renderCell: (params) => {
        if (params.value === RAG_STATUS.RED) {
          return (
            <Chip
              label="Expired"
              size="small"
              sx={{ bgcolor: '#f44336', color: 'white' }}
            />
          );
        }
        if (params.value === RAG_STATUS.AMBER) {
          return (
            <Chip
              label="Expiring"
              size="small"
              sx={{ bgcolor: '#ff9800', color: 'white' }}
            />
          );
        }
        return null;
      },
    },
    {
      field: 'expires',
      headerName: 'Expires',
      width: 120,
      valueFormatter: (value) =>
        value ? new Date(value).toLocaleDateString() : 'N/A',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={
            params.value === TRAINING_CERTIFICATE_STATUSES.IN_VALIDITY
              ? 'success'
              : params.value === TRAINING_CERTIFICATE_STATUSES.PENDING
                ? 'warning'
                : params.value === TRAINING_CERTIFICATE_STATUSES.EXPIRED
                  ? 'error'
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

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Search by Member Name"
              value={searchTerm}
              onChange={handleSearchChange}
              size="small"
              fullWidth
            />

            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Training Type</InputLabel>
              <Select
                value={typeFilter || ''}
                onChange={(e) => setTypeFilter(Number(e.target.value) || undefined)}
                label="Training Type"
              >
                <MenuItem value="">
                  <em>All</em>
                </MenuItem>
                {types.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter || ''}
                onChange={(e) => setStatusFilter(e.target.value || undefined)}
                label="Status"
              >
                <MenuItem value="">
                  <em>All</em>
                </MenuItem>
                <MenuItem value={TRAINING_CERTIFICATE_STATUSES.PENDING}>
                  Pending
                </MenuItem>
                <MenuItem value={TRAINING_CERTIFICATE_STATUSES.IN_VALIDITY}>
                  In Validity
                </MenuItem>
                <MenuItem value={TRAINING_CERTIFICATE_STATUSES.EXPIRED}>
                  Expired
                </MenuItem>
                <MenuItem value={TRAINING_CERTIFICATE_STATUSES.ALLOW_TO_EXPIRE}>
                  Allow to Expire
                </MenuItem>
              </Select>
            </FormControl>

            {/* Show Expired Toggle */}
            <FormControlLabel
              control={
                <Switch
                  checked={showExpired}
                  onChange={(e) => setShowExpired(e.target.checked)}
                  size="small"
                />
              }
              label="Show Expired"
              sx={{ ml: 1, whiteSpace: 'nowrap' }}
            />

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
          </Stack>
        </Stack>
      </Paper>

      {/* Grid */}
      <Paper sx={{ height: 600 }}>
        <DataGrid
          rows={certificatesResponse?.items || []}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[10, 20, 50, 100]}
          paginationModel={paginationModel}
          onPaginationModelChange={handlePaginationModelChange}
          sortModel={sortModel}
          onSortModelChange={handleSortModelChange}
          paginationMode="server"
          sortingMode="server"
          rowCount={certificatesResponse?.totalCount || 0}
          slots={{ toolbar: GridToolbar }}
          slotProps={{
            toolbar: {
              showQuickFilter: false,
            },
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
            selectedCertificate && handleViewCertificate(selectedCertificate)
          }
        >
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() =>
            selectedCertificate && handleEditCertificate(selectedCertificate)
          }
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Training/Check</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
});

TrainingCertificateGrid.displayName = 'TrainingCertificateGrid';
export default TrainingCertificateGrid;
