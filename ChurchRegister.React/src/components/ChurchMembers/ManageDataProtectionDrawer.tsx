import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  Button,
  IconButton,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Stack,
  Divider,
  Paper,
  Card,
  CardContent,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useDataProtection, useUpdateDataProtection } from '../../hooks';
import type { ChurchMemberDetailDto } from '../../types';

interface ManageDataProtectionDrawerProps {
  open: boolean;
  onClose: () => void;
  member: ChurchMemberDetailDto;
  onSuccess?: () => void;
}

/**
 * Drawer component for managing GDPR data protection consent preferences
 */
export const ManageDataProtectionDrawer: React.FC<
  ManageDataProtectionDrawerProps
> = ({ open, onClose, member, onSuccess }) => {
  // Fetch current data protection state
  const {
    data: dataProtection,
    isLoading,
    error,
  } = useDataProtection(member.id);

  // Mutation for updating data protection
  const updateMutation = useUpdateDataProtection();

  // Local state for checkboxes
  const [allowNameInCommunications, setAllowNameInCommunications] =
    useState(false);
  const [
    allowHealthStatusInCommunications,
    setAllowHealthStatusInCommunications,
  ] = useState(false);
  const [allowPhotoInCommunications, setAllowPhotoInCommunications] =
    useState(false);
  const [allowPhotoInSocialMedia, setAllowPhotoInSocialMedia] = useState(false);
  const [groupPhotos, setGroupPhotos] = useState(false);
  const [permissionForMyChildren, setPermissionForMyChildren] = useState(false);

  // State for Clear All confirmation dialog
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);

  // Initialize form with fetched data
  useEffect(() => {
    if (dataProtection) {
      setAllowNameInCommunications(dataProtection.allowNameInCommunications);
      setAllowHealthStatusInCommunications(
        dataProtection.allowHealthStatusInCommunications
      );
      setAllowPhotoInCommunications(dataProtection.allowPhotoInCommunications);
      setAllowPhotoInSocialMedia(dataProtection.allowPhotoInSocialMedia);
      setGroupPhotos(dataProtection.groupPhotos);
      setPermissionForMyChildren(dataProtection.permissionForMyChildren);
    }
  }, [dataProtection]);

  // Check if form has changes
  const hasChanges = dataProtection
    ? allowNameInCommunications !== dataProtection.allowNameInCommunications ||
      allowHealthStatusInCommunications !==
        dataProtection.allowHealthStatusInCommunications ||
      allowPhotoInCommunications !== dataProtection.allowPhotoInCommunications ||
      allowPhotoInSocialMedia !== dataProtection.allowPhotoInSocialMedia ||
      groupPhotos !== dataProtection.groupPhotos ||
      permissionForMyChildren !== dataProtection.permissionForMyChildren
    : false;

  const handleSave = () => {
    updateMutation.mutate(
      {
        memberId: member.id,
        request: {
          allowNameInCommunications,
          allowHealthStatusInCommunications,
          allowPhotoInCommunications,
          allowPhotoInSocialMedia,
          groupPhotos,
          permissionForMyChildren,
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

  const handleClearAll = () => {
    setAllowNameInCommunications(false);
    setAllowHealthStatusInCommunications(false);
    setAllowPhotoInCommunications(false);
    setAllowPhotoInSocialMedia(false);
    setGroupPhotos(false);
    setPermissionForMyChildren(false);
    setClearAllDialogOpen(false);
  };

  const handleClose = () => {
    if (!updateMutation.isPending) {
      onClose();
    }
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={handleClose}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '100%', sm: '600px' },
            backgroundColor: '#ffffff',
          },
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#f5f5f5' }}>
          {/* Header */}
          <Paper
            elevation={2}
            sx={{
              p: 3,
              borderRadius: 0,
              backgroundColor: 'primary.main',
              color: 'white',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Typography variant="h5" component="h2" fontWeight={600}>
                  Data Protection Consent
                </Typography>
                <Typography variant="subtitle1" sx={{ mt: 0.5, opacity: 0.9 }}>
                  {member.firstName} {member.lastName}
                </Typography>
              </Box>
              <IconButton 
                onClick={handleClose} 
                size="small"
                sx={{ 
                  color: 'white',
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </Paper>

          {/* Loading State */}
          {isLoading && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                py: 8,
                flex: 1,
              }}
            >
              <CircularProgress />
            </Box>
          )}

          {/* Error State */}
          {error && (
            <Box sx={{ p: 3 }}>
              <Paper
                sx={{
                  p: 3,
                  backgroundColor: 'error.light',
                  color: 'error.contrastText',
                }}
              >
                <Typography>
                  Failed to load data protection information
                </Typography>
              </Paper>
            </Box>
          )}

          {/* Form Content */}
          {!isLoading && !error && dataProtection && (
            <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
              <Card elevation={0} sx={{ mb: 3, border: '1px solid', borderColor: 'divider' }}>
                <CardContent>
                  <Typography variant="h6" color="primary" fontWeight={600} gutterBottom>
                    Consent Permissions
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Please review and update the consent preferences below
                  </Typography>

                  <FormGroup>
                    {/* Checkbox 1 */}
                    <Box sx={{ mb: 3 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={allowNameInCommunications}
                            onChange={(e) =>
                              setAllowNameInCommunications(e.target.checked)
                            }
                            color="primary"
                          />
                        }
                        label={
                          <Typography variant="body1" fontWeight={500}>
                            1. I give permission for my name to be included in the church newsletter or other church communications.
                          </Typography>
                        }
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: 0.5 }}>
                        This covers: Congratulations, Thank-yous, Mentions of involvement, Prayer requests without health details
                      </Typography>
                    </Box>

                    {/* Checkbox 2 */}
                    <Box sx={{ mb: 3 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={allowHealthStatusInCommunications}
                            onChange={(e) =>
                              setAllowHealthStatusInCommunications(e.target.checked)
                            }
                            color="primary"
                          />
                        }
                        label={
                          <Typography variant="body1" fontWeight={500}>
                            2. I give permission for the church to mention me in pastoral situations (e.g., illness, hospital admission), keeping details minimal.
                          </Typography>
                        }
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: 0.5 }}>
                        This is needed because health information is "special category data".
                      </Typography>
                    </Box>

                    {/* Checkbox 3 */}
                    <Box sx={{ mb: 3 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={allowPhotoInCommunications}
                            onChange={(e) =>
                              setAllowPhotoInCommunications(e.target.checked)
                            }
                            color="primary"
                          />
                        }
                        label={
                          <Typography variant="body1" fontWeight={500}>
                            3. I give permission for my photo to be used in printed church materials (e.g., newsletter, noticeboard).
                          </Typography>
                        }
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: 0.5 }}>
                        This separates print from online, which is important legally.
                      </Typography>
                    </Box>

                    {/* Checkbox 4 */}
                    <Box sx={{ mb: 3 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={allowPhotoInSocialMedia}
                            onChange={(e) =>
                              setAllowPhotoInSocialMedia(e.target.checked)
                            }
                            color="primary"
                          />
                        }
                        label={
                          <Typography variant="body1" fontWeight={500}>
                            4. I give permission for my photo to be used on the church Facebook page or other online platforms.
                          </Typography>
                        }
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: 0.5 }}>
                        This must be separate because: Facebook is public, Data leaves the UK/EU, People often want print but not online.
                      </Typography>
                    </Box>

                    {/* Checkbox 5 */}
                    <Box sx={{ mb: 3 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={groupPhotos}
                            onChange={(e) => setGroupPhotos(e.target.checked)}
                            color="primary"
                          />
                        }
                        label={
                          <Typography variant="body1" fontWeight={500}>
                            5. I am happy to appear incidentally in group or crowd photos.
                          </Typography>
                        }
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: 0.5 }}>
                        This avoids needing consent for every wide shot, while still respecting people who prefer not to appear at all.
                      </Typography>
                    </Box>

                    {/* Checkbox 6 */}
                    <Box sx={{ mb: 3 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={permissionForMyChildren}
                            onChange={(e) =>
                              setPermissionForMyChildren(e.target.checked)
                            }
                            color="primary"
                          />
                        }
                        label={
                          <Typography variant="body1" fontWeight={500}>
                            6. I give permission for my child's name/photo to be used as above.
                          </Typography>
                        }
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: 0.5 }}>
                        (Optional but helpful - not essential)
                      </Typography>
                    </Box>
                  </FormGroup>

                  <Divider sx={{ my: 3 }} />

                  {/* Last Modified Info */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      backgroundColor: 'grey.50',
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" display="block">
                      <strong>Last updated:</strong>{' '}
                      {new Date(dataProtection.modifiedDateTime).toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      <strong>Modified by:</strong> {dataProtection.modifiedBy}
                    </Typography>
                  </Paper>
                </CardContent>
              </Card>
            </Box>
          )}

          {/* Actions */}
          {!isLoading && !error && dataProtection && (
            <Paper
              elevation={3}
              sx={{
                p: 3,
                borderRadius: 0,
                backgroundColor: 'white',
              }}
            >
              <Stack spacing={2}>
                {/* Clear All Consent Button */}
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => setClearAllDialogOpen(true)}
                  fullWidth
                  sx={{ fontWeight: 500 }}
                >
                  Clear All Consent
                </Button>

                <Stack direction="row" spacing={2}>
                  {/* Cancel Button */}
                  <Button
                    variant="outlined"
                    onClick={handleClose}
                    fullWidth
                    disabled={updateMutation.isPending}
                    sx={{ fontWeight: 500 }}
                  >
                    Cancel
                  </Button>

                  {/* Save Button */}
                  <Button
                    variant="contained"
                    onClick={handleSave}
                    fullWidth
                    disabled={!hasChanges || updateMutation.isPending}
                    sx={{ fontWeight: 500 }}
                  >
                    {updateMutation.isPending ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          )}
        </Box>
      </Drawer>

      {/* Clear All Confirmation Dialog */}
      <Dialog
        open={clearAllDialogOpen}
        onClose={() => setClearAllDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: '400px',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>
          Clear All Consent?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to remove all consent permissions for{' '}
            <strong>{member.firstName} {member.lastName}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            This action can be reversed by updating the permissions again.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button 
            onClick={() => setClearAllDialogOpen(false)}
            variant="outlined"
            sx={{ fontWeight: 500 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleClearAll} 
            color="error" 
            variant="contained"
            sx={{ fontWeight: 500 }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
