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
  Button,
  Menu,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  MoreVert as MoreIcon,
  Clear as ClearIcon,
  Warning as WarningIcon,
  Block as BlockIcon,
  Security as SecurityIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { churchMembersApi } from '../../services/api/churchMembersApi';
import type {
  ChurchMemberDto,
  ChurchMemberDetailDto,
  ChurchMemberGridQuery,
} from '../../types/churchMembers';
import type { DataProtectionSummary } from '../../types/dataProtection';
import { getChurchMemberStatusConfig } from '../../types/churchMembers';
import { ManageDataProtectionDrawer } from './ManageDataProtectionDrawer';
import { AssignDistrictDrawer } from './AssignDistrictDrawer';
import { useRBAC } from '../../hooks/useRBAC';
import { useDistricts } from '../../hooks/useDistricts';
import { PERMISSIONS } from '../../utils/rbac';

/**
 * Helper function to render data protection tooltip content
 */
const renderDataProtectionTooltip = (
  dataProtection: DataProtectionSummary
): React.ReactNode => {
  return (
    <Box sx={{ p: 1 }}>
      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
        GDPR Consent
      </Typography>
      <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
        {dataProtection.allowNameInCommunications ? '✓' : '✗'} Name in
        Communications
      </Typography>
      <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
        {dataProtection.allowHealthStatusInCommunications ? '✓' : '✗'} Health
        Status Mentions
      </Typography>
      <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
        {dataProtection.allowPhotoInCommunications ? '✓' : '✗'} Photo in Print
      </Typography>
      <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
        {dataProtection.allowPhotoInSocialMedia ? '✓' : '✗'} Photo on Social
        Media
      </Typography>
      <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
        {dataProtection.groupPhotos ? '✓' : '✗'} Group Photos
      </Typography>
      <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
        {dataProtection.permissionForMyChildren ? '✓' : '✗'} Permission for
        Children
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Last modified: {new Date(dataProtection.modifiedDateTime).toLocaleString()}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        Modified by: {dataProtection.modifiedBy}
      </Typography>
    </Box>
  );
};

/**
 * Helper function to get data protection icon, color, and tooltip
 */
const getDataProtectionIcon = (
  dataProtection: DataProtectionSummary | null | undefined
): {
  icon: React.ReactNode;
  color: string;
  tooltip: React.ReactNode;
} => {
  if (!dataProtection) {
    return {
      icon: <BlockIcon fontSize="small" />,
      color: 'grey',
      tooltip: 'No data protection record',
    };
  }

  // Count granted permissions
  const permissions = [
    dataProtection.allowNameInCommunications,
    dataProtection.allowHealthStatusInCommunications,
    dataProtection.allowPhotoInCommunications,
    dataProtection.allowPhotoInSocialMedia,
    dataProtection.groupPhotos,
    dataProtection.permissionForMyChildren,
  ];
  const grantedCount = permissions.filter((p) => p).length;

  // All permissions granted
  if (grantedCount === 6) {
    return {
      icon: <CheckCircleIcon fontSize="small" />,
      color: 'success.main',
      tooltip: renderDataProtectionTooltip(dataProtection),
    };
  }

  // No permissions granted
  if (grantedCount === 0) {
    return {
      icon: <CancelIcon fontSize="small" />,
      color: 'grey',
      tooltip: renderDataProtectionTooltip(dataProtection),
    };
  }

  // Partial permissions (1-5 granted)
  return {
    icon: <WarningIcon fontSize="small" />,
    color: 'warning.main',
    tooltip: renderDataProtectionTooltip(dataProtection),
  };
};

export interface ChurchMemberGridProps {
  onEditMember?: (member: ChurchMemberDetailDto) => void;
  onViewMember?: (member: ChurchMemberDetailDto) => void;
  initialQuery?: Partial<ChurchMemberGridQuery>;
}

export const ChurchMemberGrid: React.FC<ChurchMemberGridProps> = React.memo(
  ({ onEditMember, onViewMember, initialQuery }) => {
    const queryClient = useQueryClient();
    
    // RBAC
    const { hasPermission } = useRBAC();
    const canManageChurchMembers = hasPermission(
      PERMISSIONS.CHURCH_MEMBERS_EDIT
    );

    // Grid state
    const [paginationModel, setPaginationModel] = useState<GridPaginationModel>(
      {
        page: initialQuery?.page ? initialQuery.page - 1 : 0,
        pageSize: initialQuery?.pageSize || 20,
      }
    );

    const [sortModel, setSortModel] = useState<GridSortModel>([
      {
        field: initialQuery?.sortBy || 'firstName',
        sort: (initialQuery?.sortDirection || 'asc') as 'asc' | 'desc',
      },
    ]);

    const [searchTerm, setSearchTerm] = useState(
      initialQuery?.searchTerm || ''
    );
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
    const [districtFilter, setDistrictFilter] = useState<number | undefined>(
      initialQuery?.districtFilter
    );
    const [unassignedDistrictFilter, setUnassignedDistrictFilter] = useState<boolean | undefined>(
      initialQuery?.unassignedDistrictFilter
    );
    const [pastoralCareFilter, setPastoralCareFilter] = useState<boolean | undefined>(
      initialQuery?.pastoralCareRequired
    );

    // Action menu state
    const [actionMenuAnchorEl, setActionMenuAnchorEl] =
      useState<null | HTMLElement>(null);
    const [selectedMember, setSelectedMember] =
      useState<ChurchMemberDto | null>(null);

    // Data protection drawer state
    const [dataProtectionDrawer, setDataProtectionDrawer] = useState<{
      open: boolean;
      member: ChurchMemberDetailDto | null;
    }>({ open: false, member: null });

    // Assign district drawer state
    const [assignDistrictDrawer, setAssignDistrictDrawer] = useState<{
      open: boolean;
      member: ChurchMemberDetailDto | null;
    }>({ open: false, member: null });

    const [searchQuery, setSearchQuery] = useState<ChurchMemberGridQuery>({
      page: paginationModel.page + 1,
      pageSize: paginationModel.pageSize,
      searchTerm: initialQuery?.searchTerm,
      statusFilter: initialQuery?.statusFilter,
      roleFilter: initialQuery?.roleFilter,
      baptisedFilter: initialQuery?.baptisedFilter,
      giftAidFilter: initialQuery?.giftAidFilter,
      districtFilter: initialQuery?.districtFilter,
      unassignedDistrictFilter: initialQuery?.unassignedDistrictFilter,
      pastoralCareRequired: initialQuery?.pastoralCareRequired,
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

    // Fetch districts for filtering
    const { data: districts = [] } = useDistricts();

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
        districtFilter,
        unassignedDistrictFilter,
        pastoralCareRequired: pastoralCareFilter,
        page: 1,
      }));
      setPaginationModel((prev) => ({ ...prev, page: 0 }));
    }, [statusFilter, roleFilter, baptisedFilter, giftAidFilter, districtFilter, unassignedDistrictFilter, pastoralCareFilter]);

    // Apply filters when they change
    React.useEffect(() => {
      handleFilterChange();
    }, [handleFilterChange]);

    // Clear all filters
    const handleClearAllFilters = useCallback(() => {
      setSearchTerm('');
      setStatusFilter(undefined);
      setRoleFilter(undefined);
      setBaptisedFilter(undefined);
      setGiftAidFilter(undefined);
      setDistrictFilter(undefined);
      setUnassignedDistrictFilter(undefined);
      setPastoralCareFilter(undefined);
      setSearchQuery((prev) => ({
        ...prev,
        searchTerm: undefined,
        statusFilter: undefined,
        roleFilter: undefined,
        baptisedFilter: undefined,
        giftAidFilter: undefined,
        districtFilter: undefined,
        unassignedDistrictFilter: undefined,
        pastoralCareRequired: undefined,
        page: 1,
      }));
      setPaginationModel((prev) => ({ ...prev, page: 0 }));
    }, []);

    // Check if any filters are active
    const hasActiveFilters = useMemo(
      () =>
        searchTerm ||
        statusFilter !== undefined ||
        roleFilter !== undefined ||
        baptisedFilter !== undefined ||
        giftAidFilter !== undefined ||
        districtFilter !== undefined ||
        unassignedDistrictFilter !== undefined ||
        pastoralCareFilter !== undefined,
      [searchTerm, statusFilter, roleFilter, baptisedFilter, giftAidFilter, districtFilter, unassignedDistrictFilter, pastoralCareFilter]
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

    // Handle manage data protection
    const handleManageDataProtection = useCallback(
      async (member: ChurchMemberDto) => {
        handleActionMenuClose();
        // Fetch full member details
        const fullMember = await churchMembersApi.getChurchMemberById(member.id);
        setDataProtectionDrawer({ open: true, member: fullMember });
      },
      [handleActionMenuClose]
    );

    const handleDataProtectionSuccess = useCallback(() => {
      // Grid will auto-refresh via React Query invalidation in the hook
      setDataProtectionDrawer({ open: false, member: null });
    }, []);

    // Handle assign district
    const handleAssignDistrict = useCallback(
      async (member: ChurchMemberDto) => {
        handleActionMenuClose();
        // Fetch full member details
        const fullMember = await churchMembersApi.getChurchMemberById(member.id);
        setAssignDistrictDrawer({ open: true, member: fullMember });
      },
      [handleActionMenuClose]
    );

    const handleAssignDistrictSuccess = useCallback(() => {
      // Grid will auto-refresh via React Query invalidation in the hook
      setAssignDistrictDrawer({ open: false, member: null });
    }, []);

    // Handle pastoral care status updates
    const updatePastoralCareStatusMutation = useMutation({
      mutationFn: ({ memberId, pastoralCareRequired }: { memberId: number; pastoralCareRequired: boolean }) =>
        churchMembersApi.getChurchMemberById(memberId).then(member =>
          churchMembersApi.updateChurchMember(memberId, {
            title: member.title,
            firstName: member.firstName,
            lastName: member.lastName,
            email: member.email,
            phone: member.phone,
            bankReference: member.bankReference,
            memberSince: member.memberSince || new Date().toISOString(),
            statusId: member.statusId || 1,
            baptised: member.baptised,
            giftAid: member.giftAid,
            pastoralCareRequired,
            address: member.address,
            roleIds: member.roles.map(r => r.id),
          })
        ),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['churchMembers'] });
      },
    });

    const handleMarkPastoralCareRequired = useCallback(
      (member: ChurchMemberDto, required: boolean) => {
        handleActionMenuClose();
        updatePastoralCareStatusMutation.mutate({ memberId: member.id, pastoralCareRequired: required });
      },
      [handleActionMenuClose, updatePastoralCareStatusMutation]
    );

    // Define grid columns
    const columns: GridColDef[] = useMemo(
      () => [
        {
          field: 'title',
          headerName: 'Title',
          flex: 0.3,
          minWidth: 55,
          valueFormatter: (value) => value || '-',
        },
        {
          field: 'fullName',
          headerName: 'Name',
          flex: 0.8,
          minWidth: 120,
        },
        {
          field: 'contact',
          headerName: 'Contact',
          flex: 1.1,
          minWidth: 162,
          sortable: false,
          renderCell: (params) => (
            <Box sx={{ lineHeight: 1.2 }}>
              <Typography variant="body2" sx={{ mb: 0 }}>
                {params.row.email || '-'}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ lineHeight: 1 }}
              >
                {params.row.phone || '-'}
              </Typography>
            </Box>
          ),
        },
        {
          field: 'memberNumber',
          headerName: 'Number',
          flex: 0.72,
          minWidth: 90,
          align: 'center',
          headerAlign: 'center',
          valueFormatter: (value) => value || '-',
        },
        {
          field: 'districtName',
          headerName: 'District',
          flex: 0.63,
          minWidth: 81,
          sortable: true,
          align: 'center',
          headerAlign: 'center',
          valueFormatter: (value) => value || '-',
        },
        {
          field: 'pastoralCareRequired',
          headerName: 'Pastoral Care',
          flex: 0.63,
          minWidth: 99,
          align: 'center',
          headerAlign: 'center',
          sortable: false,
          renderCell: (params) =>
            params.row.pastoralCareRequired ? (
              <Tooltip title="Requires Pastoral Care" arrow>
                <FavoriteIcon color="warning" fontSize="small" />
              </Tooltip>
            ) : (
              <Tooltip title="No Pastoral Care Required" arrow>
                <FavoriteBorderIcon color="disabled" fontSize="small" />
              </Tooltip>
            ),
        },
        {
          field: 'baptised',
          headerName: 'Baptised',
          flex: 0.54,
          minWidth: 77,
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
          flex: 0.54,
          minWidth: 77,
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
          field: 'dataProtection',
          headerName: 'GDPR',
          flex: 0.6,
          minWidth: 80,
          sortable: false,
          filterable: false,
          align: 'center',
          headerAlign: 'center',
          renderCell: (params) => {
            const { icon, color, tooltip } = getDataProtectionIcon(
              params.row.dataProtection
            );
            return (
              <Tooltip title={tooltip} arrow placement="left">
                <Box sx={{ color, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                  {icon}
                </Box>
              </Tooltip>
            );
          },
        },
        {
          field: 'roles',
          headerName: 'Roles',
          flex: 1.0,
          minWidth: 130,
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
          field: 'status',
          headerName: 'Status',
          flex: 0.7,
          minWidth: 90,
          renderCell: (params) => {
            const config = getChurchMemberStatusConfig(params.row.status);
            return (
              <Chip label={config.label} size="small" color={config.color} />
            );
          },
        },
        {
          field: 'actions',
          type: 'actions',
          headerName: 'Actions',
          width: 100,
          cellClassName: 'actions-cell',
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
              sx={{ minWidth: { md: 240 } }}
            />

            {/* Filters */}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>District</InputLabel>
              <Select
                value={
                  unassignedDistrictFilter ? 'unassigned' : (districtFilter?.toString() || '')
                }
                onChange={(e) => {
                  const value = e.target.value as string;
                  if (value === 'unassigned') {
                    setDistrictFilter(undefined);
                    setUnassignedDistrictFilter(true);
                  } else if (value === '') {
                    setDistrictFilter(undefined);
                    setUnassignedDistrictFilter(undefined);
                  } else {
                    setDistrictFilter(Number(value));
                    setUnassignedDistrictFilter(undefined);
                  }
                }}
                label="District"
              >
                <MenuItem value="">
                  <em>All</em>
                </MenuItem>
                <MenuItem value="unassigned">Unassigned</MenuItem>
                {districts.map((district) => (
                  <MenuItem key={district.id} value={district.id}>
                    {district.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Pastoral Care</InputLabel>
              <Select
                value={
                  pastoralCareFilter === undefined ? '' : String(pastoralCareFilter)
                }
                onChange={(e) =>
                  setPastoralCareFilter(
                    e.target.value === ''
                      ? undefined
                      : e.target.value === 'true'
                  )
                }
                label="Pastoral Care"
              >
                <MenuItem value="">
                  <em>All</em>
                </MenuItem>
                <MenuItem value="true">Required</MenuItem>
                <MenuItem value="false">Not Required</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Gift Aid</InputLabel>
              <Select
                value={giftAidFilter === undefined ? '' : String(giftAidFilter)}
                onChange={(e) =>
                  setGiftAidFilter(
                    e.target.value === ''
                      ? undefined
                      : e.target.value === 'true'
                  )
                }
                label="Gift Aid"
              >
                <MenuItem value="">
                  <em>All</em>
                </MenuItem>
                <MenuItem value="true">Yes</MenuItem>
                <MenuItem value="false">No</MenuItem>
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
                <MenuItem value="">
                  <em>All</em>
                </MenuItem>
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
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
                <MenuItem value="">
                  <em>All</em>
                </MenuItem>
                {statuses.map((status) => (
                  <MenuItem key={status.id} value={status.id}>
                    {status.name}
                  </MenuItem>
                ))}
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
          disableColumnMenu
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

          {canManageChurchMembers && (
            <MenuItem
              onClick={() =>
                selectedMember && handleManageDataProtection(selectedMember)
              }
            >
              <ListItemIcon>
                <SecurityIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Manage GDPR</ListItemText>
            </MenuItem>
          )}

          {canManageChurchMembers && (
            <MenuItem
              onClick={() =>
                selectedMember && handleAssignDistrict(selectedMember)
              }
            >
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Assign District</ListItemText>
            </MenuItem>
          )}

          {canManageChurchMembers && (
            <>
              <MenuItem
                onClick={() =>
                  selectedMember && handleMarkPastoralCareRequired(selectedMember, true)
                }
                disabled={selectedMember?.pastoralCareRequired}
              >
                <ListItemIcon>
                  <FavoriteIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Mark Pastoral Care Required</ListItemText>
              </MenuItem>

              <MenuItem
                onClick={() =>
                  selectedMember && handleMarkPastoralCareRequired(selectedMember, false)
                }
                disabled={!selectedMember?.pastoralCareRequired}
              >
                <ListItemIcon>
                  <FavoriteBorderIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Mark Pastoral Care Not Required</ListItemText>
              </MenuItem>
            </>
          )}
        </Menu>

        {/* Data Protection Drawer */}
        {dataProtectionDrawer.member && (
          <ManageDataProtectionDrawer
            open={dataProtectionDrawer.open}
            onClose={() =>
              setDataProtectionDrawer({ open: false, member: null })
            }
            member={dataProtectionDrawer.member}
            onSuccess={handleDataProtectionSuccess}
          />
        )}

        {/* Assign District Drawer */}
        {assignDistrictDrawer.member && (
          <AssignDistrictDrawer
            open={assignDistrictDrawer.open}
            onClose={() =>
              setAssignDistrictDrawer({ open: false, member: null })
            }
            member={assignDistrictDrawer.member}
            onSuccess={handleAssignDistrictSuccess}
          />
        )}
      </Paper>
    );
  }
);

export default ChurchMemberGrid;
