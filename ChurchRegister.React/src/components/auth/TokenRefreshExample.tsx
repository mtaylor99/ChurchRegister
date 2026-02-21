import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Chip,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  AccessTime as TimeIcon,
  Security as SecurityIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useTokenRefresh } from '../../hooks/useTokenRefresh';
import { httpInterceptor } from '../../services/auth/httpInterceptor';

/**
 * Example component demonstrating enhanced token refresh system
 * Shows real-time token status, refresh operations, and HTTP interceptor stats
 */
export const TokenRefreshExample: React.FC = () => {
  const [refreshLogs, setRefreshLogs] = useState<string[]>([]);
  const [testApiCallsCount, setTestApiCallsCount] = useState(0);
  const [testApiResults, setTestApiResults] = useState<string[]>([]);

  const tokenRefresh = useTokenRefresh({
    onRefreshSuccess: () => {
      const message = `✅ Token refreshed successfully at ${new Date().toLocaleTimeString()}`;
      setRefreshLogs((prev) => [message, ...prev.slice(0, 9)]);
    },
    onRefreshError: (error) => {
      const message = `❌ Token refresh failed: ${error.message} at ${new Date().toLocaleTimeString()}`;
      setRefreshLogs((prev) => [message, ...prev.slice(0, 9)]);
    },
    enableLogging: true,
  });

  const [tokenInfo, setTokenInfo] = useState(() => tokenRefresh.getTokenInfo());
  const [interceptorStats, setInterceptorStats] = useState({
    pendingRequests: 0,
  });

  // Update token info periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setTokenInfo(tokenRefresh.getTokenInfo());
      setInterceptorStats({
        pendingRequests: httpInterceptor.getPendingRequestsCount(),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [tokenRefresh]);

  const handleManualRefresh = async () => {
    try {
      await tokenRefresh.refreshNow();
      setRefreshLogs((prev) => [
        `🔄 Manual refresh triggered at ${new Date().toLocaleTimeString()}`,
        ...prev.slice(0, 9),
      ]);
    } catch (error) {
      setRefreshLogs((prev) => [
        `❌ Manual refresh failed: ${error instanceof Error ? error.message : 'Unknown error'} at ${new Date().toLocaleTimeString()}`,
        ...prev.slice(0, 9),
      ]);
    }
  };

  const handleTestApiCall = async () => {
    setTestApiCallsCount((prev) => prev + 1);
    const callNumber = testApiCallsCount + 1;

    try {
      setTestApiResults((prev) => [
        `🚀 API Call #${callNumber} started at ${new Date().toLocaleTimeString()}`,
        ...prev.slice(0, 9),
      ]);

      // Make a test API call through the interceptor
      const response = await httpInterceptor.fetch('/api/auth/profile', {
        method: 'GET',
      });

      if (response.ok) {
        setTestApiResults((prev) => [
          `✅ API Call #${callNumber} succeeded at ${new Date().toLocaleTimeString()}`,
          ...prev.slice(0, 9),
        ]);
      } else {
        setTestApiResults((prev) => [
          `⚠️ API Call #${callNumber} failed with status ${response.status} at ${new Date().toLocaleTimeString()}`,
          ...prev.slice(0, 9),
        ]);
      }
    } catch (error) {
      setTestApiResults((prev) => [
        `❌ API Call #${callNumber} error: ${error instanceof Error ? error.message : 'Unknown error'} at ${new Date().toLocaleTimeString()}`,
        ...prev.slice(0, 9),
      ]);
    }
  };

  const formatTimeUntilExpiry = (ms: number): string => {
    if (ms <= 0) return 'Expired';

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const getStatusColor = () => {
    if (!tokenRefresh.hasToken()) return 'error';
    if (tokenRefresh.isRefreshing) return 'warning';
    if (!tokenRefresh.isTokenValid()) return 'error';
    if (tokenRefresh.willExpireSoon()) return 'warning';
    return 'success';
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Enhanced Token Refresh System
      </Typography>

      <Typography variant="body1" paragraph color="text.secondary">
        Real-time monitoring of the enhanced token refresh system with race
        condition prevention, automatic retry logic, and HTTP request
        interception.
      </Typography>

      <Stack spacing={3}>
        {/* Token Status Card */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <TimeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Token Status
            </Typography>

            {tokenRefresh.isRefreshing && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Token refresh in progress...
                </Typography>
                <LinearProgress />
              </Box>
            )}

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Property</TableCell>
                    <TableCell>Value</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Has Token</TableCell>
                    <TableCell>
                      <Chip
                        label={tokenRefresh.hasToken() ? 'Yes' : 'No'}
                        color={tokenRefresh.hasToken() ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {tokenRefresh.hasToken() ? (
                        <CheckIcon color="success" />
                      ) : (
                        <ErrorIcon color="error" />
                      )}
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell>Token Valid</TableCell>
                    <TableCell>
                      <Chip
                        label={
                          tokenRefresh.isTokenValid() ? 'Valid' : 'Invalid'
                        }
                        color={
                          tokenRefresh.isTokenValid() ? 'success' : 'error'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {tokenRefresh.isTokenValid() ? (
                        <CheckIcon color="success" />
                      ) : (
                        <ErrorIcon color="error" />
                      )}
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell>Expires Soon</TableCell>
                    <TableCell>
                      <Chip
                        label={tokenRefresh.willExpireSoon() ? 'Yes' : 'No'}
                        color={
                          tokenRefresh.willExpireSoon() ? 'warning' : 'success'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {tokenRefresh.willExpireSoon() ? (
                        <ErrorIcon color="warning" />
                      ) : (
                        <CheckIcon color="success" />
                      )}
                    </TableCell>
                  </TableRow>

                  {tokenInfo && (
                    <>
                      <TableRow>
                        <TableCell>Expires At</TableCell>
                        <TableCell>
                          {tokenInfo.expiresAt.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <InfoIcon color="info" />
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell>Time Until Expiry</TableCell>
                        <TableCell>
                          {formatTimeUntilExpiry(tokenInfo.timeUntilExpiry)}
                        </TableCell>
                        <TableCell>
                          <TimeIcon
                            color={
                              tokenInfo.timeUntilExpiry < 300000
                                ? 'warning'
                                : 'info'
                            }
                          />
                        </TableCell>
                      </TableRow>
                    </>
                  )}

                  <TableRow>
                    <TableCell>Refresh Count</TableCell>
                    <TableCell>
                      <Chip
                        label={tokenRefresh.refreshCount}
                        color="info"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <InfoIcon color="info" />
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell>Last Refresh</TableCell>
                    <TableCell>
                      {tokenRefresh.lastRefresh
                        ? tokenRefresh.lastRefresh.toLocaleString()
                        : 'Never'}
                    </TableCell>
                    <TableCell>
                      <InfoIcon color="info" />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={handleManualRefresh}
                disabled={tokenRefresh.isRefreshing || !tokenRefresh.hasToken()}
                color={getStatusColor()}
              >
                Manual Refresh
              </Button>

              <Button
                variant="outlined"
                onClick={handleTestApiCall}
                disabled={!tokenRefresh.hasToken()}
              >
                Test API Call ({testApiCallsCount})
              </Button>

              {tokenRefresh.error && (
                <Button
                  variant="text"
                  color="error"
                  onClick={tokenRefresh.clearError}
                >
                  Clear Error
                </Button>
              )}
            </Box>

            {tokenRefresh.error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {tokenRefresh.error}
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* HTTP Interceptor Stats */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              HTTP Interceptor Statistics
            </Typography>

            <Typography variant="body2" paragraph color="text.secondary">
              Monitor HTTP request interception and automatic token refresh
              integration.
            </Typography>

            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Chip
                label={`Pending Requests: ${interceptorStats.pendingRequests}`}
                color={
                  interceptorStats.pendingRequests > 0 ? 'warning' : 'default'
                }
                variant="outlined"
              />
              <Chip
                label={`API Test Calls: ${testApiCallsCount}`}
                color="info"
                variant="outlined"
              />
            </Stack>
          </CardContent>
        </Card>

        {/* Activity Logs */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
          {/* Token Refresh Logs */}
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Token Refresh Activity
              </Typography>

              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {refreshLogs.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No refresh activity yet
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {refreshLogs.map((log, index) => (
                      <Typography
                        key={index}
                        variant="body2"
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: '0.8rem',
                          p: 1,
                          bgcolor: 'action.hover',
                          borderRadius: 1,
                        }}
                      >
                        {log}
                      </Typography>
                    ))}
                  </Stack>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* API Call Results */}
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                API Call Results
              </Typography>

              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {testApiResults.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No API calls made yet
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {testApiResults.map((result, index) => (
                      <Typography
                        key={index}
                        variant="body2"
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: '0.8rem',
                          p: 1,
                          bgcolor: 'action.hover',
                          borderRadius: 1,
                        }}
                      >
                        {result}
                      </Typography>
                    ))}
                  </Stack>
                )}
              </Box>
            </CardContent>
          </Card>
        </Stack>
      </Stack>
    </Box>
  );
};
