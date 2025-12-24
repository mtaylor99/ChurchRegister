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
import { Close as CloseIcon } from '@mui/icons-material';
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
} from '../../components/Financial';
import { GenerateRegisterNumbers } from '../../components/Administration';
import type { ContributionMemberDto } from '../../types/contributions';
import { useQueryClient } from '@tanstack/react-query';

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
          alignItems: 'flex-start',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        {/* Header Left: Title and Subtitle */}
        <Box>
          <Typography variant="h4" gutterBottom>
            Church Member Contributions
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            View contribution records, manage financial data, and process
            transactions
          </Typography>
        </Box>

        {/* Header Right: Action Buttons */}
        <FinancialActionsHeader
          onUploadHsbc={handleUploadHsbc}
          onEnterBatch={handleEnterBatch}
          onViewBatchHistory={handleViewBatchHistory}
          onGenerateRegisterNumbers={handleGenerateRegisterNumbers}
          userRoles={userRoles}
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
            width: { xs: '100%', sm: '600px', md: '700px' },
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant="h5">Envelopes Upload History</Typography>
            <IconButton onClick={() => setBatchHistoryDrawerOpen(false)}>
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
            }}
          >
            <Typography variant="h5">Upload Envelopes</Typography>
            <IconButton onClick={() => setBatchEntryModalOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <EnvelopeBatchEntry />
        </DialogContent>
      </Dialog>

      {/* Generate New Membership Numbers Modal */}
      <Dialog
        open={generateRegisterNumbersOpen}
        onClose={() => setGenerateRegisterNumbersOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant="h5">
              Generate New Membership Numbers
            </Typography>
            <IconButton onClick={() => setGenerateRegisterNumbersOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <GenerateRegisterNumbers />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ContributionsPage;
