import {
  Drawer,
  Box,
  Typography,
  Button,
  Stack,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Alert,
} from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import { format } from 'date-fns';
import type { RiskAssessmentDetail } from '../../types/riskAssessments';

interface ViewRiskAssessmentDrawerProps {
  open: boolean;
  onClose: () => void;
  riskAssessment: RiskAssessmentDetail | null;
}

export function ViewRiskAssessmentDrawer({
  open,
  onClose,
  riskAssessment,
}: ViewRiskAssessmentDrawerProps) {

  if (!riskAssessment) return null;

  const getAlertIcon = () => {
    if (riskAssessment.alertStatus === 'red') {
      return <ErrorIcon sx={{ color: '#f44336', mr: 1 }} />;
    } else if (riskAssessment.alertStatus === 'amber') {
      return <WarningIcon sx={{ color: '#ff9800', mr: 1 }} />;
    } else {
      return <CheckCircleIcon sx={{ color: '#4caf50', mr: 1 }} />;
    }
  };

  return (
    <>
      <Drawer anchor="right" open={open} onClose={onClose}>
        <Box sx={{ width: 600, p: 3 }}>
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5">Risk Assessment Details</Typography>
            <IconButton onClick={onClose} aria-label="Close">
              <CloseIcon />
            </IconButton>
          </Stack>

          <Stack spacing={3}>
            {/* Category */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Category
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {riskAssessment.categoryName}
              </Typography>
            </Box>

            <Divider />

            {/* Consolidated Items */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Items covered by this assessment:
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {riskAssessment.categoryDescription}
              </Typography>
            </Box>

            <Divider />

            {/* Title */}
            <Box>
              <Typography variant="h6">{riskAssessment.title}</Typography>
            </Box>

            {/* Description (Assessment Notes) */}
            {riskAssessment.description && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Assessment Notes
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                  {riskAssessment.description}
                </Typography>
              </Box>
            )}

            <Divider />

            {/* Review Information */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Review Information
              </Typography>
              <Stack spacing={1}>
                <Box>
                  <Typography variant="body2" fontWeight={500}>
                    Review Interval:
                  </Typography>
                  <Typography variant="body2">
                    Every {riskAssessment.reviewInterval}{' '}
                    {riskAssessment.reviewInterval === 1 ? 'year' : 'years'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight={500}>
                    Last Review Date:
                  </Typography>
                  <Typography variant="body2">
                    {riskAssessment.lastReviewDate
                      ? format(new Date(riskAssessment.lastReviewDate), 'dd MMM yyyy')
                      : 'Never Reviewed'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight={500}>
                    Next Review Date:
                  </Typography>
                  <Stack direction="row" alignItems="center">
                    {getAlertIcon()}
                    <Typography variant="body2">
                      {format(new Date(riskAssessment.nextReviewDate), 'dd MMM yyyy')}
                    </Typography>
                  </Stack>
                </Box>
              </Stack>
            </Box>

            <Divider />

            {/* Status */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Status
              </Typography>
              <Chip
                label={riskAssessment.status}
                sx={{
                  backgroundColor: riskAssessment.status === 'Approved' ? '#4caf50' : '#2196f3',
                  color: '#fff',
                  fontWeight: 500,
                }}
              />
            </Box>

            {/* Scope */}
            {riskAssessment.scope && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Scope
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {riskAssessment.scope}
                </Typography>
              </Box>
            )}

            {/* Notes */}
            {riskAssessment.notes && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Notes
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {riskAssessment.notes}
                </Typography>
              </Box>
            )}

            <Divider />

            {/* Approvals */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Approvals ({riskAssessment.approvalCount} of{' '}
                {riskAssessment.minimumApprovalsRequired})
              </Typography>
              {riskAssessment.approvals.length === 0 ? (
                <Alert severity="info">No approvals yet</Alert>
              ) : (
                <List dense>
                  {riskAssessment.approvals.map((approval) => (
                    <ListItem key={approval.id} divider>
                      <ListItemAvatar>
                        <Avatar>{approval.approvedByMemberName.charAt(0)}</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={approval.approvedByMemberName}
                        secondary={
                          <>
                            {format(new Date(approval.approvedDate), 'dd MMM yyyy HH:mm')}
                            {approval.notes && (
                              <Typography
                                component="span"
                                variant="body2"
                                sx={{ display: 'block', mt: 0.5 }}
                              >
                                {approval.notes}
                              </Typography>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          </Stack>

          {/* Footer Actions */}
          <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
            <Button onClick={onClose} variant="contained" fullWidth>
              Close
            </Button>
          </Stack>
        </Box>
      </Drawer>
    </>
  );
}
