import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  TextField,
  Button,
  Typography,
  Stack,
  Alert,
} from '@mui/material';
import { useCreateCategory } from '../../hooks/useReminderCategories';

export interface CreateCategoryDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateCategoryDrawer: React.FC<CreateCategoryDrawerProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [colorHex, setColorHex] = useState('#9e9e9e');
  const [error, setError] = useState<string | null>(null);

  const createMutation = useCreateCategory();

  // Reset form when drawer closes
  useEffect(() => {
    if (!open) {
      setName('');
      setColorHex('#9e9e9e');
      setError(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Category name is required');
      return;
    }

    if (name.trim().length > 100) {
      setError('Category name must be 100 characters or less');
      return;
    }

    createMutation.mutate(
      {
        name: name.trim(),
        colorHex: colorHex || null,
      },
      {
        onSuccess: () => {
          onSuccess();
          onClose();
        },
        onError: (err: any) => {
          setError(err.message || 'Failed to create category');
        },
      }
    );
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 400, p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Create Category
        </Typography>

        <form onSubmit={handleSubmit}>
          <Stack spacing={3} sx={{ mt: 3 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
              inputProps={{ maxLength: 100 }}
              helperText={`${name.length}/100 characters`}
            />

            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Color
              </Typography>
              <TextField
                type="color"
                value={colorHex}
                onChange={(e) => setColorHex(e.target.value)}
                fullWidth
                sx={{ mt: 1 }}
              />
            </Box>

            <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={!name.trim() || createMutation.isPending}
                fullWidth
              >
                {createMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
              <Button
                variant="outlined"
                onClick={onClose}
                disabled={createMutation.isPending}
                fullWidth
              >
                Cancel
              </Button>
            </Stack>
          </Stack>
        </form>
      </Box>
    </Drawer>
  );
};
