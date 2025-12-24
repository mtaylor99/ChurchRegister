import React, { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Add as AddIcon, Event as EventIcon } from '@mui/icons-material';
import {
  AttendanceGrid,
  AttendanceSearchAndFilter,
  AttendanceDrawer,
  AttendanceRecordForm,
} from '../../components/Attendance';
import type {
  AttendanceRecord,
  AttendanceFilterState,
  AttendanceGridQuery,
} from '../../types/attendance';

/**
 * Attendance Management page - main interface for managing attendance records
 * Matches UserManagement page structure with DataGrid and professional UI
 */
export const AttendancePage: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(
    null
  );

  // Grid query state
  const [gridQuery, setGridQuery] = useState<AttendanceGridQuery>({
    page: 1,
    pageSize: 20,
    sortBy: 'date',
    sortDirection: 'desc',
    filters: {
      eventTypeId: undefined,
      startDate: undefined,
      endDate: undefined,
    },
  });

  // Handle grid events
  const handleEditRecord = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setDrawerMode('edit');
    setDrawerOpen(true);
  };

  const handleViewRecord = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setDrawerMode('view');
    setDrawerOpen(true);
  };

  const handleAddRecord = () => {
    setSelectedRecord(null);
    setDrawerMode('add');
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedRecord(null);
  };

  const handleSuccess = () => {
    handleDrawerClose();
    // The grid will refresh automatically via React Query
  };

  // Handle filter changes
  const handleFiltersChange = (filters: AttendanceFilterState) => {
    setGridQuery((prev: AttendanceGridQuery) => ({
      ...prev,
      page: 1, // Reset to first page when filters change
      filters,
    }));
  };

  try {
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
            <EventIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" component="h1" fontWeight={700}>
                Attendance Records
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage and track church attendance records
              </Typography>
            </Box>
          </Box>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            size="large"
            onClick={handleAddRecord}
            sx={{ px: 3, py: 1.5 }}
          >
            Add Record
          </Button>
        </Box>

        {/* Search and Filter */}
        <Box sx={{ mb: 3 }}>
          <AttendanceSearchAndFilter
            filters={gridQuery.filters}
            onFiltersChange={handleFiltersChange}
          />
        </Box>

        {/* Attendance Grid */}
        <Box sx={{ mb: 4 }}>
          <AttendanceGrid
            query={gridQuery}
            onQueryChange={setGridQuery}
            onEditRecord={handleEditRecord}
            onViewRecord={handleViewRecord}
          />
        </Box>

        {/* Attendance Drawer */}
        <AttendanceDrawer
          open={drawerOpen}
          onClose={handleDrawerClose}
          mode={drawerMode}
          record={selectedRecord}
        >
          {drawerMode === 'add' ? (
            <AttendanceRecordForm
              onSuccess={handleSuccess}
              onCancel={handleDrawerClose}
            />
          ) : selectedRecord ? (
            <AttendanceRecordForm
              record={selectedRecord}
              onSuccess={handleSuccess}
              onCancel={handleDrawerClose}
            />
          ) : null}
        </AttendanceDrawer>
      </Box>
    );
  } catch (error) {
    console.error('Error in AttendancePage component:', error);
    return (
      <Box sx={{ py: 4, px: 2 }}>
        <Typography variant="h4" color="error">
          Error Loading Attendance Management
        </Typography>
        <Typography variant="body1">{String(error)}</Typography>
      </Box>
    );
  }
};

export default AttendancePage;
