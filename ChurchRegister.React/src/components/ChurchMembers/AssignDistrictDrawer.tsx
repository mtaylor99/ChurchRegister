import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Stack,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useDistricts, useAssignDistrict } from '../../hooks';
import type { ChurchMemberDetailDto } from '../../types';

interface AssignDistrictDrawerProps {
  open: boolean;
  onClose: () => void;
  member: ChurchMemberDetailDto;
  onSuccess?: () => void;
}

/**
 * Drawer component for assigning a district to a church member
 */
export const AssignDistrictDrawer: React.FC<AssignDistrictDrawerProps> = ({
  open,
  onClose,
  member,
  onSuccess,
}) => {
  // Fetch districts list
  const { data: districts, isLoading } = useDistricts();

  // Mutation for assigning district
  const assignMutation = useAssignDistrict();

  // Local state for selected district
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(
    null
  );

  // Initialize form with member's current district
  useEffect(() => {
    setSelectedDistrictId(member.districtId ?? null);
  }, [member.districtId]);

  // Check if form has changes
  const hasChanges = selectedDistrictId !== (member.districtId ?? null);

  const handleSave = () => {
    assignMutation.mutate(
      {
        memberId: member.id,
        request: {
          districtId: selectedDistrictId,
        },
      },
      {
        onSuccess: () => {
          if (onSuccess) onSuccess();
          onClose();
        },
      }
    );
  };

  const handleClose = () => {
    if (!assignMutation.isPending) {
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
          width: { xs: '100%', sm: '400px' },
        },
      }}
    >
      <Box
        sx={{
          p: 3,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 3,
          }}
        >
          <Typography variant="h6" component="h2">
            {member.firstName} {member.lastName} - Assign District
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Loading State */}
        {isLoading && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              py: 4,
            }}
          >
            <CircularProgress />
          </Box>
        )}

        {/* Form Content */}
        {!isLoading && districts && (
          <Box sx={{ flex: 1 }}>
            <FormControl fullWidth>
              <InputLabel id="district-select-label">District</InputLabel>
              <Select
                labelId="district-select-label"
                id="district-select"
                value={selectedDistrictId ?? ''}
                label="District"
                onChange={(e) => {
                  const value = e.target.value as string | number;
                  setSelectedDistrictId(value === '' ? null : Number(value));
                }}
              >
                <MenuItem value="">
                  <em>Unassigned</em>
                </MenuItem>
                {districts.map((district) => (
                  <MenuItem key={district.id} value={district.id}>
                    {district.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Select a district (A-L) to assign to this member, or choose
              "Unassigned" to remove the district assignment.
            </Typography>
          </Box>
        )}

        {/* Actions */}
        <Stack direction="row" spacing={2} sx={{ mt: 'auto', pt: 3 }}>
          <Button
            variant="outlined"
            onClick={handleClose}
            disabled={assignMutation.isPending}
            fullWidth
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={assignMutation.isPending || !hasChanges || isLoading}
            fullWidth
          >
            {assignMutation.isPending ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
};
