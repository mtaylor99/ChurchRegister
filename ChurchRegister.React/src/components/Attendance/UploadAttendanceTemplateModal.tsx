import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  AlertTitle,
  CircularProgress,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Paper,
  Stack,
  Chip,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  Download as DownloadIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material';
import { attendanceService } from '../../services/attendanceService';
import type {
  UploadAttendanceTemplateResponse,
  AttendanceUploadSummary,
  UploadError,
} from '../../types/attendance';

export interface UploadAttendanceTemplateModalProps {
  /**
   * Controls modal open state
   */
  open: boolean;
  /**
   * Called when modal should close
   */
  onClose: () => void;
  /**
   * Called when upload is successful
   */
  onUploadSuccess?: () => void;
}

/**
 * Modal component for uploading attendance template Excel files
 */
export const UploadAttendanceTemplateModal: React.FC<
  UploadAttendanceTemplateModalProps
> = ({ open, onClose, onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] =
    useState<UploadAttendanceTemplateResponse | null>(null);
  const [validationError, setValidationError] = useState<string>('');

  // File size limit: 5MB
  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  /**
   * Validate file type and size
   */
  const validateFile = (file: File): string | null => {
    // Check file extension
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      return 'Invalid file type. Please select an Excel file (.xlsx)';
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return `File size (${sizeMB}MB) exceeds maximum allowed size of 5MB`;
    }

    return null;
  };

  /**
   * Handle file selection
   */
  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      setValidationError(error);
      setSelectedFile(null);
      return;
    }

    setValidationError('');
    setSelectedFile(file);
    setUploadResult(null);
  };

  /**
   * Handle file input change
   */
  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  /**
   * Handle drag over event
   */
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  /**
   * Handle drag leave event
   */
  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  /**
   * Handle file drop
   */
  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, []);

  /**
   * Handle upload button click
   */
  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setValidationError('');

    try {
      const result =
        await attendanceService.uploadAttendanceTemplate(selectedFile);
      setUploadResult(result);

      // If successful, notify parent
      if (result.success) {
        onUploadSuccess?.();
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setValidationError(
        'Upload failed. Please check your network connection and try again.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Handle modal close
   */
  const handleClose = () => {
    if (!isUploading) {
      setSelectedFile(null);
      setUploadResult(null);
      setValidationError('');
      setIsDragging(false);
      onClose();
    }
  };

  /**
   * Handle download template
   */
  const handleDownloadTemplate = () => {
    // TODO: Implement template download endpoint
    // For now, show a message
    alert(
      'Template download feature coming soon. Please contact your administrator for the template file.'
    );
  };

  /**
   * Format file size for display
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  /**
   * Render upload results summary
   */
  const renderSummary = (summary: AttendanceUploadSummary) => (
    <Box sx={{ mt: 2 }}>
      <Alert severity={uploadResult?.success ? 'success' : 'warning'}>
        <AlertTitle>
          {uploadResult?.success
            ? 'Upload Successful'
            : 'Upload Completed with Issues'}
        </AlertTitle>
        <Stack spacing={1} sx={{ mt: 1 }}>
          <Typography variant="body2">
            <strong>Total Rows:</strong> {summary.totalRows}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {summary.recordsCreated > 0 && (
              <Chip
                label={`${summary.recordsCreated} Created`}
                color="success"
                size="small"
                variant="outlined"
              />
            )}
            {summary.recordsUpdated > 0 && (
              <Chip
                label={`${summary.recordsUpdated} Updated`}
                color="info"
                size="small"
                variant="outlined"
              />
            )}
            {summary.recordsSkipped > 0 && (
              <Chip
                label={`${summary.recordsSkipped} Skipped`}
                color="default"
                size="small"
                variant="outlined"
              />
            )}
            {summary.recordsFailed > 0 && (
              <Chip
                label={`${summary.recordsFailed} Failed`}
                color="error"
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        </Stack>
      </Alert>
    </Box>
  );

  /**
   * Render error list
   */
  const renderErrors = (errors: UploadError[]) => {
    if (errors.length === 0) return null;

    return (
      <Accordion defaultExpanded={errors.length > 0}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ErrorIcon color="error" />
            <Typography variant="subtitle1" fontWeight="bold">
              Errors ({errors.length})
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <List dense>
            {errors.map((error, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemText
                    primary={`Row ${error.row}: ${error.message}`}
                    secondary={
                      <>
                        {error.event && (
                          <Typography component="span" variant="body2">
                            Event: {error.event}
                          </Typography>
                        )}
                        {error.date && (
                          <Typography component="span" variant="body2">
                            {error.event && ' | '}
                            Date: {error.date}
                          </Typography>
                        )}
                      </>
                    }
                  />
                </ListItem>
                {index < errors.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>
    );
  };

  /**
   * Render warning list
   */
  const renderWarnings = (warnings: string[]) => {
    if (warnings.length === 0) return null;

    return (
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon color="warning" />
            <Typography variant="subtitle1" fontWeight="bold">
              Warnings ({warnings.length})
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <List dense>
            {warnings.map((warning, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemText primary={warning} />
                </ListItem>
                {index < warnings.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={isUploading}
    >
      <DialogTitle>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h5" component="div">
            Upload Attendance Template
          </Typography>
          <IconButton onClick={handleClose} disabled={isUploading} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          {/* Instructions */}
          <Alert severity="info">
            <AlertTitle>Instructions</AlertTitle>
            <Typography variant="body2">
              Upload an Excel (.xlsx) file with attendance data. The template
              must have event names in row 2 and dates in column A starting from
              row 3.
            </Typography>
          </Alert>

          {/* Download Template Button */}
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadTemplate}
              disabled={isUploading}
            >
              Download Template
            </Button>
          </Box>

          {/* File Drop Zone */}
          {!uploadResult && (
            <Paper
              variant="outlined"
              sx={{
                p: 4,
                textAlign: 'center',
                borderStyle: 'dashed',
                borderWidth: 2,
                borderColor: isDragging
                  ? 'primary.main'
                  : validationError
                    ? 'error.main'
                    : 'grey.300',
                bgcolor: isDragging ? 'action.hover' : 'background.paper',
                cursor: isUploading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
              }}
              onDragOver={!isUploading ? handleDragOver : undefined}
              onDragLeave={!isUploading ? handleDragLeave : undefined}
              onDrop={!isUploading ? handleDrop : undefined}
              onClick={() => {
                if (!isUploading) {
                  document.getElementById('file-input')?.click();
                }
              }}
            >
              <input
                id="file-input"
                type="file"
                accept=".xlsx"
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
                disabled={isUploading}
              />

              <CloudUploadIcon
                sx={{ fontSize: 64, color: 'grey.400', mb: 2 }}
              />
              <Typography variant="h6" gutterBottom>
                {isDragging
                  ? 'Drop file here'
                  : 'Drag and drop file here, or click to select'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Supported format: .xlsx (Excel)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Maximum file size: 5MB
              </Typography>

              {selectedFile && (
                <Box sx={{ mt: 3 }}>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <FileIcon color="primary" />
                    <Box sx={{ textAlign: 'left' }}>
                      <Typography variant="subtitle2">
                        {selectedFile.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatFileSize(selectedFile.size)}
                      </Typography>
                    </Box>
                    <CheckCircleIcon color="success" sx={{ ml: 1 }} />
                  </Paper>
                </Box>
              )}
            </Paper>
          )}

          {/* Validation Error */}
          {validationError && (
            <Alert severity="error">
              <AlertTitle>Validation Error</AlertTitle>
              {validationError}
            </Alert>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress size={40} sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Uploading and processing file...
              </Typography>
              <LinearProgress sx={{ mt: 2 }} />
            </Box>
          )}

          {/* Upload Results */}
          {uploadResult && (
            <>
              {renderSummary(uploadResult.summary)}
              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <Box sx={{ mt: 2 }}>{renderErrors(uploadResult.errors)}</Box>
              )}
              {uploadResult.warnings && uploadResult.warnings.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  {renderWarnings(uploadResult.warnings)}
                </Box>
              )}
            </>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isUploading}>
          {uploadResult ? 'Close' : 'Cancel'}
        </Button>
        {!uploadResult && (
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            startIcon={
              isUploading ? <CircularProgress size={16} /> : <CloudUploadIcon />
            }
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default UploadAttendanceTemplateModal;
