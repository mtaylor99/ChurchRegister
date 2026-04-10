import { useState, forwardRef, useImperativeHandle } from 'react';
import { Box } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import {
  AttendanceGrid,
  AttendanceSearchAndFilter,
  AttendanceDrawer,
  AttendanceRecordForm,
  UploadAttendanceTemplateModal,
} from '../../components/Attendance';
import { attendanceQueryKeys } from '../../hooks/useAttendance';
import type {
  AttendanceRecord,
  AttendanceFilterState,
  AttendanceGridQuery,
} from '../../types/attendance';

/**
 * Attendance Management page - main interface for managing attendance records
 * Matches UserManagement page structure with DataGrid and professional UI
 */
export interface AttendancePageHandle {
  openUploadModal: () => void;
  openAddRecord: () => void;
}

export const AttendancePage = forwardRef<AttendancePageHandle>((_props, ref) => {
  const queryClient = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(
    null
  );
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

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

  const handleUploadModalOpen = () => {
    setUploadModalOpen(true);
  };

  const handleUploadModalClose = () => {
    setUploadModalOpen(false);
  };

  const handleUploadSuccess = () => {
    // Invalidate all attendance queries to refresh grid and graphs
    queryClient.invalidateQueries({
      queryKey: attendanceQueryKeys.records(),
    });
    queryClient.invalidateQueries({
      queryKey: [...attendanceQueryKeys.all, 'grid'],
    });
    queryClient.invalidateQueries({
      queryKey: attendanceQueryKeys.widgetData(),
    });
    queryClient.invalidateQueries({
      queryKey: attendanceQueryKeys.allAnalytics(),
    });
    // Close the modal
    handleUploadModalClose();
  };

  const handleFiltersChange = (filters: AttendanceFilterState) => {
    setGridQuery((prev: AttendanceGridQuery) => ({
      ...prev,
      page: 1, // Reset to first page when filters change
      filters,
    }));
  };

  useImperativeHandle(ref, () => ({
    openUploadModal: handleUploadModalOpen,
    openAddRecord: handleAddRecord,
  }));

  try {
    return (
      <Box
        sx={{
          p: 2,
          width: '100%',
          height: '100%',
        }}
      >

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
              mode="add"
              onSuccess={handleSuccess}
              onCancel={handleDrawerClose}
            />
          ) : selectedRecord ? (
            <AttendanceRecordForm
              record={selectedRecord}
              mode={drawerMode}
              onSuccess={handleSuccess}
              onCancel={handleDrawerClose}
            />
          ) : null}
        </AttendanceDrawer>

        {/* Upload Template Modal */}
        <UploadAttendanceTemplateModal
          open={uploadModalOpen}
          onClose={handleUploadModalClose}
          onUploadSuccess={handleUploadSuccess}
        />
      </Box>
    );
  } catch (error) {
    console.error('Error in AttendancePage component:', error);
    return (
      <Box sx={{ py: 4, px: 2 }}>
        <Box component="h4" sx={{ color: 'error.main', fontSize: '1.5rem', fontWeight: 700 }}>
          Error Loading Attendance Management
        </Box>
        <Box component="p">{String(error)}</Box>
      </Box>
    );
  }
});

export default AttendancePage;
