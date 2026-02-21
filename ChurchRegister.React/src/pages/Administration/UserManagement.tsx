import React, { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Add as AddIcon, AdminPanelSettings as AdminIcon } from '@mui/icons-material';
import {
  UserGrid,
  UserDrawer,
  AddUserForm,
  EditUserForm,
} from '../../components/Administration';
import type { UserProfileDto } from '../../types/administration';

/**
 * User Management page - main administration interface for managing church users
 */
export const UserManagement: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedUser, setSelectedUser] = useState<UserProfileDto | null>(null);

  const handleEditUser = (user: UserProfileDto) => {
    setSelectedUser(user);
    setDrawerMode('edit');
    setDrawerOpen(true);
  };

  const handleViewUser = (user: UserProfileDto) => {
    setSelectedUser(user);
    setDrawerMode('view');
    setDrawerOpen(true);
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setDrawerMode('add');
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedUser(null);
  };

  const handleSuccess = () => {
    handleDrawerClose();
    // The grid will refresh automatically via React Query
  };

  try {
    return (
      <Box
        sx={{
          py: 2,
          px: { xs: 2, sm: 3, md: 4 },
          width: '100%',
          height: '100%',
        }}
      >
        {/* Page Header */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <AdminIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" component="h1" fontWeight={700}>
                User Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage system users, roles, and access permissions
              </Typography>
            </Box>
          </Box>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            size="large"
            onClick={handleAddUser}
            sx={{ px: 3, py: 1.5 }}
          >
            Add New User
          </Button>
        </Box>

        {/* User Grid */}
        <Box sx={{ mb: 4 }}>
          <UserGrid
            onEditUser={handleEditUser}
            onViewUser={handleViewUser}
            initialQuery={{
              pageSize: 20,
              sortBy: 'firstName',
              sortDirection: 'asc',
            }}
          />
        </Box>

        <UserDrawer
          open={drawerOpen}
          onClose={handleDrawerClose}
          mode={drawerMode}
          user={selectedUser}
        >
          {drawerMode === 'add' ? (
            <AddUserForm
              onSuccess={handleSuccess}
              onCancel={handleDrawerClose}
            />
          ) : selectedUser ? (
            <EditUserForm
              user={selectedUser}
              mode={drawerMode === 'view' ? 'view' : 'edit'}
              onSuccess={handleSuccess}
              onCancel={handleDrawerClose}
            />
          ) : null}
        </UserDrawer>
      </Box>
    );
  } catch (error) {
    console.error('Error in UserManagement component:', error);
    return (
      <Box sx={{ py: 4, px: 2 }}>
        <Typography variant="h4" color="error">
          Error Loading User Management
        </Typography>
        <Typography variant="body1">{String(error)}</Typography>
      </Box>
    );
  }
};

export default UserManagement;
