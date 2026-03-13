import React, { useMemo } from 'react';
import { DataGrid, GridActionsCellItem, GridToolbar } from '@mui/x-data-grid';
import type { GridColDef, GridRowParams } from '@mui/x-data-grid';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import type { ChurchMemberDto } from '../../types/churchMembers';
import type { DataProtectionSummary } from '../../types/dataProtection';
import { getChurchMemberStatusConfig } from '../../types/churchMembers';
import { ManageDataProtectionDrawer } from './ManageDataProtectionDrawer';
import { AssignDistrictDrawer } from './AssignDistrictDrawer';
import { useChurchMemberGrid } from './useChurchMemberGrid';
export type { ChurchMemberGridProps } from './useChurchMemberGrid';
import type { ChurchMemberGridProps } from './useChurchMemberGrid';

// ── Pure render helpers ────────────────────────────────────────────────────

const renderDataProtectionTooltip = (
  dataProtection: DataProtectionSummary
): React.ReactNode => (
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
      {dataProtection.allowPhotoInSocialMedia ? '✓' : '✗'} Photo on Social Media
    </Typography>
    <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
      {dataProtection.groupPhotos ? '✓' : '✗'} Group Photos
    </Typography>
    <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
      {dataProtection.permissionForMyChildren ? '✓' : '✗'} Permission for
      Children
    </Typography>
    <Typography variant="caption" color="text.secondary">
      Last modified:{' '}
      {new Date(dataProtection.modifiedDateTime).toLocaleString()}
    </Typography>
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{ display: 'block' }}
    >
      Modified by: {dataProtection.modifiedBy}
    </Typography>
  </Box>
);

const getDataProtectionIcon = (
  dataProtection: DataProtectionSummary | null | undefined
): { icon: React.ReactNode; color: string; tooltip: React.ReactNode } => {
  if (!dataProtection) {
    return {
      icon: <BlockIcon fontSize="small" />,
      color: 'grey',
      tooltip: 'No data protection record',
    };
  }

  const permissions = [
    dataProtection.allowNameInCommunications,
    dataProtection.allowHealthStatusInCommunications,
    dataProtection.allowPhotoInCommunications,
    dataProtection.allowPhotoInSocialMedia,
    dataProtection.groupPhotos,
    dataProtection.permissionForMyChildren,
  ];
  const grantedCount = permissions.filter((p) => p).length;

  if (grantedCount === 6) {
    return {
      icon: <CheckCircleIcon fontSize="small" />,
      color: 'success.main',
      tooltip: renderDataProtectionTooltip(dataProtection),
    };
  }
  if (grantedCount === 0) {
    return {
      icon: <CancelIcon fontSize="small" />,
      color: 'grey',
      tooltip: renderDataProtectionTooltip(dataProtection),
    };
  }
  return {
    icon: <WarningIcon fontSize="small" />,
    color: 'warning.main',
    tooltip: renderDataProtectionTooltip(dataProtection),
  };
};

// ── Component ──────────────────────────────────────────────────────────────

export const ChurchMemberGrid: React.FC<ChurchMemberGridProps> = React.memo(
  ({ onEditMember, onViewMember, initialQuery }) => {
    const {
      canManageChurchMembers,
      paginationModel,
      sortModel,
      searchTerm,
      statusFilter,
      setStatusFilter,
      roleFilter,
      setRoleFilter,
      giftAidFilter,
      setGiftAidFilter,
      districtFilter,
      unassignedDistrictFilter,
      pastoralCareFilter,
      setPastoralCareFilter,
      hasActiveFilters,
      membersResponse,
      isLoadingMembers,
      roles,
      statuses,
      districts,
      isDeleting,
      actionMenuAnchorEl,
      selectedMember,
      dataProtectionDrawer,
      assignDistrictDrawer,
      deleteDialogOpen,
      memberToDelete,
      handleSearchChange,
      handleClearAllFilters,
      handlePaginationModelChange,
      handleSortModelChange,
      handleActionMenuOpen,
      handleActionMenuClose,
      handleViewMember,
      handleEditMember,
      handleManageDataProtection,
      handleDataProtectionSuccess,
      handleAssignDistrict,
      handleAssignDistrictSuccess,
      handleMarkPastoralCareRequired,
      handleDeleteMember,
      handleDeleteConfirm,
      handleDeleteCancel,
      handleDistrictFilterChange,
      setDataProtectionDrawer,
      setAssignDistrictDrawer,
    } = useChurchMemberGrid({ onEditMember, onViewMember, initialQuery });

    const columns: GridColDef[] = useMemo(
      () => [
        {
          field: 'title',
          headerName: 'Title',
          flex: 0.3,
          minWidth: 55,
          valueFormatter: (value) => value || '-',
        },
        { field: 'fullName', headerName: 'Name', flex: 1.2, minWidth: 120 },
        {
          field: 'contact',
          headerName: 'Contact',
          flex: 0.7,
          minWidth: 130,
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
          valueFormatter: (value) => value ?? '-',
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
                <Box
                  sx={{
                    color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                  }}
                >
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
              onClick={(event) =>
                handleActionMenuOpen(event, params.row as ChurchMemberDto)
              }
              showInMenu={false}
            />,
          ],
        },
      ],
      [handleActionMenuOpen]
    );

    return (
      <Paper elevation={2} sx={{ width: '100%' }}>
        {/* Search and Filters */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              fullWidth
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={handleSearchChange}
              size="small"
              sx={{ minWidth: { md: 240 } }}
            />

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>District</InputLabel>
              <Select
                value={
                  unassignedDistrictFilter
                    ? 'unassigned'
                    : districtFilter?.toString() || ''
                }
                onChange={(e) =>
                  handleDistrictFilterChange(e.target.value as string)
                }
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
                  pastoralCareFilter === undefined
                    ? ''
                    : String(pastoralCareFilter)
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
          autoHeight
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
          slots={{ toolbar: GridToolbar }}
          slotProps={{ toolbar: { showQuickFilter: false } }}
          sx={{
            border: 'none',
            '& .MuiDataGrid-cell:focus': { outline: 'none' },
            '& .MuiDataGrid-columnHeader:focus': { outline: 'none' },
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
            <ListItemText>View</ListItemText>
          </MenuItem>

          <MenuItem
            onClick={() => selectedMember && handleEditMember(selectedMember)}
          >
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>

          {canManageChurchMembers && (
            <MenuItem
              onClick={() =>
                selectedMember && handleDeleteMember(selectedMember)
              }
            >
              <ListItemIcon>
                <DeleteIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Delete</ListItemText>
            </MenuItem>
          )}

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
              {!selectedMember?.pastoralCareRequired ? (
                <MenuItem
                  onClick={() =>
                    selectedMember &&
                    handleMarkPastoralCareRequired(selectedMember, true)
                  }
                >
                  <ListItemIcon>
                    <FavoriteIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Mark Pastoral Care Required</ListItemText>
                </MenuItem>
              ) : (
                <MenuItem
                  onClick={() =>
                    selectedMember &&
                    handleMarkPastoralCareRequired(selectedMember, false)
                  }
                >
                  <ListItemIcon>
                    <FavoriteBorderIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Mark Pastoral Care Not Required</ListItemText>
                </MenuItem>
              )}
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

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={handleDeleteCancel}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Delete Member</DialogTitle>
          <DialogContent>
            <Box>
              Are you sure you want to delete{' '}
              <strong>{memberToDelete?.fullName}</strong>?
              <br />
              <br />
              This action cannot be undone. This is a permanent deletion for
              members entered in error.
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteCancel}>Cancel</Button>
            <LoadingButton
              onClick={handleDeleteConfirm}
              variant="contained"
              color="error"
              loading={isDeleting}
            >
              Delete
            </LoadingButton>
          </DialogActions>
        </Dialog>
      </Paper>
    );
  }
);

export default ChurchMemberGrid;
