import React, { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Autocomplete,
  Alert,
  CircularProgress,
  Stack,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { contributionsApi } from '../../services/api/contributionsApi';
import { churchMembersApi } from '../../services/api/churchMembersApi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ChurchMemberDto } from '../../types/churchMembers';

interface AddOneOffContributionDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Drawer component for adding a one-off manual contribution
 */
export const AddOneOffContributionDrawer: React.FC<
  AddOneOffContributionDrawerProps
> = ({ open, onClose, onSuccess }) => {
  const queryClient = useQueryClient();

  const [selectedMember, setSelectedMember] = useState<ChurchMemberDto | null>(
    null
  );
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  // Fetch active members for autocomplete
  const { data: membersData, isLoading: isMembersLoading } = useQuery({
    queryKey: ['church-members-all', searchTerm],
    queryFn: async () => {
      const response = await churchMembersApi.getChurchMembers({
        page: 1,
        pageSize: 100,
        statusFilter: 1, // Active members only
        searchTerm: searchTerm || undefined,
      });
      return response.items;
    },
    enabled: open,
  });

  // Mutation for adding contribution
  const addContributionMutation = useMutation({
    mutationFn: async (data: {
      memberId: number;
      amount: number;
      date: string;
      description: string;
    }) => {
      return contributionsApi.addOneOffContribution(data);
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['contribution-members'] });
      queryClient.invalidateQueries({ queryKey: ['contributionHistory'] });

      // Reset form
      handleReset();

      // Call success callback
      if (onSuccess) onSuccess();

      // Close drawer
      onClose();
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to add contribution');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!selectedMember) {
      setError('Please select a member');
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!date) {
      setError('Please select a date');
      return;
    }

    if (!description.trim()) {
      setError('Please enter a description');
      return;
    }

    // Submit
    addContributionMutation.mutate({
      memberId: selectedMember.id,
      amount: amountValue,
      date,
      description: description.trim(),
    });
  };

  const handleReset = () => {
    setSelectedMember(null);
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setSearchTerm('');
    setError('');
  };

  const handleClose = () => {
    if (!addContributionMutation.isPending) {
      handleReset();
      onClose();
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: '500px' },
        },
      }}
    >
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            bgcolor: 'grey.100',
            p: 2,
            mx: -3,
            mt: -3,
            borderRadius: '0',
          }}
        >
          <Typography variant="h5" color="primary.main" fontWeight=" bold">
            Add One Off Contribution
          </Typography>
          <IconButton
            onClick={handleClose}
            disabled={addContributionMutation.isPending}
            sx={{ color: 'primary.main' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Form */}
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={3}>
            {/* Error Alert */}
            {error && (
              <Alert severity="error" onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            {/* Member Autocomplete */}
            <Autocomplete
              value={selectedMember}
              onChange={(_event, newValue) => setSelectedMember(newValue)}
              inputValue={searchTerm}
              onInputChange={(_event, newInputValue) =>
                setSearchTerm(newInputValue)
              }
              options={membersData || []}
              getOptionLabel={(option) => {
                const number = option.memberNumber
                  ? ` (${option.memberNumber})`
                  : '';
                return `${option.fullName}${number}`;
              }}
              loading={isMembersLoading}
              disabled={addContributionMutation.isPending}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Member"
                  required
                  placeholder="Search by name or number..."
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {isMembersLoading ? (
                          <CircularProgress size={20} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />

            {/* Amount */}
            <TextField
              label="Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              inputProps={{ min: 0.01, step: 0.01 }}
              disabled={addContributionMutation.isPending}
              placeholder="0.00"
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>£</Typography>,
              }}
            />

            {/* Date */}
            <TextField
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              disabled={addContributionMutation.isPending}
              InputLabelProps={{ shrink: true }}
            />

            {/* Description */}
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              multiline
              rows={3}
              disabled={addContributionMutation.isPending}
              placeholder="Enter description of this contribution..."
              inputProps={{ maxLength: 500 }}
              helperText={`${description.length}/500 characters`}
            />

            {/* Action Buttons */}
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={handleClose}
                disabled={addContributionMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={addContributionMutation.isPending}
                startIcon={
                  addContributionMutation.isPending ? (
                    <CircularProgress size={20} />
                  ) : null
                }
              >
                {addContributionMutation.isPending
                  ? 'Adding...'
                  : 'Add Contribution'}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
};
