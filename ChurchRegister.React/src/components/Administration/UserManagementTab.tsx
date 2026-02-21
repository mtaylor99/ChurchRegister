import React, { useState } from 'react';
import { Box, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import {
  UserGrid,
  UserDrawer,
  AddUserForm,
  EditUserForm,
} from '../../components/Administration';
import type { UserProfileDto } from '../../types/administration';

/**
 * User Management tab component for the Administration page
 */
export const UserManagementTab: React.FC = () => {
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

  return (
    <Box>
      {/* Add User Button */}
      <Box display="flex" justifyContent="flex-end" mb={2}>
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
};
