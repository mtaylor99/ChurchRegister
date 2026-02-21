import React from 'react';
import { Box, Button, Stack, CircularProgress } from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  AddCircle as AddCircleIcon,
  Add as AddIcon,
  History as HistoryIcon,
  AutoAwesome as AutoAwesomeIcon,
  FileDownload as DownloadIcon,
} from '@mui/icons-material';
import type { FinancialActionsHeaderProps } from '../../types/contributions';

/**
 * Financial Actions Header Component
 * Displays action buttons for financial operations with role-based visibility
 * - Upload HSBC Statement (FinancialContributor, FinancialAdministrator, SystemAdministration)
 * - Upload Envelopes (FinancialContributor, FinancialAdministrator, SystemAdministration)
 * - View Envelopes Upload History (All financial roles)
 * - Generate New Membership Numbers (FinancialAdministrator, SystemAdministration)
 */
export const FinancialActionsHeader: React.FC<FinancialActionsHeaderProps> = ({
  onUploadHsbc,
  onEnterBatch,
  onAddOneOffContribution,
  onViewBatchHistory,
  onGenerateRegisterNumbers,
  onExportContributions,
  userRoles,
  isExporting = false,
}) => {
  /**
   * Check if user can upload HSBC statements or enter batches
   * Requires: FinancialContributor, FinancialAdministrator, or SystemAdministration
   */
  const canUploadOrEnterBatch = (roles: string[]): boolean => {
    return roles.some(
      (role) =>
        role === 'FinancialContributor' ||
        role === 'FinancialAdministrator' ||
        role === 'SystemAdministration'
    );
  };

  /**
   * Check if user can view envelopes upload history
   * Requires: Any financial role
   */
  const canViewBatchHistory = (roles: string[]): boolean => {
    return roles.some(
      (role) =>
        role === 'FinancialViewer' ||
        role === 'FinancialContributor' ||
        role === 'FinancialAdministrator' ||
        role === 'SystemAdministration'
    );
  };

  /**
   * Check if user can generate new membership numbers
   * Requires: FinancialAdministrator or SystemAdministration
   */
  const canGenerateRegisterNumbers = (roles: string[]): boolean => {
    return roles.some(
      (role) =>
        role === 'FinancialAdministrator' || role === 'SystemAdministration'
    );
  };

  const showUploadAndEntry = canUploadOrEnterBatch(userRoles);
  const showHistory = canViewBatchHistory(userRoles);
  const showGenerateNumbers = canGenerateRegisterNumbers(userRoles);

  // If user has no financial permissions, don't render anything
  if (!showUploadAndEntry && !showHistory && !showGenerateNumbers) {
    return null;
  }

  return (
    <Box>
      <Stack
        direction="row"
        spacing={2}
        sx={{
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        {/* Upload HSBC Statement Button */}
        {showUploadAndEntry && (
          <Button
            variant="contained"
            startIcon={<CloudUploadIcon />}
            onClick={onUploadHsbc}
            sx={{ px: 3, py: 1.5 }}
          >
            Upload HSBC Statement
          </Button>
        )}

        {/* Upload Envelopes Button */}
        {showUploadAndEntry && (
          <Button
            variant="contained"
            startIcon={<AddCircleIcon />}
            onClick={onEnterBatch}
            sx={{ px: 3, py: 1.5 }}
          >
            Upload Envelopes
          </Button>
        )}

        {/* Add One Off Contribution Button */}
        {showUploadAndEntry && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAddOneOffContribution}
            sx={{ px: 3, py: 1.5 }}
          >
            Add One Off Contribution
          </Button>
        )}

        {/* Export Members Contributions Button */}
        {showHistory && (
          <Button
            variant="outlined"
            startIcon={
              isExporting ? <CircularProgress size={20} /> : <DownloadIcon />
            }
            onClick={onExportContributions}
            disabled={isExporting}
            sx={{ px: 3, py: 1.5 }}
          >
            {isExporting ? 'Exporting...' : 'Export Members Contributions'}
          </Button>
        )}

        {/* Generate New Membership Numbers Button */}
        {showGenerateNumbers && (
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<AutoAwesomeIcon />}
            onClick={onGenerateRegisterNumbers}
            sx={{ px: 3, py: 1.5 }}
          >
            Generate New Membership Numbers
          </Button>
        )}

        {/* View Envelopes Upload History Button */}
        {showHistory && (
          <Button
            variant="outlined"
            startIcon={<HistoryIcon />}
            onClick={onViewBatchHistory}
            sx={{ px: 3, py: 1.5 }}
          >
            View Envelopes Upload History
          </Button>
        )}
      </Stack>
    </Box>
  );
};

export default FinancialActionsHeader;
