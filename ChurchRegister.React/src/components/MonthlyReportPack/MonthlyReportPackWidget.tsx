import { useState, useRef, useMemo } from 'react';
import {
  Card,
  CardContent,
  Button,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
  Box,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import {
  getPastoralCareReport,
  getTrainingReport,
  getRiskAssessmentsReport,
  getRemindersReport,
} from '../../api/monthlyReportPackApi';
import { useEvents, useMonthlyAnalyticsForAllEvents } from '../../hooks/useAttendance';
import { MonthlyAttendanceChart } from '../Attendance';
import { generateAttendanceAnalyticsPdfFromCharts } from '../../utils/exportAttendanceAnalyticsPdf';
import GenerationProgressModal from './GenerationProgressModal';

const MonthlyReportPackWidget = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [currentReport, setCurrentReport] = useState<string>('');
  const [reportsCompleted, setReportsCompleted] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info'>('success');
  const chartsContainerRef = useRef<HTMLDivElement>(null);

  // Fetch attendance data for charts
  const { data: events } = useEvents();
  const { data: monthlyAnalyticsArray } = useMonthlyAnalyticsForAllEvents();

  // Transform analytics array to record
  const monthlyAnalytics = useMemo(() => {
    if (!monthlyAnalyticsArray) return {};
    return monthlyAnalyticsArray.reduce(
      (acc, analytics) => {
        acc[analytics.eventId] = analytics;
        return acc;
      },
      {} as Record<number, import('../../types/attendance').MonthlyAnalyticsResponse>
    );
  }, [monthlyAnalyticsArray]);

  // Filter events that should show in analytics
  const analyticsEvents = useMemo(() => {
    return events?.filter((event) => event.showInAnalysis) || [];
  }, [events]);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleGenerateClick = async () => {
    setIsGenerating(true);
    setProgressModalOpen(true);
    setReportsCompleted(0);

    let successCount = 0;
    let failedReports: string[] = [];

    const reports: Array<{ name: string; fetch: () => Promise<Blob>; filename: string }> = [
      {
        name: 'Attendance Analytics',
        fetch: async () => {
          if (!chartsContainerRef.current || analyticsEvents.length === 0) {
            throw new Error('No attendance data available');
          }
          // Wait for charts to fully render and mount
          // Charts have animations disabled (animate=false) for faster PDF generation
          // Base delay ensures DOM is ready, per-chart delay ensures all charts are mounted
          const baseDelay = 1000;
          const perChartDelay = 100;
          const totalDelay = baseDelay + (analyticsEvents.length * perChartDelay);
          await new Promise(resolve => setTimeout(resolve, totalDelay));
          return generateAttendanceAnalyticsPdfFromCharts(
            chartsContainerRef.current,
            analyticsEvents.length
          );
        },
        filename: 'Attendance-Analytics.pdf',
      },
      { name: 'Pastoral Care', fetch: getPastoralCareReport, filename: 'Pastoral-Care.pdf' },
      { name: 'Training', fetch: getTrainingReport, filename: 'Training.pdf' },
      { name: 'Risk Assessments', fetch: getRiskAssessmentsReport, filename: 'Risk-Assessments.pdf' },
      { name: 'Reminders', fetch: getRemindersReport, filename: 'Reminders.pdf' },
    ];
    
    for (let i = 0; i < reports.length; i++) {
      const report = reports[i];
      setCurrentReport(report.name);

      try {
        const blob = await report.fetch();
        downloadBlob(blob, report.filename);
        successCount++;
        setReportsCompleted(i + 1);
        
        // Small delay to ensure download starts before next one
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error: any) {
        console.error(`Failed to generate ${report.name}:`, error);
        failedReports.push(report.name);
        setReportsCompleted(i + 1);
      }
    }

    setProgressModalOpen(false);
    setIsGenerating(false);

    if (successCount === reports.length) {
      setSnackbarMessage(`All ${successCount} reports downloaded successfully.`);
      setSnackbarSeverity('success');
    } else if (successCount > 0) {
      setSnackbarMessage(`${successCount} of ${reports.length} reports downloaded. Failed: ${failedReports.join(', ')}`);
      setSnackbarSeverity('success');
    } else {
      setSnackbarMessage('All reports failed to generate. Please check your permissions.');
      setSnackbarSeverity('error');
    }

    setSnackbarOpen(true);
  };

  const handleCancelGeneration = () => {
    setProgressModalOpen(false);
    setIsGenerating(false);
    setSnackbarMessage('Report generation cancelled');
    setSnackbarSeverity('info');
    setSnackbarOpen(true);
  };

  return (
    <>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Monthly Report Pack
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Download monthly reports (Attendance Analytics, Pastoral Care, Training, Risk Assessments, Reminders)
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            startIcon={isGenerating ? <CircularProgress size={20} /> : <DownloadIcon />}
            onClick={handleGenerateClick}
            disabled={isGenerating || analyticsEvents.length === 0}
            fullWidth
          >
            {isGenerating ? 'Downloading Reports...' : 'Download Monthly Reports'}
          </Button>
          {analyticsEvents.length === 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              No attendance analytics events available
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Hidden container for rendering attendance charts */}
      <Box
        ref={chartsContainerRef}
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '1200px',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: -1,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 3,
        }}
      >
        {analyticsEvents.map((event) => {
          const eventAnalytics = monthlyAnalytics?.[event.id];
          const monthlyData = eventAnalytics?.monthlyData || [];

          return (
            <Box key={event.id} data-chart-container>
              <MonthlyAttendanceChart
                event={event}
                monthlyData={monthlyData}
                isLoading={false}
                animate={false}
              />
            </Box>
          );
        })}
      </Box>

      <GenerationProgressModal
        open={progressModalOpen}
        currentReport={currentReport}
        reportsCompleted={reportsCompleted}
        totalReports={5}
        onCancel={handleCancelGeneration}
      />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default MonthlyReportPackWidget;
