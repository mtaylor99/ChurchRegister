import { useState, useRef } from 'react';
import { Box, Button, Typography, CircularProgress, Alert, Snackbar, Tabs, Tab, Paper } from '@mui/material';
import { Shield as ShieldIcon, Settings as SettingsIcon, PictureAsPdf as PdfIcon } from '@mui/icons-material';
import { RiskAssessmentsGrid } from '../components/RiskAssessments/RiskAssessmentsGrid';
import { ViewRiskAssessmentDrawer } from '../components/RiskAssessments/ViewRiskAssessmentDrawer';
import { EditRiskAssessmentDrawer } from '../components/RiskAssessments/EditRiskAssessmentDrawer';
import { AddRiskAssessmentDrawer } from '../components/RiskAssessments/AddRiskAssessmentDrawer';
import { ApproveRiskAssessmentDrawer } from '../components/RiskAssessments/ApproveRiskAssessmentDrawer';
import { CategoryManagementGrid, type CategoryManagementGridRef } from '../components/RiskAssessments/CategoryManagementGrid';
import { ViewHistoryDrawer } from '../components/RiskAssessments/ViewHistoryDrawer';
import type { RiskAssessment } from '../types/riskAssessments';
import {
  useRiskAssessments,
  useRiskAssessment,
  useRiskAssessmentCategories,
  useStartReview,
} from '../hooks/useRiskAssessments';
import { exportRiskAssessmentsPdf } from '../utils/exportRiskAssessmentsPdf';

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
      id={`risk-assessment-tabpanel-${index}`}
      aria-labelledby={`risk-assessment-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `risk-assessment-tab-${index}`,
    'aria-controls': `risk-assessment-tabpanel-${index}`,
  };
}

export function RiskAssessmentsPage() {
  // Tab state
  const [tabValue, setTabValue] = useState(0);
  
  // Ref for CategoryManagementGrid
  const categoryGridRef = useRef<CategoryManagementGridRef>(null);
  
  // Filter state
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [status, setStatus] = useState<'Approved' | 'Under Review' | undefined>(undefined);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [title, setTitle] = useState<string>('');

  // Drawer state
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [approveDrawerOpen, setApproveDrawerOpen] = useState(false);
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<number | null>(null);

  // PDF export state
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Data fetching
  const { data: assessments = [], isLoading } = useRiskAssessments(
    categoryId,
    status,
    overdueOnly,
    title
  );
  const { data: categories = [] } = useRiskAssessmentCategories();
  const { data: selectedAssessment } = useRiskAssessment(selectedAssessmentId);

  // Mutations
  const startReviewMutation = useStartReview();

  // Tab change handler
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Filter handlers
  const handleFilterChange = (
    newCategoryId: number | null,
    newStatus: string,
    newOverdueOnly: boolean,
    newTitle: string
  ) => {
    setCategoryId(newCategoryId ?? undefined);
    setStatus(newStatus as 'Approved' | 'Under Review' | undefined);
    setOverdueOnly(newOverdueOnly);
    setTitle(newTitle);
  };

  // Action handlers
  const handleViewClick = (assessment: RiskAssessment) => {
    setSelectedAssessmentId(assessment.id);
    setViewDrawerOpen(true);
  };

  const handleEditClick = (assessment: RiskAssessment) => {
    setSelectedAssessmentId(assessment.id);
    setEditDrawerOpen(true);
  };

  const handleApproveClick = (assessment: RiskAssessment) => {
    setSelectedAssessmentId(assessment.id);
    setApproveDrawerOpen(true);
  };

  const handleViewHistory = (assessment: RiskAssessment) => {
    setSelectedAssessmentId(assessment.id);
    setHistoryDrawerOpen(true);
  };

  const handleStartReview = async (assessment: RiskAssessment) => {
    try {
      await startReviewMutation.mutateAsync(assessment.id);
    } catch (error) {
      console.error('Failed to start review:', error);
    }
  };

  const handleEditSuccess = () => {
    setEditDrawerOpen(false);
  };

  const handleApproveSuccess = () => {
    setApproveDrawerOpen(false);
  };

  const handleAddClick = () => {
    setAddDrawerOpen(true);
  };

  const handleAddSuccess = () => {
    setAddDrawerOpen(false);
  };

  const handleAddCategoryClick = () => {
    categoryGridRef.current?.addCategory();
  };

  // PDF Export handler
  const handleExportPdf = async () => {
    if (assessments.length === 0) {
      setExportError('No risk assessments available to export.');
      return;
    }

    setIsExportingPdf(true);
    setExportError(null);

    try {
      // Export using grid data directly (no need to fetch details)
      await exportRiskAssessmentsPdf(assessments);
      setExportSuccess(true);
    } catch (error) {
      console.error('PDF export error:', error);
      setExportError('Failed to export PDF. Please try again.');
    } finally {
      setIsExportingPdf(false);
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
          <ShieldIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" component="h1" fontWeight={700}>
              Risk Assessments
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Church compliance risk assessment register and review tracking
            </Typography>
          </Box>
        </Box>

        {/* Toolbar - Buttons based on active tab */}
        <Box display="flex" gap={2}>
          {tabValue === 0 && (
            <>
              <Button
                variant="outlined"
                startIcon={isExportingPdf ? <CircularProgress size={20} color="inherit" /> : <PdfIcon />}
                size="large"
                onClick={handleExportPdf}
                disabled={isExportingPdf || assessments.length === 0}
                sx={{ px: 3, py: 1.5 }}
              >
                {isExportingPdf ? 'Exporting...' : 'Export PDF'}
              </Button>
              <Button
                variant="contained"
                size="large"
                onClick={handleAddClick}
                sx={{ px: 3, py: 1.5 }}
              >
                Add Risk Assessment
              </Button>
            </>
          )}
          {tabValue === 1 && (
            <Button
              variant="contained"
              size="large"
              onClick={handleAddCategoryClick}
              sx={{ px: 3, py: 1.5 }}
            >
              Add Category
            </Button>
          )}
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="risk assessment tabs"
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
              label="Risk Assessments"
              icon={<ShieldIcon />}
              iconPosition="start"
              {...a11yProps(0)}
            />
            <Tab
              label="Categories"
              icon={<SettingsIcon />}
              iconPosition="start"
              {...a11yProps(1)}
            />
          </Tabs>
        </Box>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        {/* Risk Assessments Grid */}
        {isLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={8}>
            <CircularProgress />
          </Box>
        ) : (
          <RiskAssessmentsGrid
            riskAssessments={assessments}
            loading={isLoading}
            categories={categories}
            categoryId={categoryId ?? null}
            status={status ?? ''}
            overdueOnly={overdueOnly}
            title={title}
            onFilterChange={handleFilterChange}
            onViewClick={handleViewClick}
            onEditClick={handleEditClick}
            onApprove={handleApproveClick}
            onStartReview={handleStartReview}
            onViewHistory={handleViewHistory}
          />
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* Category Management Grid */}
        <CategoryManagementGrid ref={categoryGridRef} />
      </TabPanel>

      {/* View Risk Assessment Drawer */}
      <ViewRiskAssessmentDrawer
        open={viewDrawerOpen}
        onClose={() => setViewDrawerOpen(false)}
        riskAssessment={selectedAssessment ?? null}
      />

      {/* Edit Risk Assessment Drawer */}
      <EditRiskAssessmentDrawer
        open={editDrawerOpen}
        onClose={() => setEditDrawerOpen(false)}
        riskAssessment={selectedAssessment ?? null}
        onSuccess={handleEditSuccess}
      />

      {/* Approve Risk Assessment Drawer */}
      <ApproveRiskAssessmentDrawer
        open={approveDrawerOpen}
        onClose={() => setApproveDrawerOpen(false)}
        riskAssessment={selectedAssessment ?? null}
        onSuccess={handleApproveSuccess}
      />

      {/* Add Risk Assessment Drawer */}
      <AddRiskAssessmentDrawer
        open={addDrawerOpen}
        onClose={() => setAddDrawerOpen(false)}
        onSuccess={handleAddSuccess}
      />

      {/* View History Drawer */}
      <ViewHistoryDrawer
        open={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
        riskAssessmentId={selectedAssessmentId}
      />

      {/* Export Notifications */}
      <Snackbar
        open={exportSuccess}
        autoHideDuration={4000}
        onClose={() => setExportSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setExportSuccess(false)}>
          PDF exported successfully!
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!exportError}
        autoHideDuration={6000}
        onClose={() => setExportError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setExportError(null)}>
          {exportError}
        </Alert>
      </Snackbar>
    </Box>
  );
}
