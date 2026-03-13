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
  TextField,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Clear as ClearIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  AccountBalance as BankIcon,
  Mail as EnvelopeIcon,
  CurrencyPound as CashIcon,
} from '@mui/icons-material';
import { DataGrid, GridToolbar, GridActionsCellItem } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { useQuery } from '@tanstack/react-query';
import { contributionHistoryApi } from '@services/api';
import type { ContributionHistoryDto } from '../../types/contributionHistory';
import {
  useEditContribution,
  useDeleteContribution,
} from '../../hooks/useContributions';

export interface ContributionHistoryDialogProps {
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

  // Edit and delete state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedContribution, setSelectedContribution] =
    useState<ContributionHistoryDto | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');

  // Mutations
  const editMutation = useEditContribution();
  const deleteMutation = useDeleteContribution();

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

  // Edit handlers
  const handleEditClick = useCallback(
    (contribution: ContributionHistoryDto) => {
      setSelectedContribution(contribution);
      setEditAmount(contribution.amount.toFixed(2));
      setEditDialogOpen(true);
    },
    []
  );

  const handleEditCancel = useCallback(() => {
    setEditDialogOpen(false);
    setSelectedContribution(null);
    setEditAmount('');
  }, []);

  const handleEditConfirm = useCallback(() => {
    if (selectedContribution && editAmount) {
      const amount = parseFloat(editAmount);
      if (amount > 0) {
        editMutation.mutate(
          { id: selectedContribution.id, amount },
          {
            onSuccess: () => {
              handleEditCancel();
            },
          }
        );
      }
    }
  }, [selectedContribution, editAmount, editMutation, handleEditCancel]);

  // Delete handlers
  const handleDeleteClick = useCallback(
    (contribution: ContributionHistoryDto) => {
      setSelectedContribution(contribution);
      setDeleteDialogOpen(true);
    },
    []
  );

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setSelectedContribution(null);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (selectedContribution) {
      deleteMutation.mutate(selectedContribution.id, {
        onSuccess: () => {
          handleDeleteCancel();
        },
      });
    }
  }, [selectedContribution, deleteMutation, handleDeleteCancel]);

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
        width: 150,
        renderCell: (params) => {
          const { isFromBankStatement, isFromEnvelopeBatch } = params.row;
          return (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 1,
                height: '100%',
              }}
            >
              {isFromBankStatement && (
                <Tooltip title="Bank Statement">
                  <BankIcon fontSize="small" color="primary" />
                </Tooltip>
              )}
              {isFromEnvelopeBatch && (
                <Tooltip title="Envelope Batch">
                  <EnvelopeIcon fontSize="small" color="secondary" />
                </Tooltip>
              )}
              {!isFromBankStatement && !isFromEnvelopeBatch && (
                <Tooltip title="One-off Contribution">
                  <CashIcon fontSize="small" color="success" />
                </Tooltip>
              )}
              <Typography variant="body2">{params.value}</Typography>
            </Box>
          );
        },
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
      {
        field: 'actions',
        type: 'actions',
        headerName: 'Actions',
        width: 80,
        getActions: (params) => {
          const contribution = params.row;

          // Non-editable contributions show block icon
          if (!contribution.isEditable) {
            const tooltipText = contribution.isFromBankStatement
              ? 'Bank statement contributions cannot be edited'
              : contribution.isFromEnvelopeBatch
                ? 'Envelope batch contributions cannot be edited'
                : 'This contribution cannot be edited';

            return [
              <GridActionsCellItem
                key="blocked"
                icon={
                  <Tooltip title={tooltipText}>
                    <BlockIcon />
                  </Tooltip>
                }
                label=""
                disabled
                showInMenu={false}
              />,
            ];
          }

          // Editable contributions show Edit and Delete menu
          return [
            <GridActionsCellItem
              key="edit"
              icon={<EditIcon />}
              label="Edit"
              onClick={() => handleEditClick(contribution)}
              showInMenu
            />,
            <GridActionsCellItem
              key="delete"
              icon={<DeleteIcon color="error" />}
              label="Delete"
              onClick={() => handleDeleteClick(contribution)}
              showInMenu
            />,
          ];
        },
      },
    ],
    [handleEditClick, handleDeleteClick]
  );

  return (
    <>
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

      {/* Edit Amount Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleEditCancel}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Edit Contribution Amount</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              label="Amount"
              type="number"
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              required
              fullWidth
              inputProps={{ min: 0.01, step: 0.01 }}
              disabled={editMutation.isPending}
              placeholder="0.00"
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>£</Typography>,
              }}
              autoFocus
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditCancel} disabled={editMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleEditConfirm}
            variant="contained"
            disabled={
              editMutation.isPending ||
              !editAmount ||
              parseFloat(editAmount) <= 0
            }
          >
            {editMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="xs"
      >
        <DialogTitle>Delete Contribution</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to permanently delete this contribution?
          </Typography>
          {selectedContribution && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>Date:</strong>{' '}
                {new Date(selectedContribution.date).toLocaleDateString(
                  'en-GB'
                )}
              </Typography>
              <Typography variant="body2">
                <strong>Amount:</strong> £
                {selectedContribution.amount.toFixed(2)}
              </Typography>
              <Typography variant="body2">
                <strong>Type:</strong> {selectedContribution.contributionType}
              </Typography>
            </Box>
          )}
          <Typography sx={{ mt: 2, color: 'error.main', fontWeight: 'bold' }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleDeleteCancel}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
