import React, { useState } from 'react';
import {
  Box,
  Typography,
  Drawer,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon, AccountBalance as AccountBalanceIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/useAuth';
import {
  ContributionMemberGrid,
  FinancialActionsHeader,
} from '../../components/Contributions';
import { ContributionHistoryDialog } from '../../components/ChurchMembers/ContributionHistoryDialog';
import { HsbcUploadModal } from '../../components/Financial/HsbcUploadModal';
import {
  EnvelopeBatchHistory,
  EnvelopeBatchEntry,
  YearSelectionModal,
  AddOneOffContributionDrawer,
} from '../../components/Financial';
import { RegisterNumberGenerationDialog } from '../../components/Administration/RegisterNumberGenerationDialog';
import type { ContributionMemberDto } from '../../types/contributions';
import { useQueryClient } from '@tanstack/react-query';
import { contributionsApi } from '../../services/api/contributionsApi';
import { churchMembersApi } from '../../services/api/churchMembersApi';
import { contributionHistoryApi } from '../../services/api/contributionHistoryApi';
import {
  exportMemberContributionsToExcel,
  type MemberContributionExportData,
} from '../../utils/excelExport';

/**
 * Contributions Page Component
 * Main page for viewing and managing church member contributions
 * - Displays contribution-focused member grid
 * - Provides financial action buttons (HSBC upload, envelopes upload, history)
 * - Shows contribution history dialog
 *
 * Access: FinancialViewer, FinancialContributor, FinancialAdministrator, SystemAdministration
 */
export const ContributionsPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get user roles
  const userRoles = user?.roles || [];

  // Contribution history dialog state
  const [contributionDialogOpen, setContributionDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] =
    useState<ContributionMemberDto | null>(null);

  // HSBC upload modal state
  const [hsbcUploadModalOpen, setHsbcUploadModalOpen] = useState(false);

  // Envelopes upload history drawer state
  const [batchHistoryDrawerOpen, setBatchHistoryDrawerOpen] = useState(false);

  // Envelopes upload modal state
  const [batchEntryModalOpen, setBatchEntryModalOpen] = useState(false);

  // Generate new membership numbers modal state
  const [generateRegisterNumbersOpen, setGenerateRegisterNumbersOpen] =
    useState(false);

  // Year selection modal state for exports
  const [yearSelectionModalOpen, setYearSelectionModalOpen] = useState(false);

  // Export state
  const [isExporting, setIsExporting] = useState(false);

  // Add one off contribution drawer state
  const [addOneOffDrawerOpen, setAddOneOffDrawerOpen] = useState(false);

  /**
   * Handle viewing contributions for a member
   */
  const handleViewContributions = (member: ContributionMemberDto) => {
    setSelectedMember(member);
    setContributionDialogOpen(true);
  };

  /**
   * Handle closing contribution history dialog
   */
  const handleCloseContributionDialog = () => {
    setContributionDialogOpen(false);
    setSelectedMember(null);
  };

  /**
   * Handle opening HSBC upload modal
   */
  const handleUploadHsbc = () => {
    setHsbcUploadModalOpen(true);
  };

  /**
   * Handle successful HSBC upload
   * Refreshes the contribution grid data
   */
  const handleHsbcUploadSuccess = () => {
    setHsbcUploadModalOpen(false);
    // Invalidate queries to refresh grid data
    queryClient.invalidateQueries({ queryKey: ['contribution-members'] });
  };

  /**
   * Handle uploading envelopes
   * Opens envelopes upload modal
   */
  const handleEnterBatch = () => {
    setBatchEntryModalOpen(true);
  };

  /**
   * Handle viewing envelopes upload history
   * Opens envelopes upload history drawer
   */
  const handleViewBatchHistory = () => {
    setBatchHistoryDrawerOpen(true);
  };

  /**
   * Handle opening generate new membership numbers modal
   */
  const handleGenerateRegisterNumbers = () => {
    setGenerateRegisterNumbersOpen(true);
  };

  /**
   * Handle opening year selection modal for export
   */
  const handleExportContributions = () => {
    setYearSelectionModalOpen(true);
  };

  /**
   * Handle opening add one off contribution drawer
   */
  const handleAddOneOffContribution = () => {
    setAddOneOffDrawerOpen(true);
  };

  /**
   * Handle successful one off contribution addition
   * Refreshes the contribution grid data
   */
  const handleOneOffContributionSuccess = () => {
    setAddOneOffDrawerOpen(false);
    // Invalidate queries to refresh grid data
    queryClient.invalidateQueries({ queryKey: ['contribution-members'] });
  };

  /**
   * Handle exporting member contributions to Excel for selected year
   */
  const handleConfirmYearExport = async (year: number) => {
    try {
      setIsExporting(true);
      // Fetch all contribution members by paginating through results (max page size 100)
      const firstResponse = await contributionsApi.getContributionMembers({
        page: 1,
        pageSize: 100,
        sortBy: 'firstName',
        sortDirection: 'asc',
        year, // Pass selected year
      });

      let allMembers = [...firstResponse.items];
      const totalPages = firstResponse.totalPages;

      // Fetch remaining pages if needed
      if (totalPages > 1) {
        const pagePromises = [];
        for (let page = 2; page <= totalPages; page++) {
          pagePromises.push(
            contributionsApi.getContributionMembers({
              page,
              pageSize: 100,
              sortBy: 'firstName',
              sortDirection: 'asc',
              year, // Pass selected year
            })
          );
        }
        const responses = await Promise.all(pagePromises);
        responses.forEach((response) => {
          allMembers = allMembers.concat(response.items);
        });
      }

      // Fetch full details for each member to get bank reference and gift aid
      const memberDetailsPromises = allMembers.map((member) =>
        churchMembersApi.getChurchMemberById(member.id)
      );

      const memberDetails = await Promise.all(memberDetailsPromises);

      // Fetch contribution history for each member to get last contribution date for the year
      const yearStart = `${year}-01-01`;
      const yearEnd = `${year}-12-31`;

      const contributionHistoryPromises = allMembers.map(
        (member) =>
          contributionHistoryApi
            .getContributionHistory(member.id, yearStart, yearEnd)
            .catch(() => []) // Return empty array if there's an error
      );

      const contributionHistories = await Promise.all(
        contributionHistoryPromises
      );

      // Combine contribution data with member details and contribution history
      const exportData: MemberContributionExportData[] = allMembers.map(
        (contributionMember, index) => {
          const memberDetail = memberDetails.find(
            (m) => m.id === contributionMember.id
          );

          // Get the most recent contribution date for this member
          const contributions = contributionHistories[index];
          const lastContributionDate =
            contributions.length > 0
              ? contributions
                  .map((c) => new Date(c.date))
                  .sort((a, b) => b.getTime() - a.getTime())[0]
                  .toISOString()
              : undefined;

          return {
            id: contributionMember.id,
            title: memberDetail?.title,
            fullName: contributionMember.fullName,
            address: memberDetail?.address,
            memberNumber: contributionMember.envelopeNumber || undefined,
            bankReference: memberDetail?.bankReference,
            thisYearsContribution: contributionMember.thisYearsContribution,
            lastContributionDate,
            giftAid: memberDetail?.giftAid || false,
          };
        }
      );

      await exportMemberContributionsToExcel(exportData, year);
      setYearSelectionModalOpen(false);
    } catch (error) {
      console.error('Error exporting contributions:', error);
      // You could add error notification here
    } finally {
      setIsExporting(false);
    }
  };

  const handleBatchEntrySuccess = (batchId: number) => {
    console.log('Batch submitted successfully:', batchId);
    setBatchEntryModalOpen(false);
    queryClient.invalidateQueries({ queryKey: ['contribution-members'] });
  };

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
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        {/* Header Left: Title and Subtitle */}
        <Box display="flex" alignItems="center" gap={2}>
          <AccountBalanceIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" component="h1" fontWeight={700}>
              Church Member Contributions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View contribution records, manage financial data, and process
              transactions
            </Typography>
          </Box>
        </Box>

        {/* Header Right: Action Buttons */}
        <FinancialActionsHeader
          onUploadHsbc={handleUploadHsbc}
          onEnterBatch={handleEnterBatch}
          onAddOneOffContribution={handleAddOneOffContribution}
          onViewBatchHistory={handleViewBatchHistory}
          onGenerateRegisterNumbers={handleGenerateRegisterNumbers}
          onExportContributions={handleExportContributions}
          userRoles={userRoles}
          isExporting={isExporting}
        />
      </Box>

      {/* Contribution Member Grid */}
      <ContributionMemberGrid
        onViewContributions={handleViewContributions}
        initialQuery={{
          pageSize: 20,
          sortBy: 'thisYearsContribution',
          sortDirection: 'desc',
        }}
      />

      {/* Contribution History Dialog */}
      {selectedMember && (
        <ContributionHistoryDialog
          open={contributionDialogOpen}
          onClose={handleCloseContributionDialog}
          memberId={selectedMember.id}
          memberName={selectedMember.fullName}
        />
      )}

      {/* HSBC Upload Modal */}
      <HsbcUploadModal
        open={hsbcUploadModalOpen}
        onClose={() => setHsbcUploadModalOpen(false)}
        onUploadSuccess={handleHsbcUploadSuccess}
      />

      {/* Envelopes Upload History Drawer */}
      <Drawer
        anchor="right"
        open={batchHistoryDrawerOpen}
        onClose={() => setBatchHistoryDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '100%', sm: '700px', md: '850px' },
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
              bgcolor: 'grey.100',
              p: 2,
              borderRadius: 1,
            }}
          >
            <Typography variant="h5" color="primary.main" fontWeight="bold">
              Envelopes Upload History
            </Typography>
            <IconButton
              onClick={() => setBatchHistoryDrawerOpen(false)}
              sx={{ color: 'primary.main' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          <EnvelopeBatchHistory />
        </Box>
      </Drawer>

      {/* Envelopes Upload Modal */}
      <Dialog
        open={batchEntryModalOpen}
        onClose={() => setBatchEntryModalOpen(false)}
        maxWidth={false}
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            width: '80%',
            height: '80%',
            maxWidth: 'none',
            maxHeight: 'none',
          },
        }}
      >
        <DialogTitle>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              bgcolor: 'grey.100',
              p: 2,
              m: -3,
              mb: 0,
              borderRadius: '4px 4px 0 0',
            }}
          >
            <Typography variant="h5" color="primary.main" fontWeight="bold">
              Upload Envelopes
            </Typography>
            <IconButton
              onClick={() => setBatchEntryModalOpen(false)}
              sx={{ color: 'primary.main' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <EnvelopeBatchEntry onSubmitSuccess={handleBatchEntrySuccess} />
        </DialogContent>
      </Dialog>

      {/* Generate New Membership Numbers Dialog */}
      <RegisterNumberGenerationDialog
        open={generateRegisterNumbersOpen}
        onClose={() => setGenerateRegisterNumbersOpen(false)}
      />

      {/* Year Selection Modal for Contributions Export */}
      <YearSelectionModal
        open={yearSelectionModalOpen}
        onClose={() => setYearSelectionModalOpen(false)}
        onConfirm={handleConfirmYearExport}
        isExporting={isExporting}
      />

      {/* Add One Off Contribution Drawer */}
      <AddOneOffContributionDrawer
        open={addOneOffDrawerOpen}
        onClose={() => setAddOneOffDrawerOpen(false)}
        onSuccess={handleOneOffContributionSuccess}
      />
    </Box>
  );
};

export default ContributionsPage;
