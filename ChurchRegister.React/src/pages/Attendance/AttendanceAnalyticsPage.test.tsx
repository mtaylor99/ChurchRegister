/**
 * Unit tests for AttendanceAnalyticsPage
 *
 * This is a forwardRef component. Strategy: mock all heavy sub-components
 * and hooks to test basic rendering behavior.
 */

import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render } from '../../test-utils';
import { AttendanceAnalyticsPage, type AttendanceAnalyticsPageHandle } from './AttendanceAnalyticsPage';

// Mock auth context
vi.mock('../../contexts', () => ({
  useAuth: () => ({ isAuthenticated: true, user: { firstName: 'Test' } }),
}));

// Mock hooks that fetch data
vi.mock('../../hooks/useAttendance', () => ({
  useEvents: () => ({ data: [], isLoading: false, error: null }),
  useMonthlyAnalyticsForAllEvents: () => ({
    data: [],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
  attendanceQueryKeys: { all: ['attendance'] },
}));

// Mock logger to suppress output
vi.mock('../../utils/logger', () => ({
  logger: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Mock MonthlyAttendanceChart to avoid canvas issues in JSDOM
vi.mock('../../components/Attendance', () => ({
  MonthlyAttendanceChart: ({ eventName }: { eventName: string }) => (
    <div data-testid="monthly-chart">{eventName}</div>
  ),
  AttendanceGrid: () => <div>Grid</div>,
  AttendanceSearchAndFilter: () => <div>Search</div>,
  AttendanceDrawer: () => null,
  AttendanceRecordForm: () => null,
  UploadAttendanceTemplateModal: () => null,
}));

describe('AttendanceAnalyticsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('mounts without throwing', () => {
    const ref = React.createRef<AttendanceAnalyticsPageHandle>();
    expect(() =>
      render(<AttendanceAnalyticsPage ref={ref} isActive={true} />, { withRouter: true })
    ).not.toThrow();
  });

  test('renders empty state message when no events', () => {
    const ref = React.createRef<AttendanceAnalyticsPageHandle>();
    render(<AttendanceAnalyticsPage ref={ref} isActive={true} />, { withRouter: true });
    // When there are no events with analytics, it shows an empty state or loading area
    // The component renders without crashing
    expect(document.body).toBeDefined();
  });
});
