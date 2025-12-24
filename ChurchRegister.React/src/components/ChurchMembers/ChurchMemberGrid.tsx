import React, { useState, useCallback, useMemo } from 'react';
import { DataGrid, GridActionsCellItem, GridToolbar } from '@mui/x-data-grid';
import type {
  GridColDef,
  GridPaginationModel,
  GridSortModel,
  GridRowParams,
} from '@mui/x-data-grid';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Stack,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  MoreVert as MoreIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { churchMembersApi } from '../../services/api/churchMembersApi';
import type {
  ChurchMemberDto,
  ChurchMemberDetailDto,
  ChurchMemberGridQuery,
} from '../../types/churchMembers';
import { getChurchMemberStatusConfig } from '../../types/churchMembers';

export interface ChurchMemberGridProps {
  onEditMember?: (member: ChurchMemberDetailDto) => void;
  onViewMember?: (member: ChurchMemberDetailDto) => void;
  initialQuery?: Partial<ChurchMemberGridQuery>;
}

export const ChurchMemberGrid: React.FC<ChurchMemberGridProps> = React.memo(({
  onEditMember,
  onViewMember,
  initialQuery,
}) => {
  // Grid state
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: initialQuery?.page ? initialQuery.page - 1 : 0,
    pageSize: initialQuery?.pageSize || 20,
  });

  const [sortModel, setSortModel] = useState<GridSortModel>([
    {
      field: initialQuery?.sortBy || 'firstName',
      sort: (initialQuery?.sortDirection || 'asc') as 'asc' | 'desc',
    },
  ]);

  const [searchTerm, setSearchTerm] = useState(initialQuery?.searchTerm || '');
  const [statusFilter, setStatusFilter] = useState<number | undefined>(
    initialQuery?.statusFilter
  );
  const [roleFilter, setRoleFilter] = useState<number | undefined>(
    initialQuery?.roleFilter
  );
  const [baptisedFilter, setBaptisedFilter] = useState<boolean | undefined>(
    initialQuery?.baptisedFilter
  );
  const [giftAidFilter, setGiftAidFilter] = useState<boolean | undefined>(
    initialQuery?.giftAidFilter
  );

  // Action menu state
  const [actionMenuAnchorEl, setActionMenuAnchorEl] =
    useState<null | HTMLElement>(null);
  const [selectedMember, setSelectedMember] = useState<ChurchMemberDto | null>(
    null
  );

  const [searchQuery, setSearchQuery] = useState<ChurchMemberGridQuery>({
    page: paginationModel.page + 1,
    pageSize: paginationModel.pageSize,
    searchTerm: initialQuery?.searchTerm,
    statusFilter: initialQuery?.statusFilter,
    roleFilter: initialQuery?.roleFilter,
    baptisedFilter: initialQuery?.baptisedFilter,
    giftAidFilter: initialQuery?.giftAidFilter,
    sortBy: sortModel[0]?.field || 'firstName',
    sortDirection: sortModel[0]?.sort || 'asc',
  });

  // Fetch church members data
  const { data: membersResponse, isLoading: isLoadingMembers } = useQuery({
    queryKey: ['churchMembers', searchQuery],
    queryFn: () => churchMembersApi.getChurchMembers(searchQuery),
    placeholderData: (previousData) => previousData,
  });

  // Fetch roles for filtering
  const { data: roles = [] } = useQuery({
    queryKey: ['churchMemberRoles'],
    queryFn: () => churchMembersApi.getRoles(),
  });

  // Fetch statuses for filtering
  const { data: statuses = [] } = useQuery({
    queryKey: ['churchMemberStatuses'],
    queryFn: () => churchMembersApi.getStatuses(),
  });

  // Handle search with debounce
  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setSearchTerm(value);

      // Debounce search
      const timeoutId = setTimeout(() => {
        setSearchQuery((prev) => ({
          ...prev,
          searchTerm: value || undefined,
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
    setSearchQuery((prev) => ({
      ...prev,
      statusFilter,
      roleFilter,
      baptisedFilter,
      giftAidFilter,
      page: 1,
    }));
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, [statusFilter, roleFilter, baptisedFilter, giftAidFilter]);

  // Apply filters when they change
  React.useEffect(() => {
    handleFilterChange();
  }, [handleFilterChange]);

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

  // Handle action menu
  const handleActionMenuOpen = useCallback(
    (event: React.MouseEvent<HTMLElement>, member: ChurchMemberDto) => {
      setActionMenuAnchorEl(event.currentTarget);
      setSelectedMember(member);
    },
    []
  );

  const handleActionMenuClose = useCallback(() => {
    setActionMenuAnchorEl(null);
    setSelectedMember(null);
  }, []);

  // Handle view member
  const handleViewMember = useCallback(
    async (member: ChurchMemberDto) => {
      handleActionMenuClose();
      // Fetch full details
      const details = await churchMembersApi.getChurchMemberById(member.id);
      onViewMember?.(details);
    },
    [onViewMember, handleActionMenuClose]
  );

  // Handle edit member
  const handleEditMember = useCallback(
    async (member: ChurchMemberDto) => {
      handleActionMenuClose();
      // Fetch full details
      const details = await churchMembersApi.getChurchMemberById(member.id);
      onEditMember?.(details);
    },
    [onEditMember, handleActionMenuClose]
  );

  // Define grid columns
  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: 'fullName',
        headerName: 'Name',
        flex: 1,
        minWidth: 200,
        renderCell: (params) => (
          <Box>
            <Typography variant="body2" fontWeight={500}>
              {params.row.fullName}
            </Typography>
          </Box>
        ),
      },
      {
        field: 'memberNumber',
        headerName: 'Member Number',
        width: 130,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => (
          <Typography variant="body2">
            {params.row.memberNumber || '-'}
          </Typography>
        ),
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 120,
        renderCell: (params) => {
          const config = getChurchMemberStatusConfig(params.row.status);
          return (
            <Chip label={config.label} size="small" color={config.color} />
          );
        },
      },
      {
        field: 'roles',
        headerName: 'Roles',
        width: 200,
        sortable: false,
        renderCell: (params) => (
          <Stack
            direction="row"
            spacing={0.5}
            sx={{ flexWrap: 'wrap', gap: 0.5 }}
          >
            {params.row.roles.slice(0, 2).map((role: string) => (
              <Chip key={role} label={role} size="small" variant="outlined" />
            ))}
            {params.row.roles.length > 2 && (
              <Chip
                label={`+${params.row.roles.length - 2}`}
                size="small"
                variant="outlined"
              />
            )}
          </Stack>
        ),
      },
      {
        field: 'contact',
        headerName: 'Contact',
        width: 200,
        sortable: false,
        renderCell: (params) => (
          <Box>
            <Typography variant="body2">{params.row.email || '-'}</Typography>
            <Typography variant="caption" color="text.secondary">
              {params.row.phone || '-'}
            </Typography>
          </Box>
        ),
      },
      {
        field: 'memberSince',
        headerName: 'Member Since',
        width: 130,
        renderCell: (params) => (
          <Typography variant="body2">
            {params.row.memberSince
              ? new Date(params.row.memberSince).toLocaleDateString()
              : '-'}
          </Typography>
        ),
      },
      {
        field: 'baptised',
        headerName: 'Baptised',
        width: 100,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) =>
          params.row.baptised ? (
            <CheckCircleIcon color="success" fontSize="small" />
          ) : (
            <CancelIcon color="disabled" fontSize="small" />
          ),
      },
      {
        field: 'giftAid',
        headerName: 'Gift Aid',
        width: 100,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) =>
          params.row.giftAid ? (
            <CheckCircleIcon color="success" fontSize="small" />
          ) : (
            <CancelIcon color="disabled" fontSize="small" />
          ),
      },
      {
        field: 'actions',
        type: 'actions',
        headerName: 'Actions',
        width: 80,
        getActions: (params: GridRowParams) => [
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
    <Paper elevation={2} sx={{ width: '100%', height: 700 }}>
      {/* Search and Filters */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          {/* Search Bar */}
          <TextField
            fullWidth
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={handleSearchChange}
            size="small"
            sx={{ minWidth: { md: 300 } }}
          />

          {/* Filters */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter || ''}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
              label="Status"
            >
              <MenuItem value="">All</MenuItem>
              {statuses.map((status) => (
                <MenuItem key={status.id} value={status.id}>
                  {status.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={roleFilter || ''}
              onChange={(e) =>
                setRoleFilter(
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
              label="Role"
            >
              <MenuItem value="">All</MenuItem>
              {roles.map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  {role.type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Baptised</InputLabel>
            <Select
              value={baptisedFilter === undefined ? '' : String(baptisedFilter)}
              onChange={(e) =>
                setBaptisedFilter(
                  e.target.value === '' ? undefined : e.target.value === 'true'
                )
              }
              label="Baptised"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="true">Yes</MenuItem>
              <MenuItem value="false">No</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Gift Aid</InputLabel>
            <Select
              value={giftAidFilter === undefined ? '' : String(giftAidFilter)}
              onChange={(e) =>
                setGiftAidFilter(
                  e.target.value === '' ? undefined : e.target.value === 'true'
                )
              }
              label="Gift Aid"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="true">Yes</MenuItem>
              <MenuItem value="false">No</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Box>

      {/* Data Grid */}
      <DataGrid
        rows={membersResponse?.items || []}
        columns={columns}
        loading={isLoadingMembers}
        rowHeight={58}
        paginationModel={paginationModel}
        onPaginationModelChange={handlePaginationModelChange}
        sortModel={sortModel}
        onSortModelChange={handleSortModelChange}
        pageSizeOptions={[10, 20, 50, 100]}
        rowCount={membersResponse?.totalCount || 0}
        paginationMode="server"
        sortingMode="server"
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
          border: 'none',
          '& .MuiDataGrid-cell:focus': {
            outline: 'none',
          },
          '& .MuiDataGrid-columnHeader:focus': {
            outline: 'none',
          },
        }}
      />

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchorEl}
        open={Boolean(actionMenuAnchorEl)}
        onClose={handleActionMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem
          onClick={() => selectedMember && handleViewMember(selectedMember)}
        >
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() => selectedMember && handleEditMember(selectedMember)}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Member</ListItemText>
        </MenuItem>
      </Menu>
    </Paper>
  );
});

export default ChurchMemberGrid;
