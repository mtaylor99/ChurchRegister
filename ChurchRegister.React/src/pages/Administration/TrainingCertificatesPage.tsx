import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  Paper,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  School as SchoolIcon,
  FileDownload as ExportIcon,
  CardMembership as CertificateIcon,
  Assignment as TrainingIcon,
} from '@mui/icons-material';
import {
  TrainingCertificateGrid,
  TrainingCertificateDrawer,
  TrainingCertificateTypeGrid,
} from '../../components/TrainingCertificates';
import type { TrainingCertificateDto } from '../../types/trainingCertificates';
import { trainingCertificatesApi } from '../../services/api';
import { exportTrainingCertificatesToExcel } from '../../utils/excelExport';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`training-tabpanel-${index}`}
      aria-labelledby={`training-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `training-tab-${index}`,
    'aria-controls': `training-tabpanel-${index}`,
  };
}

/**
 * Training Certificates Management page
 * Two tabs: Certification (grid) and Training/Checks (type management)
 * Follows attendance-style layout with tab navigation
 */
export const TrainingCertificatesPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedCertificate, setSelectedCertificate] =
    useState<TrainingCertificateDto | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [showExpired, setShowExpired] = useState(false);

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle grid events
  const handleEditCertificate = (certificate: TrainingCertificateDto) => {
    setSelectedCertificate(certificate);
    setDrawerMode('edit');
    setDrawerOpen(true);
  };

  const handleViewCertificate = (certificate: TrainingCertificateDto) => {
    setSelectedCertificate(certificate);
    setDrawerMode('view');
    setDrawerOpen(true);
  };

  const handleAddCertificate = () => {
    setSelectedCertificate(null);
    setDrawerMode('add');
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedCertificate(null);
  };

  const handleSuccess = () => {
    handleDrawerClose();
    // The grid will refresh automatically via React Query
  };

  const handleFilterChange = (showExpiredValue: boolean) => {
    setShowExpired(showExpiredValue);
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportError(null);
    
    try {
      // Fetch all certificates (paginated API, fetch all pages)
      let allCertificates: TrainingCertificateDto[] = [];
      let currentPage = 1;
      const pageSize = 100;
      let hasMore = true;

      while (hasMore) {
        const result = await trainingCertificatesApi.getTrainingCertificates({
          page: currentPage,
          pageSize,
          sortBy: 'Expires',
          sortDirection: 'asc',
          expiringWithinDays: 60, // Used for RAG status calculation (alert chips)
          status: showExpired ? undefined : '!EXPIRED', // Exclude expired if toggle is off
        });

        allCertificates = [...allCertificates, ...result.items];
        hasMore = currentPage < result.totalPages;
        currentPage++;
      }

      if (allCertificates.length === 0) {
        setExportError('No certificates to export');
        return;
      }

      // Export to Excel with RAG color styling
      await exportTrainingCertificatesToExcel(allCertificates);
      setExportSuccess(true);
    } catch (error) {
      console.error('Export failed:', error);
      setExportError('Failed to export training certificates. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

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
        alignItems="center"
        mb={2}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <SchoolIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" component="h1" fontWeight={700}>
              Training & Certifications
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage training certificates and checks for church members
            </Typography>
          </Box>
        </Box>

        {/* Actions - Show different buttons based on active tab */}
        <Box display="flex" gap={2}>
          {tabValue === 0 && (
            <>
              <Button
                variant="outlined"
                startIcon={<ExportIcon />}
                size="large"
                onClick={handleExport}
                disabled={isExporting}
                sx={{ px: 3, py: 1.5 }}
              >
                {isExporting ? (
                  <>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    Exporting...
                  </>
                ) : (
                  'Export'
                )}
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                size="large"
                onClick={handleAddCertificate}
                sx={{ px: 3, py: 1.5 }}
              >
                Add Certificate
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="training certificate tabs"
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                minHeight: 64,
                textTransform: 'none',
                fontSize: '1rem',
              },
            }}
          >
            <Tab
              label="Certification"
              icon={<CertificateIcon />}
              iconPosition="start"
              {...a11yProps(0)}
            />
            <Tab
              label="Training/Checks"
              icon={<TrainingIcon />}
              iconPosition="start"
              {...a11yProps(1)}
            />
          </Tabs>
        </Box>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        {/* Certification Grid */}
        <TrainingCertificateGrid
          onEditCertificate={handleEditCertificate}
          onViewCertificate={handleViewCertificate}
          onFilterChange={handleFilterChange}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* Training/Checks Type Management */}
        <TrainingCertificateTypeGrid />
      </TabPanel>

      {/* Certificate Drawer */}
      <TrainingCertificateDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        mode={drawerMode}
        certificate={selectedCertificate}
        onSuccess={handleSuccess}
      />

      {/* Export Success Snackbar */}
      <Snackbar
        open={exportSuccess}
        autoHideDuration={4000}
        onClose={() => setExportSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setExportSuccess(false)}
          severity="success"
          sx={{ width: '100%' }}
        >
          Training certificates exported successfully!
        </Alert>
      </Snackbar>

      {/* Export Error Snackbar */}
      <Snackbar
        open={exportError !== null}
        autoHideDuration={6000}
        onClose={() => setExportError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setExportError(null)}
          severity="error"
          sx={{ width: '100%' }}
        >
          {exportError}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TrainingCertificatesPage;
