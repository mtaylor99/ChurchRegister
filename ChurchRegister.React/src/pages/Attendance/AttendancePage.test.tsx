/**
 * Unit tests for AttendancePage (inner page used within AttendanceTabsPage)
 *
 * Strategy: mock all attendance sub-components to avoid DataGrid/ResizeObserver
 * issues. Test basic rendering and that the component mounts without errors.
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '../../test-utils';
import { AttendancePage } from './AttendancePage';

// Mock attendance sub-components
vi.mock('../../components/Attendance', () => ({
  AttendanceGrid: () => <div data-testid="attendance-grid">Grid</div>,
  AttendanceSearchAndFilter: () => <div data-testid="attendance-search">Search</div>,
  AttendanceDrawer: ({ open }: { open: boolean }) =>
    open ? <div data-testid="attendance-drawer">Drawer</div> : null,
  AttendanceRecordForm: ({ open }: { open: boolean }) =>
    open ? <div data-testid="attendance-record-form">Form</div> : null,
  UploadAttendanceTemplateModal: ({ open }: { open: boolean }) =>
    open ? <div data-testid="upload-modal">Upload</div> : null,
}));

// Mock query keys to avoid import issues
vi.mock('../../hooks/useAttendance', () => ({
  attendanceQueryKeys: { all: ['attendance'] },
}));

describe('AttendancePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders attendance grid and search components', () => {
    render(<AttendancePage />, { withRouter: true });
    expect(screen.getByTestId('attendance-grid')).toBeDefined();
    expect(screen.getByTestId('attendance-search')).toBeDefined();
  });

  test('mounts without throwing', () => {
    expect(() => render(<AttendancePage />, { withRouter: true })).not.toThrow();
  });
});
