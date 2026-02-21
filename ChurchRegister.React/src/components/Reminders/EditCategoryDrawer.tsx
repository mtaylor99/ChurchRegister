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
import { useUpdateCategory } from '../../hooks/useReminderCategories';
import type { ReminderCategory } from '../../types/reminderCategories';

export interface EditCategoryDrawerProps {
  open: boolean;
  onClose: () => void;
  category: ReminderCategory | null;
  onSuccess: () => void;
}

export const EditCategoryDrawer: React.FC<EditCategoryDrawerProps> = ({
  open,
  onClose,
  category,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [colorHex, setColorHex] = useState('#9e9e9e');
  const [error, setError] = useState<string | null>(null);

  const updateMutation = useUpdateCategory();

  // Populate form when category changes
  useEffect(() => {
    if (category) {
      setName(category.name);
      setColorHex(category.colorHex || '#9e9e9e');
      setError(null);
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!category) return;

    if (!name.trim()) {
      setError('Category name is required');
      return;
    }

    if (name.trim().length > 100) {
      setError('Category name must be 100 characters or less');
      return;
    }

    updateMutation.mutate(
      {
        id: category.id,
        request: {
          name: name.trim(),
          colorHex: colorHex || null,
        },
      },
      {
        onSuccess: () => {
          onSuccess();
          onClose();
        },
        onError: (err: any) => {
          setError(err.message || 'Failed to update category');
        },
      }
    );
  };

  if (!category) return null;

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 400, p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Edit Category
        </Typography>

        {category.isSystemCategory && (
          <Alert severity="info" sx={{ mt: 2 }}>
            System category names cannot be modified
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Stack spacing={3} sx={{ mt: 3 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
              disabled={category.isSystemCategory}
              inputProps={{ maxLength: 100 }}
              helperText={
                category.isSystemCategory
                  ? 'System category names cannot be changed'
                  : `${name.length}/100 characters`
              }
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
                disabled={!name.trim() || updateMutation.isPending}
                fullWidth
              >
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
              <Button
                variant="outlined"
                onClick={onClose}
                disabled={updateMutation.isPending}
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
