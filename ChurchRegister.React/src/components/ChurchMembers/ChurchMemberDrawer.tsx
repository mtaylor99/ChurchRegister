import React from 'react';
import { Drawer, Box, IconButton, Typography, Stack } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { ChurchMemberDetailDto } from '../../types/churchMembers';
import { AddChurchMemberForm } from './AddChurchMemberForm';
import { EditChurchMemberForm } from './EditChurchMemberForm';

export interface ChurchMemberDrawerProps {
  open: boolean;
  onClose: () => void;
  mode: 'add' | 'edit' | 'view';
  member: ChurchMemberDetailDto | null;
  onSuccess?: () => void;
}

export const ChurchMemberDrawer: React.FC<ChurchMemberDrawerProps> = ({
  open,
  onClose,
  mode,
  member,
  onSuccess,
}) => {
  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: 600, md: 700 },
          maxWidth: '100%',
        },
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            p: 2,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Typography variant="h6">
            {mode === 'add'
              ? 'Add New Church Member'
              : mode === 'view'
                ? 'View Church Member'
                : 'Edit Church Member'}
          </Typography>
          <IconButton onClick={onClose} edge="end">
            <CloseIcon />
          </IconButton>
        </Stack>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          {mode === 'add' ? (
            <AddChurchMemberForm onSuccess={handleSuccess} onCancel={onClose} />
          ) : member ? (
            <EditChurchMemberForm
              member={member}
              mode={mode}
              onSuccess={handleSuccess}
              onCancel={onClose}
            />
          ) : (
            <Typography color="error">
              Error: No member data available for editing
            </Typography>
          )}
        </Box>
      </Box>
    </Drawer>
  );
};

export default ChurchMemberDrawer;
