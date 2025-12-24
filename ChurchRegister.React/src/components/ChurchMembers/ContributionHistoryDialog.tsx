import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stack,
  TextField,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { useQuery } from '@tanstack/react-query';
import { contributionHistoryApi } from '../../services/api/contributionHistoryApi';
import type { ContributionHistoryDto } from '../../types/contributionHistory';

interface ContributionHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  memberId: number;
  memberName: string;
}

/**
 * Dialog component for displaying contribution history for a church member
 */
export const ContributionHistoryDialog: React.FC<
  ContributionHistoryDialogProps
> = ({ open, onClose, memberId, memberName }) => {
  // Set default date range to current calendar year
  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState(`${currentYear}-12-31`);

  // Fetch contribution history
  const { data: contributions = [], isLoading } = useQuery({
    queryKey: ['contributionHistory', memberId, startDate, endDate],
    queryFn: () =>
      contributionHistoryApi.getContributionHistory(
        memberId,
        startDate,
        endDate
      ),
    enabled: open && memberId > 0,
  });

  // Calculate total
  const totalAmount = useMemo(() => {
    return contributions.reduce((sum, c) => sum + c.amount, 0);
  }, [contributions]);

  // Define grid columns
  const columns: GridColDef<ContributionHistoryDto>[] = useMemo(
    () => [
      {
        field: 'date',
        headerName: 'Date',
        width: 120,
        valueFormatter: (value: string) => {
          return new Date(value).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          });
        },
      },
      {
        field: 'amount',
        headerName: 'Amount',
        width: 130,
        align: 'right',
        headerAlign: 'right',
        valueFormatter: (value: number) => {
          return `£${value.toFixed(2)}`;
        },
        renderCell: (params) => (
          <Typography variant="body2" fontWeight={500}>
            £{params.row.amount.toFixed(2)}
          </Typography>
        ),
      },
      {
        field: 'contributionType',
        headerName: 'Type',
        width: 120,
      },
      {
        field: 'transactionRef',
        headerName: 'Reference',
        width: 150,
        renderCell: (params) => (
          <Typography
            variant="body2"
            sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
          >
            {params.row.transactionRef || '-'}
          </Typography>
        ),
      },
      {
        field: 'description',
        headerName: 'Description',
        flex: 1,
        minWidth: 200,
        renderCell: (params) => (
          <Typography
            variant="body2"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {params.row.description || '-'}
          </Typography>
        ),
      },
      {
        field: 'createdByName',
        headerName: 'Recorded By',
        width: 140,
      },
    ],
    []
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box>
            <Typography variant="h5">Contribution History</Typography>
            <Typography variant="subtitle2" color="text.secondary">
              {memberName}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {/* Date Range Filters */}
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <TextField
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          <TextField
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
        </Stack>

        {/* Summary Statistics */}
        <Box
          sx={{
            bgcolor: 'primary.light',
            color: 'primary.contrastText',
            p: 2,
            borderRadius: 1,
            mb: 2,
          }}
        >
          <Stack direction="row" spacing={4}>
            <Box>
              <Typography variant="caption" sx={{ color: 'primary.dark' }}>
                Total Contributions
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {contributions.length}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: 'primary.dark' }}>
                Total Amount
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                £{totalAmount.toFixed(2)}
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Data Grid */}
        <Box sx={{ height: 400, width: '100%' }}>
          <DataGrid
            rows={contributions}
            columns={columns}
            loading={isLoading}
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } },
            }}
            disableRowSelectionOnClick
            slots={{
              toolbar: GridToolbar,
            }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 500 },
              },
            }}
            sx={{
              '& .MuiDataGrid-cell': {
                fontSize: '0.875rem',
              },
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
