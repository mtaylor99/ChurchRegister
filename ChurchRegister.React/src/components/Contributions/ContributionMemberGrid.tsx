import React, { useState, useCallback, useMemo } from 'react';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import type {
  GridColDef,
  GridPaginationModel,
  GridSortModel,
} from '@mui/x-data-grid';
import {
  Box,
  Paper,
  Typography,
  Chip,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  type SelectChangeEvent,
  Menu,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { contributionsApi } from '../../services/api/contributionsApi';
import { churchMembersApi } from '../../services/api/churchMembersApi';
import type {
  ContributionMemberDto,
  ContributionMemberGridProps,
  ContributionGridQuery,
} from '../../types/contributions';
import type { ChurchMemberStatusDto } from '../../types/churchMembers';

/**
 * Contribution Member Grid Component
 * Displays church members with contribution-focused columns:
 * - Name, Status, Member Number, This Year's Contribution
 */
export const ContributionMemberGrid: React.FC<ContributionMemberGridProps> = React.memo(({
  onViewContributions,
  initialQuery,
}) => {
  // Grid state
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: initialQuery?.page ? initialQuery.page - 1 : 0,
    pageSize: initialQuery?.pageSize || 20,
  });

  const [sortModel, setSortModel] = useState<GridSortModel>([
    {
      field: initialQuery?.sortBy || 'thisYearsContribution',
      sort: (initialQuery?.sortDirection || 'desc') as 'asc' | 'desc',
    },
  ]);

  const [searchTerm, setSearchTerm] = useState(initialQuery?.searchTerm || '');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [statusFilter, setStatusFilter] = useState<number | undefined>(
    initialQuery?.statusFilter
  );

  // Action menu state
  const [actionMenuAnchorEl, setActionMenuAnchorEl] =
    useState<null | HTMLElement>(null);
  const [selectedMember, setSelectedMember] =
    useState<ContributionMemberDto | null>(null);

  // Debounce search term
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Build query
  const searchQuery: ContributionGridQuery = useMemo(
    () => ({
      page: paginationModel.page + 1,
      pageSize: paginationModel.pageSize,
      searchTerm: debouncedSearchTerm,
      statusFilter,
      sortBy: sortModel[0]?.field || 'thisYearsContribution',
      sortDirection: sortModel[0]?.sort || 'desc',
    }),
    [
      paginationModel.page,
      paginationModel.pageSize,
      debouncedSearchTerm,
      statusFilter,
      sortModel,
    ]
  );

  // Fetch contribution members
  const {
    data: membersData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['contribution-members', searchQuery],
    queryFn: () => contributionsApi.getContributionMembers(searchQuery),
    placeholderData: (previousData) => previousData,
  });

  // Fetch statuses for filter dropdown (static data - cache for 1 hour)
  const { data: statuses } = useQuery({
    queryKey: ['church-member-statuses'],
    queryFn: () => churchMembersApi.getStatuses(),
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
  });

  // Event handlers
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPaginationModel((prev) => ({ ...prev, page: 0 })); // Reset to first page
  };

  const handleStatusFilterChange = (
    event: SelectChangeEvent<number | string>
  ) => {
    const value = event.target.value;
    setStatusFilter(value === '' ? undefined : Number(value));
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  const handlePaginationModelChange = useCallback(
    (model: GridPaginationModel) => {
      setPaginationModel(model);
    },
    []
  );

  const handleSortModelChange = useCallback((model: GridSortModel) => {
    setSortModel(model);
  }, []);

  const handleActionMenuOpen = useCallback(
    (event: React.MouseEvent<HTMLElement>, member: ContributionMemberDto) => {
      event.stopPropagation();
      setActionMenuAnchorEl(event.currentTarget);
      setSelectedMember(member);
    },
    []
  );

  const handleActionMenuClose = useCallback(() => {
    setActionMenuAnchorEl(null);
    setSelectedMember(null);
  }, []);

  const handleViewContributions = useCallback(() => {
    if (selectedMember) {
      onViewContributions(selectedMember);
    }
    handleActionMenuClose();
  }, [selectedMember, onViewContributions, handleActionMenuClose]);

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Define columns
  const columns: GridColDef<ContributionMemberDto>[] = useMemo(
    () => [
      {
        field: 'fullName',
        headerName: 'Name',
        width: 250,
        sortable: true,
        valueGetter: (_value, row) =>
          row.fullName || `${row.firstName} ${row.lastName}`,
      },
      {
        field: 'statusName',
        headerName: 'Status',
        width: 150,
        sortable: true,
        renderCell: (params) => (
          <Chip
            label={params.row.statusName}
            size="small"
            color={
              params.row.statusColor as
                | 'success'
                | 'default'
                | 'warning'
                | 'info'
            }
          />
        ),
      },
      {
        field: 'envelopeNumber',
        headerName: 'Member Number',
        width: 180,
        sortable: true,
        valueFormatter: (value) => value || 'N/A',
      },
      {
        field: 'thisYearsContribution',
        headerName: "This Year's Contribution",
        width: 200,
        sortable: true,
        renderCell: (params) => (
          <Typography variant="body2" fontWeight="medium">
            {formatCurrency(params.row.thisYearsContribution)}
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
            key="menu"
            icon={<MoreIcon />}
            label="Actions"
            onClick={(event: React.MouseEvent<HTMLButtonElement>) =>
              handleActionMenuOpen(event, params.row)
            }
          />,
        ],
      },
    ],
    [handleActionMenuOpen]
  );

  // Render loading state
  if (isLoading && !membersData) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
          Loading contribution data...
        </Typography>
      </Box>
    );
  }

  // Render error state
  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Error loading contribution data. Please try again.
      </Alert>
    );
  }

  // Render empty state
  if (!membersData || membersData.items.length === 0) {
    return (
      <Paper sx={{ p: 4, mt: 2, textAlign: 'center' }}>
        <SearchIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          No members found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Try adjusting your search or filters
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Filters */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          mb: 2,
          flexWrap: 'wrap',
        }}
      >
        <TextField
          label="Search by name or member number"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{ minWidth: 300, flexGrow: 1 }}
          InputProps={{
            startAdornment: (
              <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
            ),
          }}
        />

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter ?? ''}
            onChange={handleStatusFilterChange}
            label="Status"
          >
            <MenuItem value="">All Statuses</MenuItem>
            {statuses?.map((status: ChurchMemberStatusDto) => (
              <MenuItem key={status.id} value={status.id}>
                {status.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* DataGrid */}
      <Paper>
        <DataGrid
          rows={membersData?.items || []}
          columns={columns}
          pageSizeOptions={[10, 20, 50, 100]}
          paginationModel={paginationModel}
          onPaginationModelChange={handlePaginationModelChange}
          sortModel={sortModel}
          onSortModelChange={handleSortModelChange}
          rowCount={membersData?.totalCount || 0}
          paginationMode="server"
          sortingMode="server"
          loading={isLoading}
          disableRowSelectionOnClick
          autoHeight
          sx={{
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
            '& .MuiDataGrid-row:hover': {
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
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleViewContributions}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Contributions</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
});

export default ContributionMemberGrid;
