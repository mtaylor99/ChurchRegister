import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  List,
  CircularProgress,
  Alert,
  Button,
  Card,
  CardContent,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useAssessmentHistory } from '../../hooks/useRiskAssessments';
import { format } from 'date-fns';

interface ViewHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  riskAssessmentId: number | null;
}

export const ViewHistoryDrawer: React.FC<ViewHistoryDrawerProps> = ({
  open,
  onClose,
  riskAssessmentId,
}) => {
  const { data: history, isPending, isError } = useAssessmentHistory(riskAssessmentId);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not yet reviewed';
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 700,
          maxWidth: '90vw',
        },
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Box>
            <Typography variant="h6">Version History</Typography>
            {history && (
              <Typography variant="body2" color="text.secondary">
                {history.title}
              </Typography>
            )}
          </Box>
          <IconButton onClick={onClose} edge="end">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          {isPending && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {isError && (
            <Alert severity="error">
              Failed to load version history. Please try again.
            </Alert>
          )}

          {history && history.reviewCycles.length === 0 && (
            <Alert severity="info">
              No version history available yet. History will be recorded once approvals are received.
            </Alert>
          )}

          {history && history.reviewCycles.length > 0 && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Review Cycles (most recent first)
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                {history.reviewCycles.map((cycle, cycleIndex) => (
                  <Box key={cycleIndex} sx={{ mb: 4 }}>
                    {/* Cycle Header */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mb: 2,
                        pb: 1,
                        borderBottom: 2,
                        borderColor: cycleIndex === 0 ? 'primary.main' : 'divider',
                      }}
                    >
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {cycle.reviewDate 
                          ? `Reviewed: ${formatDate(cycle.reviewDate)}`
                          : 'Current Review Cycle'}
                      </Typography>
                    </Box>

                    {/* Approvals for this cycle */}
                    {cycle.approvals.length === 0 ? (
                      <Alert severity="info" sx={{ my: 2 }}>
                        No approvals recorded for this cycle.
                      </Alert>
                    ) : (
                      <List disablePadding>
                        {(() => {
                          // Group approvals by date and notes (approvals done together)
                          const groupedApprovals = cycle.approvals.reduce((acc, approval) => {
                            const key = `${approval.approvedDate}-${approval.notes || ''}`;
                            if (!acc[key]) {
                              acc[key] = {
                                approvedDate: approval.approvedDate,
                                notes: approval.notes,
                                approvers: []
                              };
                            }
                            acc[key].approvers.push({
                              id: approval.id,
                              name: approval.approvedByMemberName
                            });
                            return acc;
                          }, {} as Record<string, { approvedDate: string; notes: string | null; approvers: { id: number; name: string }[] }>);

                          return Object.values(groupedApprovals).map((group, groupIndex) => (
                            <Card
                              key={`${group.approvedDate}-${groupIndex}`}
                              variant="outlined"
                              sx={{
                                mb: 2,
                                backgroundColor: groupIndex % 2 === 0 ? 'background.paper' : 'grey.50',
                              }}
                            >
                              <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                  <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle2" fontWeight={600}>
                                      {group.approvers.map(a => a.name).join(', ')}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Approved on {formatDate(group.approvedDate)}
                                    </Typography>
                                    {group.notes && (
                                      <Box
                                        sx={{
                                          mt: 1,
                                          p: 1.5,
                                          bgcolor: 'grey.100',
                                          borderRadius: 1,
                                          borderLeft: 3,
                                          borderColor: 'primary.main',
                                        }}
                                      >
                                        <Typography
                                          variant="body2"
                                          sx={{ whiteSpace: 'pre-wrap' }}
                                        >
                                          {group.notes}
                                        </Typography>
                                      </Box>
                                    )}
                                  </Box>
                                </Box>
                              </CardContent>
                            </Card>
                          ));
                        })()}
                      </List>
                    )}

                    {cycleIndex < history.reviewCycles.length - 1 && (
                      <Divider sx={{ my: 3 }} />
                    )}
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>

        {/* Footer */}
        <Box
          sx={{
            p: 2,
            borderTop: 1,
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <Button onClick={onClose} variant="outlined">
            Close
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};
