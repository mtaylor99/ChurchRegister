import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  Avatar,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Paper,
  Stack,
} from '@mui/material';
import {
  UploadFile as UploadFileIcon,
  FileDownload as DownloadIcon,
  Print as PrintIcon,
  Receipt as ReceiptIcon,
  Add as AddEnvelopeIcon,
  History as HistoryIcon,
  Warning as WarningIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthPermissions } from '../../contexts/useAuth';
import { useNavigate } from 'react-router-dom';
import { HsbcUploadModal } from './HsbcUploadModal';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { enGB } from 'date-fns/locale';
import { envelopeContributionService } from '../../services/attendanceService';
import type {
  BatchSummary,
  GetBatchDetailsResponse,
} from '../../types/administration';

export interface BankStatementImportWidgetProps {
  onDataChange?: () => void;
}

/**
 * Dashboard widget for HSBC bank statement import
 */
export const BankStatementImportWidget: React.FC<
  BankStatementImportWidgetProps
> = ({ onDataChange }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { hasAnyRole } = useAuthPermissions();
  const queryClient = useQueryClient();

  // Only show to users with financial roles
  const canAccess = hasAnyRole([
    'SystemAdministration',
    'FinancialAdministrator',
    'FinancialContributor',
  ]);

  const handleUploadSuccess = () => {
    // Invalidate church members query to refresh contribution data
    queryClient.invalidateQueries({ queryKey: ['churchMembers'] });
    // Notify parent component to refresh its data (e.g., dashboard statistics)
    onDataChange?.();
  };

  if (!canAccess) {
    return null;
  }

  return (
    <>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 8,
          },
        }}
        onClick={() => setModalOpen(true)}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <UploadFileIcon
              sx={{ fontSize: 40, mr: 2, color: 'primary.main' }}
            />
            <Typography variant="h6" component="div">
              Import Bank Statement
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Upload HSBC bank statement CSV files to import credit transactions
            with automatic duplicate detection.
          </Typography>
        </CardContent>
        <CardActions>
          <Button
            size="small"
            variant="contained"
            startIcon={<UploadFileIcon />}
            onClick={(e) => {
              e.stopPropagation();
              setModalOpen(true);
            }}
            fullWidth
          >
            Upload HSBC Statement
          </Button>
        </CardActions>
      </Card>

      <HsbcUploadModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </>
  );
};

/**
 * Envelope Batch History Component
 * Display paginated list of envelope contribution batches
 */

interface EnvelopeBatchHistoryProps {
  onViewDetails?: (batchId: number) => void;
}

export const EnvelopeBatchHistory: React.FC<EnvelopeBatchHistoryProps> = () => {
  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const loadBatches = async () => {
    setLoading(true);
    try {
      const result = await envelopeContributionService.getBatchList(
        startDate?.toISOString().split('T')[0],
        endDate?.toISOString().split('T')[0],
        pageNumber,
        pageSize
      );
      setBatches(result.batches);
      setTotalCount(result.totalCount);
    } catch (error) {
      console.error('Failed to load batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearAllFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setPageNumber(1);
  };

  const hasActiveFilters = startDate !== null || endDate !== null;

  React.useEffect(() => {
    loadBatches();
  }, [pageNumber, pageSize, startDate, endDate]);

  const columns: GridColDef[] = [
    {
      field: 'batchDate',
      headerName: 'Batch Date',
      width: 130,
      valueFormatter: (value) =>
        value ? new Date(value).toLocaleDateString('en-GB') : '',
    },
    {
      field: 'totalAmount',
      headerName: 'Total Amount',
      width: 130,
      valueFormatter: (value: number) =>
        value != null ? `£${value.toFixed(2)}` : '£0.00',
    },
    {
      field: 'envelopeCount',
      headerName: 'Envelope Count',
      width: 140,
      align: 'center',
    },
    {
      field: 'submittedByName',
      headerName: 'Submitted By',
      width: 180,
    },
    {
      field: 'submittedDateTime',
      headerName: 'Submitted Date/Time',
      width: 180,
      valueFormatter: (value) => {
        if (!value) return 'N/A';
        try {
          return new Date(value).toLocaleString('en-GB');
        } catch {
          return 'Invalid Date';
        }
      },
    },
  ];

  return (
    <Box sx={{ width: '100%' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enGB}>
          <DatePicker
            label="Start Date"
            value={startDate}
            onChange={setStartDate}
            slotProps={{ textField: { size: 'small' } }}
          />
          <DatePicker
            label="End Date"
            value={endDate}
            onChange={setEndDate}
            slotProps={{ textField: { size: 'small' } }}
          />
        </LocalizationProvider>
        {hasActiveFilters && (
          <Button
            variant="outlined"
            onClick={clearAllFilters}
            startIcon={<ClearIcon />}
            sx={{ minWidth: 'fit-content', whiteSpace: 'nowrap' }}
          >
            Clear All
          </Button>
        )}
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Total Batches: {totalCount}
      </Typography>

      <DataGrid
        rows={batches}
        columns={columns}
        getRowId={(row) => row.batchId}
        loading={loading}
        pageSizeOptions={[25, 50, 100]}
        disableColumnMenu
        paginationModel={{ page: pageNumber - 1, pageSize }}
        onPaginationModelChange={(model) => {
          setPageNumber(model.page + 1);
          setPageSize(model.pageSize);
        }}
        rowCount={totalCount}
        paginationMode="server"
        sortingMode="client"
        initialState={{
          sorting: {
            sortModel: [{ field: 'batchDate', sort: 'desc' }],
          },
        }}
        sx={{ height: 600 }}
      />
    </Box>
  );
};

/**
 * Envelope Batch Details Modal
 * Display detailed information about a specific batch
 */

interface EnvelopeBatchDetailsModalProps {
  open: boolean;
  batchId: number | null;
  onClose: () => void;
}

export const EnvelopeBatchDetailsModal: React.FC<
  EnvelopeBatchDetailsModalProps
> = ({ open, batchId, onClose }) => {
  const [batchDetails, setBatchDetails] =
    useState<GetBatchDetailsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (open && batchId) {
      loadBatchDetails();
    }
  }, [open, batchId]);

  const loadBatchDetails = async () => {
    if (!batchId) return;

    setLoading(true);
    try {
      const result = await envelopeContributionService.getBatchDetails(batchId);
      setBatchDetails(result);
    } catch (error) {
      console.error('Failed to load batch details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!batchDetails) return;

    const headers = ['Member Number', 'Member Name', 'Amount'];
    const rows = batchDetails.envelopes.map((e) => [
      e.registerNumber,
      e.memberName,
      e.amount.toFixed(2),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `envelope-batch-${batchDetails.batchId}-${batchDetails.batchDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
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
            Envelope Batch Details
            {batchDetails &&
              ` - ${new Date(batchDetails.batchDate).toLocaleDateString('en-GB')}`}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : batchDetails ? (
          <>
            {/* Batch Summary */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Batch Summary
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip label={`Batch ID: ${batchDetails.batchId}`} />
                <Chip
                  label={`Total Amount: £${batchDetails.totalAmount.toFixed(2)}`}
                  color="primary"
                />
                <Chip
                  label={`Envelope Count: ${batchDetails.envelopeCount}`}
                  color="primary"
                />
                <Chip
                  label={`Status: ${batchDetails.status}`}
                  color="success"
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Submitted by {batchDetails.submittedBy} on{' '}
                {new Date(batchDetails.submittedDateTime).toLocaleString(
                  'en-GB'
                )}
              </Typography>
            </Box>

            {/* Envelope Details */}
            <Typography variant="h6" gutterBottom>
              Envelope Details
            </Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Member Number</TableCell>
                    <TableCell>Member Name</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {batchDetails.envelopes.map((envelope) => (
                    <TableRow key={envelope.contributionId}>
                      <TableCell>{envelope.registerNumber}</TableCell>
                      <TableCell>{envelope.memberName}</TableCell>
                      <TableCell align="right">
                        £{envelope.amount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Warning */}
            <Alert severity="warning" sx={{ mt: 3 }}>
              Batches cannot be edited or deleted after submission
            </Alert>
          </>
        ) : (
          <Typography color="error">Failed to load batch details</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          startIcon={<DownloadIcon />}
          onClick={handleExportCSV}
          disabled={!batchDetails}
        >
          Export to CSV
        </Button>
        <Button
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          disabled={!batchDetails}
        >
          Print Receipt
        </Button>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * Envelope Contribution Widget for Dashboard
 * Quick access to envelope batch features and statistics
 */

export interface EnvelopeContributionWidgetProps {
  onDataChange?: () => void;
}

export const EnvelopeContributionWidget: React.FC<
  EnvelopeContributionWidgetProps
> = () => {
  const [recentBatches, setRecentBatches] = useState<BatchSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    lastBatchDate: '',
    totalEnvelopesThisYear: 0,
    totalAmountThisYear: 0,
    daysSinceLastBatch: 0,
  });
  const { hasAnyRole } = useAuthPermissions();
  const navigate = useNavigate();

  // Only show to users with financial roles
  const canAccess = hasAnyRole([
    'SystemAdministration',
    'FinancialAdministrator',
    'FinancialContributor',
    'FinancialViewer',
  ]);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentYear = new Date().getFullYear();
      const startDate = `${currentYear}-01-01`;

      const result = await envelopeContributionService.getBatchList(
        startDate,
        undefined,
        1,
        5
      );

      setRecentBatches(result.batches);

      // Calculate stats
      if (result.batches.length > 0) {
        const lastBatch = result.batches[0];
        const lastDate = new Date(lastBatch.batchDate);
        const daysSince = Math.floor(
          (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Get all batches for current year to calculate totals
        const allBatches = await envelopeContributionService.getBatchList(
          startDate,
          undefined,
          1,
          1000
        );

        const totalEnvelopes = allBatches.batches.reduce(
          (sum, b) => sum + b.envelopeCount,
          0
        );
        const totalAmount = allBatches.batches.reduce(
          (sum, b) => sum + b.totalAmount,
          0
        );

        setStats({
          lastBatchDate: lastDate.toLocaleDateString('en-GB'),
          totalEnvelopesThisYear: totalEnvelopes,
          totalAmountThisYear: totalAmount,
          daysSinceLastBatch: daysSince,
        });
      }
    } catch (error) {
      console.error('Failed to load envelope data:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (canAccess) {
      loadData();
    }
  }, [canAccess]);

  if (!canAccess) {
    return null;
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
            <ReceiptIcon />
          </Avatar>
          <Box>
            <Typography variant="h6">Envelope Contributions</Typography>
            <Typography variant="caption" color="text.secondary">
              Weekly cash contributions
            </Typography>
          </Box>
        </Box>

        {loading ? (
          <CircularProgress />
        ) : (
          <>
            {/* Stats */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Last Batch: {stats.lastBatchDate || 'No batches'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This Year: {stats.totalEnvelopesThisYear} envelopes
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Amount: £{stats.totalAmountThisYear.toFixed(2)}
              </Typography>
            </Box>

            {/* Warning if no batch in 14 days */}
            {stats.daysSinceLastBatch > 14 && (
              <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}>
                No batch submitted in {stats.daysSinceLastBatch} days
              </Alert>
            )}

            {/* Recent Batches */}
            {recentBatches.length > 0 && (
              <>
                <Typography variant="subtitle2" gutterBottom>
                  Recent Batches
                </Typography>
                <List dense>
                  {recentBatches.map((batch, index) => (
                    <React.Fragment key={batch.batchId}>
                      {index > 0 && <Divider />}
                      <ListItem>
                        <ListItemText
                          primary={new Date(batch.batchDate).toLocaleDateString(
                            'en-GB'
                          )}
                          secondary={`£${batch.totalAmount.toFixed(2)} - ${batch.envelopeCount} envelopes`}
                        />
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              </>
            )}
          </>
        )}
      </CardContent>
      <CardActions>
        {hasAnyRole([
          'SystemAdministration',
          'FinancialAdministrator',
          'FinancialContributor',
        ]) && (
          <Button
            startIcon={<AddEnvelopeIcon />}
            onClick={() =>
              navigate('/app/financial/envelope-contributions/entry')
            }
            fullWidth
            variant="contained"
          >
            Upload Envelopes
          </Button>
        )}
        <Button
          startIcon={<HistoryIcon />}
          onClick={() =>
            navigate('/app/financial/envelope-contributions/history')
          }
          fullWidth
          variant="outlined"
        >
          View History
        </Button>
      </CardActions>
    </Card>
  );
};
