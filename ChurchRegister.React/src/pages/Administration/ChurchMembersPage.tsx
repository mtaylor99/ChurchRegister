import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Groups as MembersIcon,
  Numbers as NumbersIcon,
  MoreVert as MoreVertIcon,
  FileDownload as DownloadIcon,
  BarChart as StatisticsIcon,
} from '@mui/icons-material';
import { ChurchMemberGrid } from '../../components/ChurchMembers/ChurchMemberGrid';
import { ChurchMemberDrawer } from '../../components/ChurchMembers/ChurchMemberDrawer';
import { RegisterNumberGenerationDialog } from '../../components/Administration/RegisterNumberGenerationDialog';
import { ExportYearSelectorDialog } from '../../components/Administration/ExportYearSelectorDialog';
import { MemberStatisticsModal } from '../../components/Administration/MemberStatisticsModal';
import type { ChurchMemberDetailDto } from '../../types/churchMembers';
import { churchMembersApi } from '@services/api';
import { districtsApi } from '@services/api';
import { exportChurchMembersWithDetailsToExcel } from '../../utils/excelExport';
import { useAuth } from '../../contexts/useAuth';
import { useNotification } from '../../hooks/useNotification';

/**
 * Church Members Management page - main administration interface for managing church members
 */
export const ChurchMembersPage: React.FC = () => {
  const { user } = useAuth();
  const userRoles = user?.roles || [];
  const canGenerateNumbers = userRoles.some(
    (r) => r === 'FinancialAdministrator' || r === 'SystemAdministration'
  );

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedMember, setSelectedMember] =
    useState<ChurchMemberDetailDto | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingPastoralCare, setIsExportingPastoralCare] = useState(false);
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);
  const [generateRegisterNumbersOpen, setGenerateRegisterNumbersOpen] = useState(false);
  const [envelopeLabelsDialogOpen, setEnvelopeLabelsDialogOpen] = useState(false);
  const [envelopeLabelsExporting, setEnvelopeLabelsExporting] = useState(false);
  const [addressLabelsExporting, setAddressLabelsExporting] = useState(false);
  const [addressListExporting, setAddressListExporting] = useState(false);
  const [envelopeNumbersDialogOpen, setEnvelopeNumbersDialogOpen] = useState(false);
  const [envelopeNumbersExporting, setEnvelopeNumbersExporting] = useState(false);
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [isExportingDistrictsList, setIsExportingDistrictsList] = useState(false);

  const { showSuccess } = useNotification();

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
      const memberNumbersMap = new Map<number, number | undefined>(
        allMembers.map((m) => [m.id, m.memberNumber])
      );

      // Fetch full details for each member to include addresses
      const memberDetailsPromises = allMembers.map((member) =>
        churchMembersApi.getChurchMemberById(member.id)
      );

      const memberDetails = await Promise.all(memberDetailsPromises);

      await exportChurchMembersWithDetailsToExcel(
        memberDetails,
        memberNumbersMap
      );
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

  const handleExportEnvelopeLabels = async (year: number) => {
    try {
      setEnvelopeLabelsDialogOpen(false);
      setEnvelopeLabelsExporting(true);
      await churchMembersApi.exportEnvelopeLabels(year);
      showSuccess(`Envelope labels for ${year} downloaded successfully.`);
    } catch (error) {
      console.error('Failed to export envelope labels:', error);
    } finally {
      setEnvelopeLabelsExporting(false);
    }
  };

  const handleExportAddressLabels = async () => {
    try {
      setAddressLabelsExporting(true);
      await churchMembersApi.exportAddressLabels();
      showSuccess('Address labels downloaded successfully.');
    } catch (error) {
      console.error('Failed to export address labels:', error);
    } finally {
      setAddressLabelsExporting(false);
    }
  };

  const handleExportAddressList = async () => {
    try {
      setAddressListExporting(true);
      setExportAnchorEl(null);
      await churchMembersApi.exportAddressList();
      showSuccess('Address list downloaded successfully.');
    } catch (error) {
      console.error('Failed to export address list:', error);
    } finally {
      setAddressListExporting(false);
    }
  };

  const handleExportEnvelopeNumbers = async (year: number) => {
    try {
      setEnvelopeNumbersDialogOpen(false);
      setEnvelopeNumbersExporting(true);
      await churchMembersApi.exportEnvelopeNumbers(year);
      showSuccess(`Envelope numbers for ${year} downloaded successfully.`);
    } catch (error) {
      console.error('Failed to export envelope numbers:', error);
    } finally {
      setEnvelopeNumbersExporting(false);
    }
  };

  const handleExportDistrictsList = async () => {
    try {
      setIsExportingDistrictsList(true);
      setExportAnchorEl(null);
      const blob = await districtsApi.exportDistrictsMemberList();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const today = new Date().toISOString().split('T')[0];
      link.download = `Districts-Members-List-${today}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showSuccess('Districts members list downloaded successfully.');
    } catch (error) {
      console.error('Failed to export districts members list:', error);
    } finally {
      setIsExportingDistrictsList(false);
    }
  };

  try {
    return (
      <Box
        sx={{
          py: 2,
          px: { xs: 2, sm: 3, md: 4 },
          width: '100%',
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

          <Box display="flex" gap={1} alignItems="center">
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              size="large"
              onClick={handleAddMember}
              sx={{ px: 3, py: 1.5 }}
            >
              Add New Member
            </Button>
            <Tooltip title="More actions">
              <IconButton
                size="large"
                onClick={(e) => setExportAnchorEl(e.currentTarget)}
              >
                <MoreVertIcon />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={exportAnchorEl}
              open={Boolean(exportAnchorEl)}
              onClose={() => setExportAnchorEl(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <MenuItem
                onClick={() => { setExportAnchorEl(null); setStatsModalOpen(true); }}
              >
                <ListItemIcon><StatisticsIcon fontSize="small" /></ListItemIcon>
                <ListItemText>View Statistics</ListItemText>
              </MenuItem>
              <Divider />
              {canGenerateNumbers && (
                <MenuItem
                  onClick={() => {
                    setExportAnchorEl(null);
                    setGenerateRegisterNumbersOpen(true);
                  }}
                >
                  <ListItemIcon><NumbersIcon fontSize="small" /></ListItemIcon>
                  <ListItemText>Generate Membership Numbers</ListItemText>
                </MenuItem>
              )}
              <Divider />
              <MenuItem
                onClick={() => { setExportAnchorEl(null); handleExportMembers(); }}
                disabled={isExporting}
              >
                <ListItemIcon>
                  {isExporting ? <CircularProgress size={16} /> : <DownloadIcon fontSize="small" />}
                </ListItemIcon>
                <ListItemText>Export Members List</ListItemText>
              </MenuItem>
              <MenuItem
                onClick={handleExportDistrictsList}
                disabled={isExportingDistrictsList}
              >
                <ListItemIcon>
                  {isExportingDistrictsList ? <CircularProgress size={16} /> : <DownloadIcon fontSize="small" />}
                </ListItemIcon>
                <ListItemText>Export Districts List</ListItemText>
              </MenuItem>
              <MenuItem
                onClick={() => { setExportAnchorEl(null); handleExportPastoralCare(); }}
                disabled={isExportingPastoralCare}
              >
                <ListItemIcon>
                  {isExportingPastoralCare ? <CircularProgress size={16} /> : <DownloadIcon fontSize="small" />}
                </ListItemIcon>
                <ListItemText>Export Pastoral Care List</ListItemText>
              </MenuItem>
              <MenuItem
                onClick={() => { setExportAnchorEl(null); setEnvelopeLabelsDialogOpen(true); }}
                disabled={envelopeLabelsExporting}
              >
                <ListItemIcon>
                  {envelopeLabelsExporting ? <CircularProgress size={16} /> : <DownloadIcon fontSize="small" />}
                </ListItemIcon>
                <ListItemText>Export Envelope Labels</ListItemText>
              </MenuItem>
              <MenuItem
                onClick={() => { setExportAnchorEl(null); setEnvelopeNumbersDialogOpen(true); }}
                disabled={envelopeNumbersExporting}
              >
                <ListItemIcon>
                  {envelopeNumbersExporting ? <CircularProgress size={16} /> : <DownloadIcon fontSize="small" />}
                </ListItemIcon>
                <ListItemText>Export Envelope Numbers</ListItemText>
              </MenuItem>
              <MenuItem
                onClick={() => { setExportAnchorEl(null); handleExportAddressLabels(); }}
                disabled={addressLabelsExporting}
              >
                <ListItemIcon>
                  {addressLabelsExporting ? <CircularProgress size={16} /> : <DownloadIcon fontSize="small" />}
                </ListItemIcon>
                <ListItemText>Export Address Labels</ListItemText>
              </MenuItem>
              <MenuItem
                onClick={handleExportAddressList}
                disabled={addressListExporting}
              >
                <ListItemIcon>
                  {addressListExporting ? <CircularProgress size={16} /> : <DownloadIcon fontSize="small" />}
                </ListItemIcon>
                <ListItemText>Export Address List</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </Box>

        {/* Church Member Grid */}
        <Box sx={{ mb: 4 }}>
          <ChurchMemberGrid
            onEditMember={handleEditMember}
            onViewMember={handleViewMember}
            initialQuery={{
              pageSize: 20,
              sortBy: 'memberNumber',
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

        {/* Generate Membership Numbers Dialog */}
        <RegisterNumberGenerationDialog
          open={generateRegisterNumbersOpen}
          onClose={() => setGenerateRegisterNumbersOpen(false)}
        />

        {/* Export Envelope Labels Dialog */}
        <ExportYearSelectorDialog
          open={envelopeLabelsDialogOpen}
          onClose={() => setEnvelopeLabelsDialogOpen(false)}
          onConfirm={handleExportEnvelopeLabels}
          title="Export Envelope Labels"
          isExporting={envelopeLabelsExporting}
        />

        {/* Export Envelope Numbers Dialog */}
        <ExportYearSelectorDialog
          open={envelopeNumbersDialogOpen}
          onClose={() => setEnvelopeNumbersDialogOpen(false)}
          onConfirm={handleExportEnvelopeNumbers}
          title="Export Envelope Numbers"
          isExporting={envelopeNumbersExporting}
        />

        {/* Member Statistics Modal */}
        <MemberStatisticsModal
          open={statsModalOpen}
          onClose={() => setStatsModalOpen(false)}
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
