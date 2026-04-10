import React from 'react';
import { Drawer, Box, IconButton, Typography, Stack } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { TrainingCertificateDto } from '../../types/trainingCertificates';
import { TrainingCertificateForm } from './TrainingCertificateForm';

export interface TrainingCertificateDrawerProps {
  open: boolean;
  onClose: () => void;
  mode: 'add' | 'edit' | 'view';
  certificate: TrainingCertificateDto | null;
  onSuccess?: () => void;
}

export const TrainingCertificateDrawer: React.FC<
  TrainingCertificateDrawerProps
> = ({ open, onClose, mode, certificate, onSuccess }) => {
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
              ? 'Add Training Certificate'
              : mode === 'view'
                ? 'View Training Certificate'
                : 'Edit Training Certificate'}
          </Typography>
          <IconButton onClick={onClose} edge="end">
            <CloseIcon />
          </IconButton>
        </Stack>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          <TrainingCertificateForm
            certificate={certificate}
            mode={mode}
            onSuccess={handleSuccess}
            onCancel={onClose}
          />
        </Box>
      </Box>
    </Drawer>
  );
};

export default TrainingCertificateDrawer;
