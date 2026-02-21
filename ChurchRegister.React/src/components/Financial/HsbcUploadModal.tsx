import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import { hsbcTransactionsApi } from '../../services/api/hsbcTransactionsApi';
import type { UploadHsbcStatementResponse } from '../../types/hsbcTransactions';

interface HsbcUploadModalProps {
  open: boolean;
  onClose: () => void;
  onUploadSuccess?: () => void;
}

/**
 * Modal dialog for uploading HSBC bank statement CSV files
 */
export const HsbcUploadModal: React.FC<HsbcUploadModalProps> = ({
  open,
  onClose,
  onUploadSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UploadHsbcStatementResponse | null>(
    null
  );

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setProgress(0);
    setResult(null);

    try {
      const response = await hsbcTransactionsApi.uploadHsbcStatement(
        selectedFile,
        (percent) => setProgress(percent)
      );

      setResult(response);

      // Notify parent of successful upload
      if (response.success && onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Failed to upload file',
        errors: [
          error instanceof Error ? error.message : 'Unknown error occurred',
        ],
      });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setSelectedFile(null);
      setResult(null);
      setProgress(0);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box
          sx={{
            bgcolor: 'grey.100',
            p: 2,
            m: -3,
            mb: 0,
            borderRadius: '4px 4px 0 0',
          }}
        >
          <Typography variant="h5" color="primary.main" fontWeight="bold">
            {result ? 'Upload Complete' : 'Upload HSBC Bank Statement'}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        {!result ? (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select an HSBC CSV export file. The system will automatically
              extract credit transactions and detect duplicates.
            </Typography>

            <Box
              sx={{
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 1,
                p: 3,
                textAlign: 'center',
                bgcolor: 'background.default',
                mb: 2,
              }}
            >
              <input
                accept=".csv"
                style={{ display: 'none' }}
                id="csv-file-upload"
                type="file"
                onChange={handleFileSelect}
                disabled={uploading}
              />
              <label htmlFor="csv-file-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                  disabled={uploading}
                >
                  Select CSV File
                </Button>
              </label>

              {selectedFile && (
                <Typography variant="body2" sx={{ mt: 2 }}>
                  Selected: {selectedFile.name}
                </Typography>
              )}
            </Box>

            {uploading && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress variant="determinate" value={progress} />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  Uploading and processing... {progress}%
                </Typography>
              </Box>
            )}
          </>
        ) : (
          <Box>
            {result.success ? (
              <>
                <Alert severity="success" sx={{ mb: 3 }}>
                  <AlertTitle>Upload Successful</AlertTitle>
                  {result.message}
                </Alert>

                {result.summary && (
                  <Box
                    sx={{
                      bgcolor: 'background.default',
                      borderRadius: 1,
                      p: 2,
                    }}
                  >
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ color: 'text.primary', mb: 2 }}
                    >
                      Upload Summary
                    </Typography>
                    <List dense>
                      <ListItem
                        sx={{
                          bgcolor: 'background.paper',
                          borderRadius: 1,
                          mb: 1,
                        }}
                      >
                        <ListItemText
                          primary="Total Processed"
                          secondary={result.summary.totalProcessed}
                          secondaryTypographyProps={{
                            sx: { fontSize: '1.2rem', fontWeight: 'medium' },
                          }}
                        />
                      </ListItem>
                      <ListItem
                        sx={{
                          bgcolor: 'success.light',
                          color: 'success.contrastText',
                          borderRadius: 1,
                          mb: 1,
                        }}
                      >
                        <ListItemText
                          primary="New Transactions Imported"
                          secondary={result.summary.newTransactions}
                          primaryTypographyProps={{
                            sx: { color: 'success.dark', fontWeight: 'medium' },
                          }}
                          secondaryTypographyProps={{
                            sx: {
                              color: 'success.dark',
                              fontSize: '1.5rem',
                              fontWeight: 'bold',
                            },
                          }}
                        />
                      </ListItem>
                      <ListItem
                        sx={{
                          bgcolor: 'background.paper',
                          borderRadius: 1,
                          mb: 1,
                        }}
                      >
                        <ListItemText
                          primary="Duplicates Skipped"
                          secondary={result.summary.duplicatesSkipped}
                          secondaryTypographyProps={{
                            sx: { fontSize: '1.2rem', fontWeight: 'medium' },
                          }}
                        />
                      </ListItem>
                      <ListItem
                        sx={{
                          bgcolor: 'background.paper',
                          borderRadius: 1,
                        }}
                      >
                        <ListItemText
                          primary="Ignored (No Credit Amount)"
                          secondary={result.summary.ignoredNoMoneyIn}
                          secondaryTypographyProps={{
                            sx: { fontSize: '1.2rem', fontWeight: 'medium' },
                          }}
                        />
                      </ListItem>
                    </List>
                  </Box>
                )}

                {result.processingSummary && (
                  <Box
                    sx={{
                      bgcolor: 'background.default',
                      borderRadius: 1,
                      p: 2,
                      mt: 3,
                    }}
                  >
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ color: 'text.primary', mb: 2 }}
                    >
                      Contribution Processing Summary
                    </Typography>
                    <List dense>
                      <ListItem
                        sx={{
                          bgcolor: 'success.light',
                          color: 'success.contrastText',
                          borderRadius: 1,
                          mb: 1,
                        }}
                      >
                        <ListItemText
                          primary="Matched to Members"
                          secondary={
                            result.processingSummary.matchedTransactions
                          }
                          primaryTypographyProps={{
                            sx: { color: 'success.dark', fontWeight: 'medium' },
                          }}
                          secondaryTypographyProps={{
                            sx: {
                              color: 'success.dark',
                              fontSize: '1.5rem',
                              fontWeight: 'bold',
                            },
                          }}
                        />
                      </ListItem>
                      <ListItem
                        sx={{
                          bgcolor: 'background.paper',
                          borderRadius: 1,
                          mb: 1,
                        }}
                      >
                        <ListItemText
                          primary="Total Amount Processed"
                          secondary={`£${result.processingSummary.totalAmountProcessed.toFixed(2)}`}
                          secondaryTypographyProps={{
                            sx: { fontSize: '1.2rem', fontWeight: 'medium' },
                          }}
                        />
                      </ListItem>
                      <ListItem
                        sx={{
                          bgcolor: 'background.paper',
                          borderRadius: 1,
                          mb: 1,
                        }}
                      >
                        <ListItemText
                          primary="Unmatched Transactions"
                          secondary={
                            result.processingSummary.unmatchedTransactions
                          }
                          secondaryTypographyProps={{
                            sx: { fontSize: '1.2rem', fontWeight: 'medium' },
                          }}
                        />
                      </ListItem>
                    </List>

                    {result.processingSummary.unmatchedTransactions > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography
                          variant="subtitle2"
                          gutterBottom
                          sx={{ color: 'warning.main', fontWeight: 'medium' }}
                        >
                          Unmatched Bank References:
                        </Typography>
                        <List dense>
                          {result.processingSummary.unmatchedReferences.map(
                            (ref, index) => (
                              <ListItem
                                key={index}
                                sx={{
                                  bgcolor: 'warning.light',
                                  borderRadius: 1,
                                  mb: 0.5,
                                }}
                              >
                                <ListItemText
                                  primary={ref}
                                  primaryTypographyProps={{
                                    sx: {
                                      fontFamily: 'monospace',
                                      color: 'warning.dark',
                                    },
                                  }}
                                />
                              </ListItem>
                            )
                          )}
                        </List>
                      </Box>
                    )}
                  </Box>
                )}
              </>
            ) : (
              <>
                <Alert severity="error" sx={{ mb: 2 }}>
                  <AlertTitle>Upload Failed</AlertTitle>
                  {result.message}
                </Alert>

                {result.errors && result.errors.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom color="error">
                      Errors:
                    </Typography>
                    <List dense>
                      {result.errors.map((error, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={error}
                            primaryTypographyProps={{ color: 'error' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        {!result ? (
          <>
            <Button onClick={handleClose} disabled={uploading}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              variant="contained"
              disabled={!selectedFile || uploading}
              startIcon={<CloudUploadIcon />}
            >
              Upload
            </Button>
          </>
        ) : (
          <Button onClick={handleClose} variant="contained">
            Close
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

/**
 * Envelope Batch Entry Component
 * Rapid data entry interface for weekly envelope contributions
 */

import {
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  UploadFile as UploadFileIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { envelopeContributionService } from '../../services/attendanceService';
import { enGB } from 'date-fns/locale';
import { parseEnvelopeTemplate } from '../../services/envelopeTemplateParser';
import { useNotification } from '../../contexts/NotificationContext';

interface EnvelopeRow {
  id: string;
  registerNumber: string;
  memberName: string;
  amount: string;
  isValidating: boolean;
  isValid: boolean;
  error?: string;
  amountError?: string;
}

interface EnvelopeBatchEntryProps {
  onSubmitSuccess?: (batchId: number) => void;
  onCancel?: () => void;
}

export const EnvelopeBatchEntry: React.FC<EnvelopeBatchEntryProps> = ({
  onSubmitSuccess,
  onCancel,
}) => {
  const { showSuccess, showError, showWarning } = useNotification();
  const [collectionDate, setCollectionDate] = useState<Date | null>(null);
  const [envelopes, setEnvelopes] = useState<EnvelopeRow[]>([
    {
      id: '1',
      registerNumber: '',
      memberName: '',
      amount: '',
      isValidating: false,
      isValid: false,
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const gridContainerRef = React.useRef<HTMLDivElement>(null);

  // Calculate totals
  const totalEnvelopes = envelopes.filter(
    (e) => e.registerNumber && e.amount && e.isValid
  ).length;
  const totalAmount = envelopes
    .filter((e) => e.amount && e.isValid)
    .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  // Check if any validations are in progress
  const isValidating = envelopes.some((e) => e.isValidating);

  // Check if Sunday
  const isSunday = (date: Date | null) => {
    if (!date) return false;
    return date.getDay() === 0;
  };

  // Validate member number
  const handleRegisterNumberBlur = async (rowId: string) => {
    const envelope = envelopes.find((e) => e.id === rowId);
    if (!envelope || !envelope.registerNumber) return;

    const registerNumber = parseInt(envelope.registerNumber);
    if (isNaN(registerNumber)) {
      updateEnvelope(rowId, {
        error: 'Invalid member number',
        isValid: false,
      });
      return;
    }

    // Set validating state
    updateEnvelope(rowId, { isValidating: true, error: undefined });

    try {
      const result =
        await envelopeContributionService.validateRegisterNumberForCurrentYear(
          registerNumber
        );

      if (result.valid) {
        updateEnvelope(rowId, {
          memberName: result.memberName || '',
          isValid: true,
          isValidating: false,
          error: undefined,
        });
        // Focus on amount field
        setTimeout(() => {
          document.getElementById(`amount-${rowId}`)?.focus();
        }, 100);
      } else {
        updateEnvelope(rowId, {
          memberName: '',
          isValid: false,
          isValidating: false,
          error: result.error || 'Invalid member number',
        });
      }
    } catch (error) {
      updateEnvelope(rowId, {
        memberName: '',
        isValid: false,
        isValidating: false,
        error: 'Validation failed',
      });
    }
  };

  // Update envelope row
  const updateEnvelope = (rowId: string, updates: Partial<EnvelopeRow>) => {
    setEnvelopes((prev) =>
      prev.map((e) => (e.id === rowId ? { ...e, ...updates } : e))
    );
  };

  // Handle member number change
  const handleRegisterNumberChange = (rowId: string, value: string) => {
    updateEnvelope(rowId, {
      registerNumber: value,
      memberName: '',
      isValid: false,
      error: undefined,
    });
  };

  // Handle amount change
  const handleAmountChange = (rowId: string, value: string) => {
    const amount = parseFloat(value);
    if (value && (isNaN(amount) || amount <= 0)) {
      updateEnvelope(rowId, {
        amount: value,
        amountError: 'Amount must be greater than 0',
      });
    } else {
      updateEnvelope(rowId, { amount: value, amountError: undefined });
    }
  };

  // Handle amount blur - move to next row
  const handleAmountBlur = (rowId: string) => {
    const currentIndex = envelopes.findIndex((e) => e.id === rowId);
    const currentEnvelope = envelopes[currentIndex];

    // If this is the last row and has valid data, add a new row
    if (
      currentIndex === envelopes.length - 1 &&
      currentEnvelope.registerNumber &&
      currentEnvelope.amount &&
      currentEnvelope.isValid
    ) {
      addRow();
    }
  };

  // Handle Enter key
  const handleKeyDown = (
    e: React.KeyboardEvent,
    rowId: string,
    field: 'registerNumber' | 'amount'
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (field === 'registerNumber') {
        handleRegisterNumberBlur(rowId);
      } else if (field === 'amount') {
        const currentIndex = envelopes.findIndex((env) => env.id === rowId);
        if (currentIndex < envelopes.length - 1) {
          // Focus next row's member number
          setTimeout(() => {
            document
              .getElementById(
                `registerNumber-${envelopes[currentIndex + 1].id}`
              )
              ?.focus();
          }, 100);
        } else {
          // Add new row and focus it
          const newId = Date.now().toString();
          setEnvelopes((prev) => [
            ...prev,
            {
              id: newId,
              registerNumber: '',
              memberName: '',
              amount: '',
              isValidating: false,
              isValid: false,
            },
          ]);
          setTimeout(() => {
            document.getElementById(`registerNumber-${newId}`)?.focus();
          }, 100);
        }
      }
    }
  };

  // Add new row
  const addRow = () => {
    const newId = Date.now().toString();
    setEnvelopes((prev) => [
      ...prev,
      {
        id: newId,
        registerNumber: '',
        memberName: '',
        amount: '',
        isValidating: false,
        isValid: false,
      },
    ]);
  };

  // Delete row
  const deleteRow = (rowId: string) => {
    if (envelopes.length > 1) {
      setEnvelopes((prev) => prev.filter((e) => e.id !== rowId));
    }
  };

  // Validate form
  const canSubmit = () => {
    return (
      collectionDate &&
      isSunday(collectionDate) &&
      totalEnvelopes > 0 &&
      !envelopes.some((e) => e.error || e.amountError) &&
      !isSubmitting &&
      !isValidating
    );
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!canSubmit() || !collectionDate) return;

    setIsSubmitting(true);

    try {
      const validEnvelopes = envelopes.filter(
        (e) => e.registerNumber && e.amount && e.isValid
      );

      // Debug logging to see what's being filtered
      console.log('Total envelopes:', envelopes.length);
      console.log('Valid envelopes:', validEnvelopes.length);
      console.log('Envelope states:', envelopes.map(e => ({
        id: e.id,
        registerNumber: e.registerNumber,
        amount: e.amount,
        isValid: e.isValid,
        isValidating: e.isValidating,
        error: e.error
      })));

      const request = {
        collectionDate: collectionDate.toISOString().split('T')[0],
        envelopes: validEnvelopes.map((e) => ({
          registerNumber: parseInt(e.registerNumber),
          amount: parseFloat(e.amount),
        })),
      };

      const result = await envelopeContributionService.submitBatch(request);

      // Success - clear form
      setEnvelopes([
        {
          id: '1',
          registerNumber: '',
          memberName: '',
          amount: '',
          isValidating: false,
          isValid: false,
        },
      ]);
      setCollectionDate(null);

      if (onSubmitSuccess) {
        onSubmitSuccess(result.batchId);
      }
    } catch (error) {
      // Error is already displayed by API client via toast notification
      console.error('Submit batch error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle upload button click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Handle template file upload
  const handleTemplateUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // Parse the template
      const parseResult = await parseEnvelopeTemplate(file);

      // Display errors if parsing failed
      if (!parseResult.success || parseResult.errors.length > 0) {
        parseResult.errors.forEach((error) => {
          showError(error.message);
        });
        return;
      }

      // Display warnings if any
      if (parseResult.warnings.length > 0) {
        const warningMessage =
          parseResult.warnings.length === 1
            ? parseResult.warnings[0].message
            : `${parseResult.warnings.length} rows had issues and were skipped. Check the data and try again if needed.`;
        showWarning(warningMessage);
      }

      // Update collection date
      if (parseResult.collectionDate) {
        setCollectionDate(parseResult.collectionDate);
      }

      // Clear existing rows and populate from template
      const newEnvelopes: EnvelopeRow[] = parseResult.envelopes.map(
        (envelope, index) => ({
          id: `uploaded-${Date.now()}-${index}`,
          registerNumber: envelope.registerNumber.toString(),
          memberName: '',
          amount: envelope.amount.toString(),
          isValidating: false,
          isValid: false,
        })
      );

      setEnvelopes(newEnvelopes);

      // Scroll to top of grid after populating
      setTimeout(() => {
        gridContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }, 150);

      // Trigger validation for all rows in parallel and wait for completion
      setTimeout(async () => {
        try {
          // Validate all rows - collect results instead of updating state individually
          const validationResults = await Promise.all(
            newEnvelopes.map(async (env) => {
              const registerNumber = parseInt(env.registerNumber);
              if (isNaN(registerNumber)) {
                return {
                  id: env.id,
                  memberName: '',
                  isValid: false,
                  error: 'Invalid member number',
                };
              }

              try {
                const result =
                  await envelopeContributionService.validateRegisterNumberForCurrentYear(
                    registerNumber
                  );

                return {
                  id: env.id,
                  memberName: result.memberName || '',
                  isValid: result.valid,
                  error: result.valid ? undefined : 'Validation failed',
                };
              } catch (error) {
                return {
                  id: env.id,
                  memberName: '',
                  isValid: false,
                  error: 'Validation failed',
                };
              }
            })
          );

          // Apply all validation results in a single state update
          setEnvelopes((prev) =>
            prev.map((env) => {
              const result = validationResults.find((r) => r.id === env.id);
              if (!result) return env;

              return {
                ...env,
                memberName: result.memberName,
                isValid: result.isValid,
                error: result.error,
                isValidating: false,
              };
            })
          );

          // Count validation results
          const validCount = validationResults.filter((r) => r.isValid).length;
          const invalidCount = validationResults.filter((r) => !r.isValid)
            .length;

          console.log('Validation complete:', {
            total: validationResults.length,
            valid: validCount,
            invalid: invalidCount,
          });

          if (validCount === 0 && invalidCount > 0) {
            showError(
              `All ${invalidCount} register numbers failed validation. Please check the numbers and try again.`
            );
          } else if (invalidCount > 0) {
            showWarning(
              `${invalidCount} register number(s) failed validation. Please review the entries with errors.`
            );
          }

          // Show success message after all validations complete
          showSuccess(
            `Template uploaded successfully. ${parseResult.envelopes.length} envelopes loaded. Please review and submit.`
          );
        } catch (error) {
          console.error('Validation error:', error);
          // Success message shown anyway since parsing succeeded
          showSuccess(
            `Template uploaded successfully. ${parseResult.envelopes.length} envelopes loaded. Please review and submit.`
          );
        }
      }, 200);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to process template file';
      showError(errorMessage);
    } finally {
      setIsUploading(false);
      // Reset file input to allow re-uploading the same file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enGB}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Envelope Batch Entry
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Enter weekly envelope contributions for Sunday collections
        </Typography>

        {/* Warning Message */}
        <Alert severity="warning" sx={{ mb: 3 }}>
          Batches cannot be edited or deleted after submission. Please verify
          all entries before submitting.
        </Alert>

        {/* Upload Template Button */}
        <Box sx={{ mb: 3 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={handleTemplateUpload}
            style={{ display: 'none' }}
          />
          <Button
            variant="outlined"
            startIcon={
              isUploading ? (
                <CircularProgress size={20} />
              ) : (
                <UploadFileIcon />
              )
            }
            onClick={handleUploadClick}
            disabled={isUploading || isSubmitting}
          >
            {isUploading ? 'Uploading...' : 'Upload Template'}
          </Button>
        </Box>

        {/* Collection Date */}
        <Box sx={{ mb: 3 }}>
          <DatePicker
            label="Collection Date (Sunday)"
            value={collectionDate}
            onChange={setCollectionDate}
            shouldDisableDate={(date) => date.getDay() !== 0}
            slotProps={{
              textField: {
                fullWidth: true,
                error: collectionDate ? !isSunday(collectionDate) : false,
                helperText:
                  collectionDate && !isSunday(collectionDate)
                    ? 'Collection date must be a Sunday'
                    : '',
              },
            }}
          />
        </Box>

        {/* Envelope Entry Grid */}
        <TableContainer
          component={Paper}
          sx={{ mb: 3, maxHeight: '500px', overflow: 'auto' }}
          ref={gridContainerRef}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width="150px">Member Number</TableCell>
                <TableCell width="150px">Amount (£)</TableCell>
                <TableCell width="80px" align="center">
                  Validated
                </TableCell>
                <TableCell width="60px" align="center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {envelopes.map((envelope, index) => (
                <TableRow key={envelope.id}>
                  <TableCell>
                    <TextField
                      id={`registerNumber-${envelope.id}`}
                      size="small"
                      fullWidth
                      value={envelope.registerNumber}
                      onChange={(e) =>
                        handleRegisterNumberChange(envelope.id, e.target.value)
                      }
                      onBlur={() => handleRegisterNumberBlur(envelope.id)}
                      onKeyDown={(e) =>
                        handleKeyDown(e, envelope.id, 'registerNumber')
                      }
                      error={!!envelope.error}
                      disabled={isSubmitting}
                      autoFocus={index === 0}
                      helperText={envelope.error}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      id={`amount-${envelope.id}`}
                      size="small"
                      fullWidth
                      type="number"
                      value={envelope.amount}
                      onChange={(e) =>
                        handleAmountChange(envelope.id, e.target.value)
                      }
                      onBlur={() => handleAmountBlur(envelope.id)}
                      onKeyDown={(e) => handleKeyDown(e, envelope.id, 'amount')}
                      disabled={!envelope.isValid || isSubmitting}
                      inputProps={{ min: 0, step: 0.01 }}
                      error={!!envelope.amountError}
                      helperText={envelope.amountError}
                    />
                  </TableCell>
                  <TableCell align="center">
                    {envelope.isValidating ? (
                      <CircularProgress size={20} />
                    ) : envelope.isValid &&
                      envelope.amount &&
                      !envelope.amountError ? (
                      <Tooltip title="Valid">
                        <CheckCircleIcon color="success" />
                      </Tooltip>
                    ) : envelope.error || envelope.amountError ? (
                      <Tooltip
                        title={
                          envelope.error || envelope.amountError || 'Invalid'
                        }
                      >
                        <ErrorIcon color="error" />
                      </Tooltip>
                    ) : null}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => deleteRow(envelope.id)}
                      disabled={envelopes.length === 1 || isSubmitting}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Totals and Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
          <Chip
            label={`Total Envelopes: ${totalEnvelopes}`}
            color="primary"
            variant="outlined"
          />
          <Chip
            label={`Total Amount: £${totalAmount.toFixed(2)}`}
            color="primary"
            variant="outlined"
          />
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!canSubmit()}
            size="large"
          >
            {isSubmitting ? (
              <CircularProgress size={24} />
            ) : isValidating ? (
              'Validating...'
            ) : (
              'Submit Upload'
            )}
          </Button>
          {onCancel && (
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={isSubmitting}
              size="large"
            >
              Cancel
            </Button>
          )}
        </Box>

        {/* Instructions */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="caption" color="text.secondary" display="block">
            <strong>Keyboard Shortcuts:</strong> Tab = Next Field | Enter = Next
            Row
          </Typography>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};
