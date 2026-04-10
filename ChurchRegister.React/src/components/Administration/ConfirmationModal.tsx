import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  IconButton,
  Typography,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

export interface ConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'warning' | 'error' | 'info';
  loading?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const variantConfig = {
  warning: {
    icon: <WarningIcon />,
    color: '#f59e0b',
    confirmColor: 'warning' as const,
  },
  error: {
    icon: <ErrorIcon />,
    color: '#ef4444',
    confirmColor: 'error' as const,
  },
  info: {
    icon: <InfoIcon />,
    color: '#2196f3',
    confirmColor: 'primary' as const,
  },
};

export const ConfirmationModal = React.memo(function ConfirmationModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  loading = false,
  maxWidth = 'sm',
}: ConfirmationModalProps) {
  const config = variantConfig[variant];

  const handleConfirm = () => {
    if (!loading) {
      onConfirm();
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={maxWidth}
      fullWidth
      aria-labelledby="confirmation-dialog-title"
      aria-describedby="confirmation-dialog-description"
    >
      <DialogTitle
        id="confirmation-dialog-title"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
              color: config.color,
            }}
          >
            {config.icon}
          </Box>
          <Typography variant="h6" component="span">
            {title}
          </Typography>
        </Box>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          disabled={loading}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <DialogContentText
          id="confirmation-dialog-description"
          sx={{ color: 'text.primary' }}
        >
          {message}
        </DialogContentText>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          variant="outlined"
          color="inherit"
        >
          {cancelText}
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={loading}
          variant="contained"
          color={config.confirmColor}
          startIcon={
            loading ? <CircularProgress size={16} color="inherit" /> : undefined
          }
        >
          {loading ? 'Processing...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

/**
 * Generate Register Numbers Component
 * Admin interface for generating annual register numbers
 */

import {
  Card,
  CardContent,
  CardActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  AlertTitle,
  Snackbar,
} from '@mui/material';
import {
  Numbers as NumbersIcon,
  Preview as PreviewIcon,
  CheckCircle as CheckCircleIcon,
  GetApp as DownloadIcon,
} from '@mui/icons-material';
import { registerNumberService } from '../../services/attendanceService';
import type { PreviewRegisterNumbersResponse } from '../../types/administration';
import { useAuthPermissions } from '../../contexts/useAuth';

export interface GenerateRegisterNumbersProps {
  onGenerationSuccess?: () => void;
}

export const GenerateRegisterNumbers: React.FC<
  GenerateRegisterNumbersProps
> = ({ onGenerationSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [alreadyGenerated, setAlreadyGenerated] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [previewData, setPreviewData] =
    useState<PreviewRegisterNumbersResponse | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { hasAnyRole } = useAuthPermissions();

  const targetYear = new Date().getFullYear() + 1; // Generate for next calendar year

  const canAccess = hasAnyRole([
    'SystemAdministration',
    'FinancialAdministrator',
  ]);

  React.useEffect(() => {
    if (canAccess) {
      checkIfAlreadyGenerated();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAccess]);

  const checkIfAlreadyGenerated = async () => {
    try {
      const status =
        await registerNumberService.getGenerationStatus(targetYear);
      setAlreadyGenerated(status.isGenerated);
    } catch (_error) {
      setAlreadyGenerated(false);
    }
  };

  const handlePreview = async () => {
    setLoading(true);
    try {
      const preview =
        await registerNumberService.previewRegisterNumbers(targetYear);
      setPreviewData(preview);
      setShowPreviewModal(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to load preview'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmGeneration = async () => {
    setLoading(true);
    setShowConfirmModal(false);
    try {
      const result = await registerNumberService.generateRegisterNumbers({
        targetYear,
        confirmGeneration: true,
      });

      setSuccessMessage(
        `Successfully generated ${result.totalMembersAssigned} Baptised Member numbers, ${result.totalNonBaptisedMembersAssigned} Non-Baptised Member numbers, and ${result.totalNonMembersAssigned} Non-Member numbers for ${result.year}`
      );
      setAlreadyGenerated(true);

      if (onGenerationSuccess) {
        onGenerationSuccess();
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Failed to generate membership numbers'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleExportPreview = () => {
    if (!previewData) return;

    const headers = ['Register Number', 'Type', 'Member Name', 'Member Since'];
    const allAssignments = [
      ...previewData.members,
      ...previewData.nonBaptisedMembers,
      ...previewData.nonMembers,
    ].sort((a, b) => a.registerNumber - b.registerNumber);

    const rows = allAssignments.map((a) => [
      a.registerNumber,
      a.memberType,
      `"${a.memberName}"`,
      a.memberSince ? new Date(a.memberSince).toLocaleDateString('en-GB') : '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const now = new Date();
    const timestamp = now
      .toISOString()
      .replace(/[-:]/g, '')
      .replace('T', '-')
      .substring(0, 15);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `register-numbers-${targetYear}-${timestamp}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!canAccess) {
    return null;
  }

  return (
    <>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <NumbersIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
            <Box>
              <Typography variant="h6">
                Generate New Membership Numbers
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Annual membership number generation for {targetYear}
              </Typography>
            </Box>
          </Box>

          {alreadyGenerated ? (
            <Alert severity="success" icon={<CheckCircleIcon />}>
              <AlertTitle>Already Generated</AlertTitle>
              Membership numbers for {targetYear} have already been generated.
              You can preview them using the button below.
            </Alert>
          ) : (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                <AlertTitle>
                  Generate New Membership Numbers for {targetYear}
                </AlertTitle>
                This will assign sequential numbers to all active church
                members. Baptised Members receive numbers 1-249; Non-Baptised
                Members receive numbers 250-499; Non-Members receive numbers
                500+. This action cannot be undone.
              </Alert>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <strong>Important:</strong> Only active members will receive
                numbers. Inactive members are excluded.
              </Alert>
            </>
          )}
        </CardContent>
        <CardActions>
          <Button
            startIcon={<PreviewIcon />}
            onClick={handlePreview}
            disabled={loading}
            variant="outlined"
          >
            {loading ? 'Loading...' : 'Preview'}
          </Button>
          {!alreadyGenerated && (
            <Button
              startIcon={<NumbersIcon />}
              onClick={() => setShowConfirmModal(true)}
              disabled={loading || alreadyGenerated}
              variant="contained"
              color="primary"
            >
              Generate for {targetYear}
            </Button>
          )}
        </CardActions>
      </Card>

      {/* Preview Modal */}
      <Dialog
        open={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            Membership Numbers Preview — {targetYear}
            {previewData && (
              <>
                <Chip
                  label={`${previewData.totalMembers} Baptised Members`}
                  color="primary"
                  size="small"
                />
                <Chip
                  label={`${previewData.totalNonBaptisedMembers} Non-Baptised Members`}
                  color="info"
                  size="small"
                />
                <Chip
                  label={`${previewData.totalNonMembers} Non-Members`}
                  color="secondary"
                  size="small"
                />
              </>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : previewData ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Baptised Members section */}
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Members (Baptised) — Numbers 1 to {previewData.totalMembers}
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Number</TableCell>
                        <TableCell>Member Name</TableCell>
                        <TableCell>Current ({targetYear - 1})</TableCell>
                        <TableCell>Member Since</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {previewData.members.map((a) => (
                        <TableRow key={a.memberId}>
                          <TableCell>{a.registerNumber}</TableCell>
                          <TableCell>{a.memberName}</TableCell>
                          <TableCell>{a.currentNumber ?? '—'}</TableCell>
                          <TableCell>
                            {a.memberSince
                              ? new Date(a.memberSince).toLocaleDateString(
                                  'en-GB'
                                )
                              : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              {/* Non-Baptised Members section */}
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Members (Non-Baptised) — Numbers 250 to{' '}
                  {249 + previewData.totalNonBaptisedMembers}
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Number</TableCell>
                        <TableCell>Member Name</TableCell>
                        <TableCell>Current ({targetYear - 1})</TableCell>
                        <TableCell>Member Since</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {previewData.nonBaptisedMembers.map((a) => (
                        <TableRow key={a.memberId}>
                          <TableCell>{a.registerNumber}</TableCell>
                          <TableCell>{a.memberName}</TableCell>
                          <TableCell>{a.currentNumber ?? '—'}</TableCell>
                          <TableCell>
                            {a.memberSince
                              ? new Date(a.memberSince).toLocaleDateString(
                                  'en-GB'
                                )
                              : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              {/* Non-Members section */}
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Non-Members — Numbers 500+
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Number</TableCell>
                        <TableCell>Member Name</TableCell>
                        <TableCell>Current ({targetYear - 1})</TableCell>
                        <TableCell>Member Since</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {previewData.nonMembers.map((a) => (
                        <TableRow key={a.memberId}>
                          <TableCell>{a.registerNumber}</TableCell>
                          <TableCell>{a.memberName}</TableCell>
                          <TableCell>{a.currentNumber ?? '—'}</TableCell>
                          <TableCell>
                            {a.memberSince
                              ? new Date(a.memberSince).toLocaleDateString(
                                  'en-GB'
                                )
                              : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Box>
          ) : (
            <Typography color="error">Failed to load preview</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            startIcon={<DownloadIcon />}
            onClick={handleExportPreview}
            disabled={!previewData}
          >
            Export CSV
          </Button>
          <Button
            onClick={() => setShowPreviewModal(false)}
            variant="contained"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Modal */}
      <ConfirmationModal
        open={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmGeneration}
        title="Confirm Membership Number Generation"
        message={`Are you sure you want to generate membership numbers for ${targetYear}? This will assign numbers to ${previewData?.totalMembers ?? 0} Baptised Members (1-249), ${previewData?.totalNonBaptisedMembers ?? 0} Non-Baptised Members (250-499), and ${previewData?.totalNonMembers ?? 0} Non-Members (500+). This action cannot be undone.`}
        confirmText="Generate"
        variant="warning"
        loading={loading}
      />

      {/* Success/Error Snackbars */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
      >
        <Alert severity="success" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!errorMessage}
        autoHideDuration={6000}
        onClose={() => setErrorMessage(null)}
      >
        <Alert severity="error" onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </>
  );
};
