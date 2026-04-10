import React, { useState } from 'react';
import {
  Box,
  Button,
  Stack,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  AddCircle as AddCircleIcon,
  Add as AddIcon,
  History as HistoryIcon,
  FileDownload as DownloadIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import type { FinancialActionsHeaderProps } from '../../types/contributions';

/**
 * Financial Actions Header Component
 * Displays action buttons for financial operations with role-based visibility
 * - Upload HSBC Statement (primary button - FinancialContributor+)
 * - Upload Envelopes (primary button - FinancialContributor+)
 * - More actions menu: Add One Off Contribution, Export, View History, Generate Numbers
 */
export const FinancialActionsHeader: React.FC<FinancialActionsHeaderProps> = ({
  onUploadHsbc,
  onEnterBatch,
  onAddOneOffContribution,
  onViewBatchHistory,
  onExportContributions,
  userRoles,
  isExporting = false,
}) => {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const canUploadOrEnterBatch = (roles: string[]): boolean =>
    roles.some(
      (r) =>
        r === 'FinancialContributor' ||
        r === 'FinancialAdministrator' ||
        r === 'SystemAdministration'
    );

  const canViewBatchHistory = (roles: string[]): boolean =>
    roles.some(
      (r) =>
        r === 'FinancialViewer' ||
        r === 'FinancialContributor' ||
        r === 'FinancialAdministrator' ||
        r === 'SystemAdministration'
    );

  const showUploadAndEntry = canUploadOrEnterBatch(userRoles);
  const showHistory = canViewBatchHistory(userRoles);
  const hasContextMenuItems = showUploadAndEntry || showHistory;

  if (!showUploadAndEntry && !showHistory) {
    return null;
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) =>
    setMenuAnchor(event.currentTarget);
  const handleMenuClose = () => setMenuAnchor(null);
  const handleMenuAction = (action: () => void) => {
    handleMenuClose();
    action();
  };

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center">
        {/* Upload HSBC Statement — primary action */}
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

        {/* Upload Envelopes — primary action */}
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

        {/* More actions context menu */}
        {hasContextMenuItems && (
          <>
            <Tooltip title="More actions">
              <IconButton onClick={handleMenuOpen} size="large">
                <MoreVertIcon />
              </IconButton>
            </Tooltip>

            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={handleMenuClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              {showUploadAndEntry && (
                <MenuItem
                  onClick={() => handleMenuAction(onAddOneOffContribution)}
                >
                  <ListItemIcon>
                    <AddIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Add One Off Contribution</ListItemText>
                </MenuItem>
              )}

              {showHistory && (
                <MenuItem
                  onClick={() => handleMenuAction(onExportContributions)}
                  disabled={isExporting}
                >
                  <ListItemIcon>
                    {isExporting ? (
                      <CircularProgress size={16} />
                    ) : (
                      <DownloadIcon fontSize="small" />
                    )}
                  </ListItemIcon>
                  <ListItemText>
                    {isExporting ? 'Exporting...' : 'Export Members Contributions'}
                  </ListItemText>
                </MenuItem>
              )}

              {showHistory && (
                <MenuItem
                  onClick={() => handleMenuAction(onViewBatchHistory)}
                >
                  <ListItemIcon>
                    <HistoryIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>View Envelopes Upload History</ListItemText>
                </MenuItem>
              )}
            </Menu>
          </>
        )}
      </Stack>
    </Box>
  );
};

export default FinancialActionsHeader;
