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
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Stack,
} from '@mui/material';
import {
  Edit as EditIcon,
  MoreVert as MoreIcon,
  Lock as LockIcon,
  LockOpen as UnlockIcon,
  PlayArrow as ActivateIcon,
  Pause as DeactivateIcon,
  Visibility as ViewIcon,
  Email as ResendInvitationIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserAvatar } from './UserAvatar';
import { UserStatusChip } from './UserStatusChip';
import { SearchAndFilter } from './SearchAndFilter';
import { ConfirmationModal } from './ConfirmationModal';
import { LoadingButton } from './LoadingButton';
import { ErrorBoundary } from './ErrorBoundary';
import { administrationApi } from '../../services/api/administrationApi';
import { useNotification } from '../../hooks/useNotification';
import { useAuth } from '../../contexts/useAuth';
import {
  UserAccountStatus,
  UserStatusAction,
} from '../../types/administration';
import type { UserProfileDto, UserGridQuery } from '../../types/administration';

export interface UserGridProps {
  onEditUser?: (user: UserProfileDto) => void;
  onViewUser?: (user: UserProfileDto) => void;
  initialQuery?: Partial<UserGridQuery>;
}

interface ActionMenuState {
  anchorEl: HTMLElement | null;
  user: UserProfileDto | null;
}

interface ConfirmationState {
  open: boolean;
  action: UserStatusAction | null;
  user: UserProfileDto | null;
  loading: boolean;
}

export const UserGrid: React.FC<UserGridProps> = React.memo(
  ({ onEditUser, onViewUser, initialQuery }) => {
    const queryClient = useQueryClient();
    const notification = useNotification();
    const { user: currentUser } = useAuth();

    // Grid state
    const [paginationModel, setPaginationModel] = useState<GridPaginationModel>(
      {
        page: initialQuery?.page ? initialQuery.page - 1 : 0, // DataGrid uses 0-based indexing
        pageSize: initialQuery?.pageSize || 20,
      }
    );

    const [sortModel, setSortModel] = useState<GridSortModel>([
      {
        field: initialQuery?.sortBy || 'firstName',
        sort: (initialQuery?.sortDirection || 'asc') as 'asc' | 'desc',
      },
    ]);

    const [searchQuery, setSearchQuery] = useState<UserGridQuery>({
      page: paginationModel.page + 1,
      pageSize: paginationModel.pageSize,
      searchTerm: initialQuery?.searchTerm,
      statusFilter: initialQuery?.statusFilter,
      roleFilter: initialQuery?.roleFilter,
      sortBy: sortModel[0]?.field || 'firstName',
      sortDirection: sortModel[0]?.sort || 'asc',
    });

    // Action menu state
    const [actionMenu, setActionMenu] = useState<ActionMenuState>({
      anchorEl: null,
      user: null,
    });

    // Confirmation modal state
    const [confirmation, setConfirmation] = useState<ConfirmationState>({
      open: false,
      action: null,
      user: null,
      loading: false,
    });

    // Fetch users data
    const {
      data: usersResponse,
      isLoading: isLoadingUsers,
      error: usersError,
      refetch: refetchUsers,
    } = useQuery({
      queryKey: ['users', searchQuery],
      queryFn: () => administrationApi.getUsers(searchQuery),
      placeholderData: (previousData) => previousData,
    });

    // Fetch system roles for filtering
    const { data: systemRoles = [] } = useQuery({
      queryKey: ['systemRoles'],
      queryFn: () => administrationApi.getSystemRoles(),
    });

    // User status update mutation
    const updateUserStatusMutation = useMutation({
      mutationFn: ({
        userId,
        action,
      }: {
        userId: string;
        action: UserStatusAction;
      }) => administrationApi.updateUserStatus(userId, { action }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['users'] });
        notification.showSuccess('User status updated successfully!');
        setConfirmation((prev) => ({ ...prev, open: false, loading: false }));
      },
      onError: (error: any) => {
        // Toast notification is shown automatically by ApiClient
        console.error('Failed to update user status:', error);
        setConfirmation((prev) => ({ ...prev, loading: false }));
      },
    });

    const resendInvitationMutation = useMutation({
      mutationFn: (userId: string) =>
        administrationApi.resendInvitation(userId),
      onSuccess: (result) => {
        if (result.emailSent) {
          notification.showSuccess('Invitation email sent successfully!');
        } else {
          notification.showWarning(
            'Invitation was processed but email may not have been sent.'
          );
        }
        setConfirmation((prev) => ({ ...prev, open: false, loading: false }));
      },
      onError: (error) => {
        // Toast notification is shown automatically by ApiClient
        console.error('Failed to resend invitation:', error);
        setConfirmation((prev) => ({ ...prev, loading: false }));
      },
    });

    // Handle search and filter changes
    const handleSearchChange = useCallback((newQuery: UserGridQuery) => {
      setSearchQuery(newQuery);
      setPaginationModel((prev) => ({ ...prev, page: 0 })); // Reset to first page
    }, []);

    // Handle pagination changes
    const handlePaginationModelChange = useCallback(
      (model: GridPaginationModel) => {
        setPaginationModel(model);
        setSearchQuery((prev) => ({
          ...prev,
          page: model.page + 1, // Convert to 1-based indexing
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

    // Action handlers
    const handleActionMenuOpen = (
      event: React.MouseEvent<HTMLElement>,
      user: UserProfileDto
    ) => {
      setActionMenu({ anchorEl: event.currentTarget, user });
    };

    const handleActionMenuClose = () => {
      setActionMenu({ anchorEl: null, user: null });
    };

    const handleEditUser = (user: UserProfileDto) => {
      handleActionMenuClose();
      onEditUser?.(user);
    };

    const handleViewUser = (user: UserProfileDto) => {
      handleActionMenuClose();
      onViewUser?.(user);
    };

    const handleStatusAction = (
      action: UserStatusAction,
      user: UserProfileDto
    ) => {
      handleActionMenuClose();
      setConfirmation({
        open: true,
        action,
        user,
        loading: false,
      });
    };

    const handleConfirmStatusAction = async () => {
      if (
        !confirmation.user ||
        confirmation.action === null ||
        confirmation.action === undefined
      )
        return;

      setConfirmation((prev) => ({ ...prev, loading: true }));

      if (confirmation.action === UserStatusAction.ResendInvitation) {
        resendInvitationMutation.mutate(confirmation.user.id);
      } else {
        updateUserStatusMutation.mutate({
          userId: confirmation.user.id,
          action: confirmation.action,
        });
      }
    };

    // Get status action text
    const getStatusActionText = (action: UserStatusAction): string => {
      switch (action) {
        case UserStatusAction.Lock:
          return 'lock';
        case UserStatusAction.Unlock:
          return 'unlock';
        case UserStatusAction.Activate:
          return 'activate';
        case UserStatusAction.Deactivate:
          return 'deactivate';
        case UserStatusAction.ResendInvitation:
          return 'resend invitation to';
        default:
          return 'update';
      }
    };

    // Get status action label
    const getStatusActionLabel = (action: UserStatusAction): string => {
      switch (action) {
        case UserStatusAction.Lock:
          return 'Lock';
        case UserStatusAction.Unlock:
          return 'Unlock';
        case UserStatusAction.Activate:
          return 'Activate';
        case UserStatusAction.Deactivate:
          return 'Deactivate';
        case UserStatusAction.ResendInvitation:
          return 'Resend Invitation';
        default:
          return 'Action';
      }
    };

    // Get available actions for user status - Add support for Invited status
    const getAvailableActions = (
      status: UserAccountStatus
    ): UserStatusAction[] => {
      switch (status) {
        case UserAccountStatus.Active:
          return [UserStatusAction.Lock, UserStatusAction.Deactivate];
        case UserAccountStatus.Inactive:
          return [UserStatusAction.Activate, UserStatusAction.Lock];
        case UserAccountStatus.Locked:
          return [UserStatusAction.Unlock];
        case UserAccountStatus.Invited:
          return [UserStatusAction.ResendInvitation];
        case UserAccountStatus.Pending:
          return [UserStatusAction.Activate, UserStatusAction.Lock];
        default:
          return [];
      }
    };

    // Define grid columns
    const columns: GridColDef[] = useMemo(
      () => [
        {
          field: 'avatar',
          headerName: '',
          width: 60,
          sortable: false,
          filterable: false,
          disableColumnMenu: true,
          renderCell: (params) => (
            <UserAvatar
              firstName={params.row.firstName}
              lastName={params.row.lastName}
              avatarUrl={params.row.avatar}
              size="small"
            />
          ),
        },
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
              <Typography variant="caption" color="text.secondary">
                {params.row.jobTitle || 'No job title'}
              </Typography>
            </Box>
          ),
        },
        {
          field: 'email',
          headerName: 'Email',
          flex: 1,
          minWidth: 200,
          renderCell: (params) => (
            <Box>
              <Typography variant="body2">{params.row.email}</Typography>
              {!params.row.emailConfirmed && (
                <Chip label="Unverified" size="small" color="warning" />
              )}
            </Box>
          ),
        },
        {
          field: 'status',
          headerName: 'Status',
          width: 120,
          renderCell: (params) => <UserStatusChip status={params.row.status} />,
        },
        {
          field: 'roles',
          headerName: 'Roles',
          width: 180,
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
          field: 'dateJoined',
          headerName: 'Joined',
          width: 120,
          valueFormatter: (value) => new Date(value).toLocaleDateString(),
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
      []
    );

    // We'll use DataGrid's built-in loading state instead of a separate loading component

    // Error state
    if (usersError) {
      return (
        <Box sx={{ p: 3 }}>
          <Typography color="error">
            Failed to load users. Please try again.
          </Typography>
          <LoadingButton onClick={() => refetchUsers()} sx={{ mt: 2 }}>
            Retry
          </LoadingButton>
        </Box>
      );
    }

    const users = usersResponse?.items || [];
    const totalCount = usersResponse?.totalCount || 0;

    return (
      <ErrorBoundary>
        <Box sx={{ width: '100%' }}>
          {/* Search and Filters */}
          <SearchAndFilter
            onSearch={handleSearchChange}
            availableRoles={systemRoles}
            loading={isLoadingUsers}
            initialQuery={searchQuery}
          />

          {/* Data Grid */}
          <Paper elevation={1} sx={{ mt: 1, width: '100%' }}>
            <DataGrid
              rows={users}
              columns={columns}
              paginationModel={paginationModel}
              onPaginationModelChange={handlePaginationModelChange}
              sortModel={sortModel}
              onSortModelChange={handleSortModelChange}
              loading={isLoadingUsers}
              rowCount={totalCount}
              paginationMode="server"
              sortingMode="server"
              pageSizeOptions={[10, 20, 50, 100]}
              disableRowSelectionOnClick
              disableColumnMenu
              autoHeight
              slots={{ toolbar: GridToolbar }}
              slotProps={{
                toolbar: {
                  showQuickFilter: false, // We have our own search
                },
              }}
              getRowHeight={() => 117} // Reduced by 25% from 156px to 117px
              sx={{
                border: 'none',
                width: '100%',
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid',
                  borderBottomColor: 'divider',
                  paddingY: 2, // Add vertical padding to cells
                  display: 'flex',
                  alignItems: 'flex-start', // Align cell content to top
                  paddingTop: 2, // Ensure consistent top padding
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: 'grey.50',
                  borderBottom: '2px solid',
                  borderBottomColor: 'divider',
                },
                '& .MuiDataGrid-columnHeader': {
                  display: 'flex',
                  alignItems: 'flex-start', // Align header content to top
                  paddingTop: 2,
                },
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            />
          </Paper>

          {/* Action Menu */}
          <Menu
            anchorEl={actionMenu.anchorEl}
            open={Boolean(actionMenu.anchorEl)}
            onClose={handleActionMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={() => handleViewUser(actionMenu.user!)}>
              <ListItemIcon>
                <ViewIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>View Details</ListItemText>
            </MenuItem>

            <MenuItem onClick={() => handleEditUser(actionMenu.user!)}>
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Edit User</ListItemText>
            </MenuItem>

            {actionMenu.user &&
              actionMenu.user.id !== currentUser?.id &&
              getAvailableActions(actionMenu.user.status).map((action) => {
                const icons = {
                  [UserStatusAction.Lock]: <LockIcon fontSize="small" />,
                  [UserStatusAction.Unlock]: <UnlockIcon fontSize="small" />,
                  [UserStatusAction.Activate]: (
                    <ActivateIcon fontSize="small" />
                  ),
                  [UserStatusAction.Deactivate]: (
                    <DeactivateIcon fontSize="small" />
                  ),
                  [UserStatusAction.ResendInvitation]: (
                    <ResendInvitationIcon fontSize="small" />
                  ),
                };

                return (
                  <MenuItem
                    key={action}
                    onClick={() => handleStatusAction(action, actionMenu.user!)}
                  >
                    <ListItemIcon>{icons[action]}</ListItemIcon>
                    <ListItemText>{getStatusActionLabel(action)}</ListItemText>
                  </MenuItem>
                );
              })}
          </Menu>

          {/* Confirmation Modal */}
          <ConfirmationModal
            open={confirmation.open}
            onClose={() =>
              setConfirmation((prev) => ({ ...prev, open: false }))
            }
            onConfirm={handleConfirmStatusAction}
            title={`${confirmation.action !== null && confirmation.action !== undefined ? getStatusActionLabel(confirmation.action) : 'Confirm'} User`}
            message={`Are you sure you want to ${getStatusActionText(
              confirmation.action!
            )} ${confirmation.user?.fullName}?`}
            confirmText={
              confirmation.action !== null && confirmation.action !== undefined
                ? getStatusActionLabel(confirmation.action)
                : 'Confirm'
            }
            variant="warning"
            loading={confirmation.loading}
          />
        </Box>
      </ErrorBoundary>
    );
  }
);
