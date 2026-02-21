import React, { useState, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Card,
  CardContent,
} from '@mui/material';
import { Close as CloseIcon, Clear as ClearIcon } from '@mui/icons-material';
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
  // Set default year to current year
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Generate array of last 5 years including current year
  const years = useMemo(
    () => Array.from({ length: 5 }, (_, i) => currentYear - i),
    [currentYear]
  );

  // Calculate start and end dates based on selected year
  const startDate = `${selectedYear}-01-01`;
  const endDate = `${selectedYear}-12-31`;

  // Fetch contribution history
  const { data: contributions = [], isLoading } = useQuery({
    queryKey: ['contributionHistory', memberId, selectedYear],
    queryFn: () =>
      contributionHistoryApi.getContributionHistory(
        memberId,
        startDate,
        endDate
      ),
    enabled: open && memberId > 0,
  });

  // Reset filters to current year
  const resetFilters = useCallback(() => {
    setSelectedYear(currentYear);
  }, [currentYear]);

  // Check if filters have changed from default (current year)
  const hasActiveFilters = useMemo(
    () => selectedYear !== currentYear,
    [selectedYear, currentYear]
  );

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
      },
      {
        field: 'contributionType',
        headerName: 'Type',
        width: 120,
      },
      {
        field: 'description',
        headerName: 'Description',
        flex: 1,
        minWidth: 200,
      },
      {
        field: 'createdByName',
        headerName: 'Recorded By',
        width: 180,
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
            bgcolor: 'grey.100',
            p: 2,
            m: -3,
            mb: 0,
            borderRadius: '4px 4px 0 0',
          }}
        >
          <Box>
            <Typography variant="h5" color="primary.main" fontWeight="bold">
              Contribution History
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              {memberName}
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ color: 'primary.main' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {/* Summary Statistics */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Total Contributions
              </Typography>
              <Typography variant="h4">{contributions.length}</Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Total Amount
              </Typography>
              <Typography variant="h4">£{totalAmount.toFixed(2)}</Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Year Filter */}
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="year-filter-label">Year</InputLabel>
            <Select
              labelId="year-filter-label"
              id="year-filter"
              value={selectedYear}
              label="Year"
              onChange={(e) => setSelectedYear(e.target.value as number)}
            >
              {years.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {hasActiveFilters && (
            <Button
              variant="outlined"
              onClick={resetFilters}
              startIcon={<ClearIcon />}
              sx={{ minWidth: 'fit-content', whiteSpace: 'nowrap' }}
            >
              Reset to Current Year
            </Button>
          )}
        </Stack>

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
            disableColumnMenu
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
