import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Alert,
  TextField,
  InputAdornment,
  IconButton,
  Skeleton,
  useTheme,
  useMediaQuery,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Share as ShareIcon,
  PictureAsPdf as PdfIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import {
  useEvents,
  useMonthlyAnalyticsForAllEvents,
} from '../../hooks/useAttendance';
import { useAuth } from '../../contexts';
import { MonthlyAttendanceChart } from '../../components/Attendance';
import {
  sendEmailWithAttachment,
  isValidEmail,
  generateReportEmailBody,
} from '../../services/emailService';
import { logger } from '../../utils/logger';

export interface AttendanceAnalyticsPageProps {
  /** Whether the analytics tab is currently active */
  isActive?: boolean;
}

/**
 * Attendance Analytics Dashboard
 * Shows charts for each event marked as "Display In Charts"
 */
export const AttendanceAnalyticsPage: React.FC<
  AttendanceAnalyticsPageProps
> = ({ isActive = true }) => {
  const { isAuthenticated } = useAuth();
  const {
    data: events,
    isLoading: eventsLoading,
    error: eventsError,
  } = useEvents();
  const [searchTerm, setSearchTerm] = useState('');
  const [shareMenuAnchor, setShareMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [isExporting, setIsExporting] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [emailError, setEmailError] = useState('');
  const chartsContainerRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Get monthly analytics for all showInAnalysis events
  const {
    data: monthlyAnalyticsArray,
    isLoading: analyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics,
  } = useMonthlyAnalyticsForAllEvents();

  // Transform array to record keyed by event ID
  const monthlyAnalytics = useMemo(() => {
    if (!monthlyAnalyticsArray) {
      logger.debug('No monthlyAnalyticsArray available');
      return {};
    }

    logger.debug('Transforming analytics array to record', {
      monthlyAnalyticsArray,
    });

    const result = monthlyAnalyticsArray.reduce(
      (acc, analytics) => {
        logger.debug(`Adding analytics for eventId ${analytics.eventId}`, {
          analytics,
        });
        acc[analytics.eventId] = analytics;
        return acc;
      },
      {} as Record<
        number,
        import('../../types/attendance').MonthlyAnalyticsResponse
      >
    );

    logger.debug('Final analytics record', { result });
    return result;
  }, [monthlyAnalyticsArray]);

  // Refetch analytics when tab becomes active
  useEffect(() => {
    if (isActive) {
      refetchAnalytics();
    }
  }, [isActive, refetchAnalytics]);

  // Debug logging
  logger.debug('AttendanceAnalyticsPage Debug', {
    events,
    analyticsEvents: events?.filter((event) => event.showInAnalysis),
    monthlyAnalyticsArray,
    monthlyAnalytics,
    analyticsLoading,
    analyticsError,
  });

  // Filter events based on search term
  const filteredEvents = useMemo(() => {
    const analyticsEvents =
      events?.filter((event) => event.showInAnalysis) || [];

    if (!searchTerm.trim()) {
      return analyticsEvents;
    }

    return analyticsEvents.filter(
      (event) =>
        event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [events, searchTerm]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const handleShareMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setShareMenuAnchor(event.currentTarget);
  };

  const handleShareMenuClose = () => {
    setShareMenuAnchor(null);
  };

  const handleExportToPDF = async () => {
    if (!chartsContainerRef.current || filteredEvents.length === 0) {
      return;
    }

    setIsExporting(true);
    handleShareMenuClose();

    try {
      // Dynamic import to avoid bundle size issues
      const { default: html2canvas } = await import('html2canvas');
      const { jsPDF } = await import('jspdf');

      // Create PDF instance
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      // Get all chart elements
      const chartElements = chartsContainerRef.current.querySelectorAll(
        '[data-chart-container]'
      );
      const chartsPerPage = 6; // 3 across x 2 down per page
      const chartWidth = 90; // mm
      const chartHeight = 60; // mm
      const marginX = 10;
      const marginY = 20;
      const spacingX = 5;
      const spacingY = 10;

      // Add title page
      pdf.setFontSize(20);
      pdf.text('Attendance Analytics Report', 148, 30, { align: 'center' });
      pdf.setFontSize(12);
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 148, 40, {
        align: 'center',
      });
      pdf.text(`${filteredEvents.length} Events Included`, 148, 50, {
        align: 'center',
      });

      // Process charts in batches
      for (let i = 0; i < chartElements.length; i++) {
        const chartElement = chartElements[i] as HTMLElement;
        const chartIndex = i % chartsPerPage;

        // Add new page if needed (skip first page as it already exists)
        if (i > 0 && chartIndex === 0) {
          pdf.addPage();
        }

        // Calculate position (3 across, 2 down)
        const col = chartIndex % 3;
        const row = Math.floor(chartIndex / 3);
        const x = marginX + col * (chartWidth + spacingX);
        const y = marginY + row * (chartHeight + spacingY);

        // Capture chart as canvas
        const canvas = await html2canvas(chartElement, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
        });

        // Convert to image and add to PDF
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', x, y, chartWidth, chartHeight);
      }

      // Save the PDF
      pdf.save(
        `attendance-analytics-${new Date().toISOString().split('T')[0]}.pdf`
      );
    } catch (error) {
      console.error('Error generating PDF:', error);
      // You might want to show a user-friendly error message here
    } finally {
      setIsExporting(false);
    }
  };

  const handleEmailModalOpen = () => {
    setEmailModalOpen(true);
    handleShareMenuClose();
  };

  const handleEmailModalClose = () => {
    setEmailModalOpen(false);
    setEmailAddress('');
    setEmailError('');
  };

  const generatePDFBlob = async (): Promise<Blob | null> => {
    if (!chartsContainerRef.current || filteredEvents.length === 0) {
      return null;
    }

    try {
      // Dynamic import to avoid bundle size issues
      const { default: html2canvas } = await import('html2canvas');
      const { jsPDF } = await import('jspdf');

      // Create PDF instance
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      // Get all chart elements
      const chartElements = chartsContainerRef.current.querySelectorAll(
        '[data-chart-container]'
      );
      const chartsPerPage = 6; // 3 across x 2 down per page
      const chartWidth = 90; // mm
      const chartHeight = 60; // mm
      const marginX = 10;
      const marginY = 20;
      const spacingX = 5;
      const spacingY = 10;

      // Add title page
      pdf.setFontSize(20);
      pdf.text('Attendance Analytics Report', 148, 30, { align: 'center' });
      pdf.setFontSize(12);
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 148, 40, {
        align: 'center',
      });
      pdf.text(`${filteredEvents.length} Events Included`, 148, 50, {
        align: 'center',
      });

      // Process charts in batches
      for (let i = 0; i < chartElements.length; i++) {
        const chartElement = chartElements[i] as HTMLElement;
        const chartIndex = i % chartsPerPage;

        // Add new page if needed (skip first page as it already exists)
        if (i > 0 && chartIndex === 0) {
          pdf.addPage();
        }

        // Calculate position (3 across, 2 down)
        const col = chartIndex % 3;
        const row = Math.floor(chartIndex / 3);
        const x = marginX + col * (chartWidth + spacingX);
        const y = marginY + row * (chartHeight + spacingY);

        // Capture chart as canvas
        const canvas = await html2canvas(chartElement, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
        });

        // Convert to image and add to PDF
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', x, y, chartWidth, chartHeight);
      }

      // Return PDF as blob
      return pdf.output('blob');
    } catch (error) {
      console.error('Error generating PDF:', error);
      return null;
    }
  };

  const handleSendEmail = async () => {
    if (!emailAddress.trim()) {
      setEmailError('Please enter a valid email address');
      return;
    }

    if (!isValidEmail(emailAddress)) {
      setEmailError('Please enter a valid email format');
      return;
    }

    setIsEmailSending(true);
    setEmailError('');

    try {
      // Generate PDF blob
      const pdfBlob = await generatePDFBlob();
      if (!pdfBlob) {
        throw new Error('Failed to generate PDF');
      }

      // Send email using email service
      const result = await sendEmailWithAttachment({
        toEmail: emailAddress.trim(),
        subject: 'Church Attendance Analytics Report',
        body: generateReportEmailBody(filteredEvents.length),
        attachment: pdfBlob,
        attachmentName: `attendance-analytics-${new Date().toISOString().split('T')[0]}.pdf`,
      });

      if (!result.success) {
        throw new Error(result.message);
      }

      // Success
      handleEmailModalClose();
      // You might want to show a success notification here
    } catch (error) {
      console.error('Error sending email:', error);
      setEmailError(
        error instanceof Error ? error.message : 'Failed to send email'
      );
    } finally {
      setIsEmailSending(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">
          You must be logged in to view attendance analytics.
        </Alert>
      </Container>
    );
  }

  if (eventsLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <AnalyticsIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Attendance Analytics
          </Typography>
        </Box>
        <Typography>Loading analytics...</Typography>
      </Container>
    );
  }

  if (eventsError) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Error loading events:{' '}
          {eventsError instanceof Error ? eventsError.message : 'Unknown error'}
        </Alert>
      </Container>
    );
  }

  if (analyticsError) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <AnalyticsIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Attendance Analytics
          </Typography>
        </Box>
        <Alert severity="error">
          Error loading analytics:{' '}
          {analyticsError instanceof Error
            ? analyticsError.message
            : 'Unknown error'}
        </Alert>
      </Container>
    );
  }

  const analyticsEvents = events?.filter((event) => event.showInAnalysis) || [];

  return (
    <Box
      sx={{
        py: 2,
        px: { xs: 2, sm: 3, md: 4 },
        width: '100%',
        height: '100%',
      }}
    >
      {/* Page Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="flex-start"
        mb={2}
      >
        <Box>
          <Typography variant="h4" gutterBottom>
            Attendance Analytics
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            View attendance trends and analytics across all events
          </Typography>
        </Box>

        {analyticsEvents.length > 0 && (
          <Box>
            <Button
              variant="outlined"
              startIcon={
                isExporting ? <CircularProgress size={16} /> : <ShareIcon />
              }
              onClick={handleShareMenuOpen}
              disabled={isExporting || filteredEvents.length === 0}
              sx={{ ml: 2 }}
            >
              {isExporting ? 'Exporting...' : 'Share'}
            </Button>
            <Menu
              anchorEl={shareMenuAnchor}
              open={Boolean(shareMenuAnchor)}
              onClose={handleShareMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem onClick={handleExportToPDF} disabled={isExporting}>
                <ListItemIcon>
                  <PdfIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Export to PDF</ListItemText>
              </MenuItem>
              <MenuItem
                onClick={handleEmailModalOpen}
                disabled={isExporting || filteredEvents.length === 0}
              >
                <ListItemIcon>
                  <EmailIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Email Report</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Box>

      {analyticsEvents.length === 0 ? (
        <Alert severity="info">
          No events are currently configured to display in analytics. Please
          configure events to show in analytics from the events management page.
        </Alert>
      ) : (
        <>
          {/* Search Filter */}
          <Box sx={{ mb: 3 }}>
            <Paper sx={{ p: 2 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search events..."
                value={searchTerm}
                size="small"
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="clear search"
                        onClick={handleClearSearch}
                        edge="end"
                      >
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ maxWidth: 400 }}
              />
            </Paper>
          </Box>

          {/* Analytics Charts Grid */}
          {analyticsLoading ? (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: isMobile
                  ? '1fr'
                  : 'repeat(auto-fit, minmax(400px, 1fr))',
                gap: 3,
                maxWidth: '100%',
              }}
            >
              {Array.from({ length: Math.min(filteredEvents.length, 6) }).map(
                (_, index) => (
                  <Box key={index} sx={{ height: 400 }}>
                    <Skeleton
                      variant="rectangular"
                      width="100%"
                      height="100%"
                    />
                  </Box>
                )
              )}
            </Box>
          ) : filteredEvents.length === 0 ? (
            <Alert severity="info">
              {searchTerm.trim()
                ? `No events found matching "${searchTerm}"`
                : 'No events available for analytics'}
            </Alert>
          ) : (
            <Box
              ref={chartsContainerRef}
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  md: 'repeat(2, 1fr)',
                  lg: 'repeat(3, 1fr)',
                },
                gap: 3,
                maxWidth: '100%',
              }}
            >
              {filteredEvents.map((event) => {
                const eventAnalytics = monthlyAnalytics?.[event.id];
                const monthlyData = eventAnalytics?.monthlyData || [];

                logger.debug(`Chart mapping for ${event.name}`, {
                  eventId: event.id,
                  eventName: event.name,
                  foundAnalytics: !!eventAnalytics,
                  analyticsKeys: Object.keys(monthlyAnalytics || {}),
                  monthlyDataLength: monthlyData.length,
                  eventAnalytics,
                });

                return (
                  <Box key={event.id} data-chart-container>
                    <MonthlyAttendanceChart
                      event={event}
                      monthlyData={monthlyData}
                      isLoading={analyticsLoading}
                    />
                  </Box>
                );
              })}
            </Box>
          )}
        </>
      )}

      {/* Email Modal */}
      <Dialog
        open={emailModalOpen}
        onClose={handleEmailModalClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box
            sx={{
              bgcolor: 'grey.100',
              p: 2,
              m: -3,
              mb: 0,
              borderRadius: '4px 4px 0 0',
            }}
          >
            <Typography variant="h5" color="primary.main" fontWeight="bold">
              Email Analytics Report
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Send the attendance analytics report as a PDF attachment to the
            specified email address.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Email Address"
            type="email"
            fullWidth
            variant="outlined"
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
            error={!!emailError}
            helperText={emailError}
            placeholder="Enter recipient email address"
            disabled={isEmailSending}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEmailModalClose} disabled={isEmailSending}>
            Cancel
          </Button>
          <Button
            onClick={handleSendEmail}
            variant="contained"
            disabled={isEmailSending || !emailAddress.trim()}
            startIcon={
              isEmailSending ? <CircularProgress size={16} /> : <EmailIcon />
            }
          >
            {isEmailSending ? 'Sending...' : 'Send Email'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AttendanceAnalyticsPage;
