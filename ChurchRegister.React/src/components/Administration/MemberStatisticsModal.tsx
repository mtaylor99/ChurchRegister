import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
  Box,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Divider,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { churchMembersApi } from '@services/api';

interface MemberStatisticsModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Modal displaying active member statistics: envelope count, residence count,
 * no-address count, and per-district breakdown.
 */
export const MemberStatisticsModal: React.FC<MemberStatisticsModalProps> = ({
  open,
  onClose,
}) => {
  const {
    data: stats,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['memberStatistics'],
    queryFn: () => churchMembersApi.getMemberStatistics(),
    enabled: open,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Member Statistics</DialogTitle>
      <DialogContent dividers>
        {isLoading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        )}

        {isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to load statistics:{' '}
            {error instanceof Error ? error.message : 'Unknown error'}
          </Alert>
        )}

        {stats && (
          <Box>
            {/* Summary stats */}
            <Typography variant="h6" gutterBottom>
              Active Members Summary
            </Typography>
            <Box
              display="grid"
              gridTemplateColumns="repeat(3, 1fr)"
              gap={2}
              mb={3}
            >
              <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {stats.envelopeCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Envelope Recipients
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {stats.residenceCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Residences (Unique Addresses)
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {stats.noAddressCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Members Without Address
                </Typography>
              </Paper>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* District breakdown */}
            <Typography variant="h6" gutterBottom>
              District Breakdown
            </Typography>
            {stats.districtBreakdown.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No district data available.
              </Typography>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <strong>District</strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>Residences</strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>Members</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.districtBreakdown.map((district) => (
                      <TableRow key={district.districtName} hover>
                        <TableCell>
                          {district.deaconName
                            ? `${district.districtName} (${district.deaconName})`
                            : district.districtName}
                        </TableCell>
                        <TableCell align="right">
                          {district.residenceCount}
                        </TableCell>
                        <TableCell align="right">
                          {district.memberCount}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MemberStatisticsModal;
