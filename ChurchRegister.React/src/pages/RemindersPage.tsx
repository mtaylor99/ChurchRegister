import React, { useState } from 'react';
import { Box, Tabs, Tab, Button, Typography, Paper, CircularProgress } from '@mui/material';
import {
  Add as AddIcon,
  FileDownload as DownloadIcon,
  NotificationsActive as NotificationsIcon,
  Checklist as ChecklistIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { CategoryManagementGrid } from '../components/Reminders/CategoryManagementGrid';
import { CreateCategoryDrawer } from '../components/Reminders/CreateCategoryDrawer';
import { EditCategoryDrawer } from '../components/Reminders/EditCategoryDrawer';
import { RemindersGrid } from '../components/Reminders/RemindersGrid';
import { CreateReminderDrawer } from '../components/Reminders/CreateReminderDrawer';
import { EditReminderDrawer } from '../components/Reminders/EditReminderDrawer';
import { CompleteReminderDrawer } from '../components/Reminders/CompleteReminderDrawer';
import type { ReminderCategory } from '../types/reminderCategories';
import type { Reminder } from '../types/reminders';
import { remindersApi } from '../services/api/remindersApi';
import { exportRemindersToExcel } from '../utils/excelExport';

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
      id={`reminders-tabpanel-${index}`}
      aria-labelledby={`reminders-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `reminders-tab-${index}`,
    'aria-controls': `reminders-tabpanel-${index}`,
  };
}

export const RemindersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<ReminderCategory | null>(null);
  const [reminderDrawerOpen, setReminderDrawerOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [completingReminder, setCompletingReminder] = useState<Reminder | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleCreateReminder = () => {
    setReminderDrawerOpen(true);
  };

  const handleCreateCategory = () => {
    setCategoryDrawerOpen(true);
  };

  const handleEditCategory = (category: ReminderCategory) => {
    setEditingCategory(category);
  };

  const handleEditReminder = (reminder: Reminder) => {
    setEditingReminder(reminder);
  };

  const handleCompleteReminder = (reminder: Reminder) => {
    setCompletingReminder(reminder);
  };

  const handleCategoryDrawerClose = () => {
    setCategoryDrawerOpen(false);
  };

  const handleEditCategoryDrawerClose = () => {
    setEditingCategory(null);
  };

  const handleReminderDrawerClose = () => {
    setReminderDrawerOpen(false);
  };

  const handleEditReminderDrawerClose = () => {
    setEditingReminder(null);
  };

  const handleCompleteReminderDrawerClose = () => {
    setCompletingReminder(null);
  };

  const handleDrawerSuccess = () => {
    // Drawers will auto-close via their internal logic
    setCategoryDrawerOpen(false);
    setEditingCategory(null);
    setReminderDrawerOpen(false);
    setEditingReminder(null);
    setCompletingReminder(null);
  };

  const handleExportReminders = async () => {
    try {
      setIsExporting(true);
      // Fetch all reminders including completed ones
      const allReminders = await remindersApi.getReminders({
        showCompleted: true,
      });

      await exportRemindersToExcel(allReminders);
    } catch (error) {
      console.error('Error exporting reminders:', error);
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
          <NotificationsIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" component="h1" fontWeight={700}>
              Reminders Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage reminders and categories for church activities
            </Typography>
          </Box>
        </Box>

        {/* Actions - Show different buttons based on active tab */}
        <Box display="flex" gap={2}>
          {activeTab === 0 && (
            <>
              <Button
                variant="outlined"
                startIcon={
                  isExporting ? <CircularProgress size={20} /> : <DownloadIcon />
                }
                size="large"
                onClick={handleExportReminders}
                disabled={isExporting}
                sx={{ px: 3, py: 1.5 }}
              >
                {isExporting ? 'Exporting...' : 'Export Reminders'}
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                size="large"
                onClick={handleCreateReminder}
                sx={{ px: 3, py: 1.5 }}
              >
                Create Reminder
              </Button>
            </>
          )}
          {activeTab === 1 && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              size="large"
              onClick={handleCreateCategory}
              sx={{ px: 3, py: 1.5 }}
            >
              Create Category
            </Button>
          )}
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="reminders tabs"
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
              label="Reminders"
              icon={<ChecklistIcon />}
              iconPosition="start"
              {...a11yProps(0)}
            />
            <Tab
              label="Categories"
              icon={<CategoryIcon />}
              iconPosition="start"
              {...a11yProps(1)}
            />
          </Tabs>
        </Box>
      </Paper>

      <TabPanel value={activeTab} index={0}>
        <RemindersGrid
          onEditClick={handleEditReminder}
          onCompleteClick={handleCompleteReminder}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <CategoryManagementGrid onEdit={handleEditCategory} />
      </TabPanel>

      {/* Reminder Drawers */}
      <CreateReminderDrawer
        open={reminderDrawerOpen}
        onClose={handleReminderDrawerClose}
        onSuccess={handleDrawerSuccess}
      />

      <EditReminderDrawer
        open={!!editingReminder}
        onClose={handleEditReminderDrawerClose}
        reminder={editingReminder}
        onSuccess={handleDrawerSuccess}
      />

      <CompleteReminderDrawer
        open={!!completingReminder}
        onClose={handleCompleteReminderDrawerClose}
        reminder={completingReminder}
        onSuccess={handleDrawerSuccess}
      />

      {/* Category Drawers */}
      <CreateCategoryDrawer
        open={categoryDrawerOpen}
        onClose={handleCategoryDrawerClose}
        onSuccess={handleDrawerSuccess}
      />

      <EditCategoryDrawer
        open={!!editingCategory}
        onClose={handleEditCategoryDrawerClose}
        category={editingCategory}
        onSuccess={handleDrawerSuccess}
      />
    </Box>
  );
};
