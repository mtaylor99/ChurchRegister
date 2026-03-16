import React, { useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Block as BlockIcon,
  PersonAdd as PersonAddIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { contributionsApi, churchMembersApi } from '@services/api';
import type {
  UnmatchedTransactionDto,
  AssignTransactionRequest,
} from '../../types/contributions';
import { extractErrorMessage } from '../../utils/typeGuards';

// ─── Assign Dialog ────────────────────────────────────────────────────────────

interface AssignDialogProps {
  transaction: UnmatchedTransactionDto | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AssignTransactionDialog: React.FC<AssignDialogProps> = ({
  transaction,
  open,
  onClose,
  onSuccess,
}) => {
  const [selectedMember, setSelectedMember] = useState<{
    id: number;
    fullName: string;
  } | null>(null);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: membersResponse } = useQuery({
    queryKey: ['churchMembers', { searchTerm: memberSearchTerm, noBankReference: true, page: 1, pageSize: 50 }],
    queryFn: () =>
      churchMembersApi.getChurchMembers({
        page: 1,
        pageSize: 50,
        searchTerm: memberSearchTerm || undefined,
        noBankReferenceFilter: true,
        sortBy: 'firstName',
        sortDirection: 'asc',
      }),
    enabled: open,
  });

  const assignMutation = useMutation({
    mutationFn: (request: AssignTransactionRequest) =>
      contributionsApi.assignTransaction(transaction!.id, request),
    onSuccess: () => {
      setError(null);
      setSelectedMember(null);
      setMemberSearchTerm('');
      onSuccess();
    },
    onError: (err: unknown) => {
      setError(extractErrorMessage(err, 'Failed to assign transaction'));
    },
  });

  const handleClose = () => {
    setError(null);
    setSelectedMember(null);
    setMemberSearchTerm('');
    onClose();
  };

  const handleConfirm = () => {
    if (!selectedMember) return;
    assignMutation.mutate({ churchMemberId: selectedMember.id });
  };

  if (!transaction) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Assign Transaction to Member</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Date:</strong> {new Date(transaction.date).toLocaleDateString()}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Reference:</strong> {transaction.reference}
          </Typography>
          {transaction.description && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Description:</strong> {transaction.description}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary">
            <strong>Amount:</strong> £{transaction.amount.toFixed(2)}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Autocomplete
          options={membersResponse?.items || []}
          getOptionLabel={(option) => option.fullName || ''}
          value={selectedMember}
          onChange={(_, newValue) => setSelectedMember(newValue)}
          inputValue={memberSearchTerm}
          onInputChange={(_, newInputValue) => setMemberSearchTerm(newInputValue)}
          disabled={assignMutation.isPending}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Church Member"
              required
              placeholder="Type to search members..."
              helperText="Only members without an existing bank reference are shown"
            />
          )}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          noOptionsText={memberSearchTerm ? 'No members found' : 'Start typing to search'}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={assignMutation.isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!selectedMember || assignMutation.isPending}
          startIcon={assignMutation.isPending ? <CircularProgress size={16} /> : <PersonAddIcon />}
        >
          Assign
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Exclude Dialog ───────────────────────────────────────────────────────────

interface ExcludeDialogProps {
  transaction: UnmatchedTransactionDto | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ExcludeReferenceDialog: React.FC<ExcludeDialogProps> = ({
  transaction,
  open,
  onClose,
  onSuccess,
}) => {
  const [error, setError] = useState<string | null>(null);

  const excludeMutation = useMutation({
    mutationFn: () => contributionsApi.excludeReference(transaction!.id),
    onSuccess: () => {
      setError(null);
      onSuccess();
    },
    onError: (err: unknown) => {
      setError(extractErrorMessage(err, 'Failed to exclude reference'));
    },
  });

  const handleClose = () => {
    setError(null);
    onClose();
  };

  if (!transaction) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Exclude Reference</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <DialogContentText>
          Are you sure you want to exclude the reference{' '}
          <strong>"{transaction.reference}"</strong> from future processing?
        </DialogContentText>
        <DialogContentText sx={{ mt: 1 }}>
          Transactions with this reference will no longer appear in the unmatched
          list and will not be automatically matched to members.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={excludeMutation.isPending}>
          Cancel
        </Button>
        <Button
          onClick={() => excludeMutation.mutate()}
          variant="contained"
          color="warning"
          disabled={excludeMutation.isPending}
          startIcon={excludeMutation.isPending ? <CircularProgress size={16} /> : <BlockIcon />}
        >
          Exclude
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const UnmatchedTransactionsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [assignTarget, setAssignTarget] = useState<UnmatchedTransactionDto | null>(null);
  const [excludeTarget, setExcludeTarget] = useState<UnmatchedTransactionDto | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['hsbc-unmatched'],
    queryFn: () => contributionsApi.getUnmatchedTransactions(),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['hsbc-unmatched'] });
    queryClient.invalidateQueries({ queryKey: ['contribution-members'] });
  };

  return (
    <>
      {/* Loading */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error */}
      {isError && (
        <Alert severity="error">
          {extractErrorMessage(error, 'Failed to load unmatched transactions')}
        </Alert>
      )}

      {/* Empty State */}
      {!isLoading && !isError && data?.totalCount === 0 && (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            All transactions matched!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            There are no unmatched HSBC transactions to resolve.
          </Typography>
        </Paper>
      )}

      {/* Transaction count */}
      {!isLoading && !isError && data && data.totalCount > 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {data.totalCount} transaction{data.totalCount !== 1 ? 's' : ''} awaiting resolution
        </Typography>
      )}

      {/* Transactions table */}
      {!isLoading && !isError && data && data.totalCount > 0 && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Reference</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.items.map((tx) => (
                <TableRow key={tx.id} hover>
                  <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {tx.reference}
                    </Typography>
                  </TableCell>
                  <TableCell>{tx.description ?? '—'}</TableCell>
                  <TableCell align="right">£{tx.amount.toFixed(2)}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Assign to member">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => setAssignTarget(tx)}
                      >
                        <PersonAddIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Exclude reference">
                      <IconButton
                        size="small"
                        color="warning"
                        onClick={() => setExcludeTarget(tx)}
                      >
                        <BlockIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Assign Dialog */}
      <AssignTransactionDialog
        transaction={assignTarget}
        open={assignTarget !== null}
        onClose={() => setAssignTarget(null)}
        onSuccess={() => {
          setAssignTarget(null);
          invalidate();
        }}
      />

      {/* Exclude Dialog */}
      <ExcludeReferenceDialog
        transaction={excludeTarget}
        open={excludeTarget !== null}
        onClose={() => setExcludeTarget(null)}
        onSuccess={() => {
          setExcludeTarget(null);
          invalidate();
        }}
      />
    </>
  );
};
