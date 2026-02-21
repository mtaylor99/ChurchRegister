import React, { useState } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import {
  Add as AddIcon,
  FileDownload as DownloadIcon,
  Groups as MembersIcon,
  Favorite as FavoriteIcon,
} from '@mui/icons-material';
import { ChurchMemberGrid } from '../../components/ChurchMembers/ChurchMemberGrid';
import { ChurchMemberDrawer } from '../../components/ChurchMembers/ChurchMemberDrawer';
import type { ChurchMemberDetailDto } from '../../types/churchMembers';
import { churchMembersApi } from '../../services/api/churchMembersApi';
import { exportChurchMembersWithDetailsToExcel } from '../../utils/excelExport';

/**
 * Church Members Management page - main administration interface for managing church members
 */
export const ChurchMembersPage: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedMember, setSelectedMember] =
    useState<ChurchMemberDetailDto | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingPastoralCare, setIsExportingPastoralCare] = useState(false);

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

  const handleExportMembers = async () => {
    try {
      setIsExporting(true);
      // Fetch all members by paginating through results (max page size 100)
      const firstResponse = await churchMembersApi.getChurchMembers({
        page: 1,
        pageSize: 100,
        sortBy: 'firstName',
        sortDirection: 'asc',
      });

      let allMembers = [...firstResponse.items];
      const totalPages = firstResponse.totalPages;

      // Fetch remaining pages if needed
      if (totalPages > 1) {
        const pagePromises = [];
        for (let page = 2; page <= totalPages; page++) {
          pagePromises.push(
            churchMembersApi.getChurchMembers({
              page,
              pageSize: 100,
              sortBy: 'firstName',
              sortDirection: 'asc',
            })
          );
        }
        const responses = await Promise.all(pagePromises);
        responses.forEach((response) => {
          allMembers = allMembers.concat(response.items);
        });
      }

      // Create a map of member IDs to member numbers
      const memberNumbersMap = new Map<number, string>(
        allMembers.map((m) => [m.id, m.memberNumber || ''])
      );

      // Fetch full details for each member to include addresses
      const memberDetailsPromises = allMembers.map((member) =>
        churchMembersApi.getChurchMemberById(member.id)
      );

      const memberDetails = await Promise.all(memberDetailsPromises);

      await exportChurchMembersWithDetailsToExcel(memberDetails, memberNumbersMap);
    } catch (error) {
      console.error('Error exporting members:', error);
      // You could add error notification here
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPastoralCare = async () => {
    try {
      setIsExportingPastoralCare(true);
      await churchMembersApi.exportPastoralCareReport();
    } catch (error) {
      console.error('Failed to export pastoral care report:', error);
    } finally {
      setIsExportingPastoralCare(false);
    }
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
            <MembersIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" component="h1" fontWeight={700}>
                Church Members Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage church member records, roles, and contact information
              </Typography>
            </Box>
          </Box>

          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={
                isExportingPastoralCare ? (
                  <CircularProgress size={20} />
                ) : (
                  <FavoriteIcon />
                )
              }
              size="large"
              onClick={handleExportPastoralCare}
              disabled={isExportingPastoralCare}
              sx={{ px: 3, py: 1.5 }}
            >
              {isExportingPastoralCare ? 'Exporting...' : 'Export Pastoral Care'}
            </Button>
            <Button
              variant="outlined"
              startIcon={
                isExporting ? <CircularProgress size={20} /> : <DownloadIcon />
              }
              size="large"
              onClick={handleExportMembers}
              disabled={isExporting}
              sx={{ px: 3, py: 1.5 }}
            >
              {isExporting ? 'Exporting...' : 'Export Members'}
            </Button>
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
