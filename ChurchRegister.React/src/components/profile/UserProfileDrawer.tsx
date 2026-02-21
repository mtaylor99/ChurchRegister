import React, { useState } from 'react';
import {
  Drawer,
  Box,
  IconButton,
  Typography,
  Stack,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import { useAuth } from '../../contexts/useAuth';

export interface UserProfileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const UserProfileDrawer: React.FC<UserProfileDrawerProps> = ({
  open,
  onClose,
}) => {
  const { user, updateProfile } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Reset form when drawer opens
  React.useEffect(() => {
    if (open && user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setError(null);
      setSuccess(false);
    }
  }, [open, user]);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      setSuccess(true);

      // Close drawer after a short delay to show success message
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const isFormChanged = () => {
    return (
      firstName.trim() !== (user?.firstName || '') ||
      lastName.trim() !== (user?.lastName || '')
    );
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: 500, md: 600 },
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
          <Typography variant="h6">My Profile</Typography>
          <IconButton onClick={onClose} edge="end">
            <CloseIcon />
          </IconButton>
        </Stack>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          <Stack spacing={3}>
            {/* Success Message */}
            {success && (
              <Alert severity="success">Profile updated successfully!</Alert>
            )}

            {/* Error Message */}
            {error && <Alert severity="error">{error}</Alert>}

            {/* Email (Read-only) */}
            <TextField
              label="Email Address"
              value={user?.email || ''}
              disabled
              fullWidth
              helperText="Email address cannot be changed"
              variant="outlined"
            />

            {/* First Name */}
            <TextField
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              fullWidth
              required
              variant="outlined"
              disabled={loading}
              error={!firstName.trim() && firstName !== ''}
              helperText={
                !firstName.trim() && firstName !== ''
                  ? 'First name is required'
                  : ''
              }
            />

            {/* Last Name */}
            <TextField
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              fullWidth
              required
              variant="outlined"
              disabled={loading}
              error={!lastName.trim() && lastName !== ''}
              helperText={
                !lastName.trim() && lastName !== ''
                  ? 'Last name is required'
                  : ''
              }
            />

            {/* User Role Information */}
            {user?.roles && user.roles.length > 0 && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" mb={1}>
                  Roles
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {user.roles.map((role) => (
                    <Box
                      key={role}
                      sx={{
                        px: 2,
                        py: 0.5,
                        bgcolor: 'primary.light',
                        color: 'primary.contrastText',
                        borderRadius: 1,
                        fontSize: '0.875rem',
                        mb: 1,
                      }}
                    >
                      {role}
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>
        </Box>

        {/* Footer Actions */}
        <Box
          sx={{
            p: 2,
            borderTop: 1,
            borderColor: 'divider',
            display: 'flex',
            gap: 2,
            justifyContent: 'flex-end',
          }}
        >
          <Button
            variant="outlined"
            onClick={handleCancel}
            disabled={loading}
            size="large"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={
              loading ||
              !isFormChanged() ||
              !firstName.trim() ||
              !lastName.trim()
            }
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            size="large"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default UserProfileDrawer;
