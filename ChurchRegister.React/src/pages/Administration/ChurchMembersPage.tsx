import React, { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { ChurchMemberGrid } from '../../components/ChurchMembers/ChurchMemberGrid';
import { ChurchMemberDrawer } from '../../components/ChurchMembers/ChurchMemberDrawer';
import type { ChurchMemberDetailDto } from '../../types/churchMembers';

/**
 * Church Members Management page - main administration interface for managing church members
 */
export const ChurchMembersPage: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedMember, setSelectedMember] =
    useState<ChurchMemberDetailDto | null>(null);

  const handleEditMember = (member: ChurchMemberDetailDto) => {
    setSelectedMember(member);
    setDrawerMode('edit');
    setDrawerOpen(true);
  };

  const handleViewMember = (member: ChurchMemberDetailDto) => {
    setSelectedMember(member);
    setDrawerMode('view');
    setDrawerOpen(true);
  };

  const handleAddMember = () => {
    setSelectedMember(null);
    setDrawerMode('add');
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedMember(null);
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
          alignItems="flex-start"
          mb={2}
        >
          <Box>
            <Typography variant="h4" gutterBottom>
              Church Members Management
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Manage church member records, roles, and contact information
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            size="large"
            onClick={handleAddMember}
            sx={{ px: 3, py: 1.5 }}
          >
            Add New Member
          </Button>
        </Box>

        {/* Church Member Grid */}
        <Box sx={{ mb: 4 }}>
          <ChurchMemberGrid
            onEditMember={handleEditMember}
            onViewMember={handleViewMember}
            initialQuery={{
              pageSize: 20,
              sortBy: 'firstName',
              sortDirection: 'asc',
            }}
          />
        </Box>

        {/* Church Member Drawer for Add/Edit/View */}
        <ChurchMemberDrawer
          open={drawerOpen}
          onClose={handleDrawerClose}
          mode={drawerMode}
          member={selectedMember}
          onSuccess={handleSuccess}
        />
      </Box>
    );
  } catch (error) {
    console.error('Error in ChurchMembersPage component:', error);
    return (
      <Box sx={{ py: 4, px: 2 }}>
        <Typography variant="h4" color="error">
          Error Loading Church Members
        </Typography>
        <Typography variant="body1">{String(error)}</Typography>
      </Box>
    );
  }
};

export default ChurchMembersPage;
