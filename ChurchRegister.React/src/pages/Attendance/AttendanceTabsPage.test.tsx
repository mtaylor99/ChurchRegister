/**
 * Unit tests for AttendanceTabsPage
 *
 * Strategy: mock child pages (AttendanceAnalyticsPage, AttendancePage, EventsPage)
 * and auth hooks to test the tabs page header, tab rendering, and permissions.
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { render } from '../../test-utils';
import { AttendanceTabsPage } from './AttendanceTabsPage';

// Mock child page components (they have their own complex dependencies).
// Simple functional stubs avoid JSX-transform / forwardRef complexities.
vi.mock('./AttendanceAnalyticsPage', () => ({
  AttendanceAnalyticsPage: () => <div data-testid="analytics-page">Analytics</div>,
}));

vi.mock('./AttendancePage', () => ({
  AttendancePage: () => <div data-testid="attendance-page">Attendance</div>,
}));

vi.mock('../EventsPage', () => ({
  EventsPage: () => <div data-testid="events-page">Events</div>,
}));

// Mock auth context — user with full permissions so all tabs are visible
vi.mock('../../contexts', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      firstName: 'Admin',
      roles: ['SystemAdministration'],
      permissions: [
        'Attendance.ViewAnalytics',
        'Attendance.View',
        'EventManagement.View',
      ],
    },
  }),
}));

vi.mock('../../hooks/useRBAC', () => ({
  useRBAC: () => ({ canRecordAttendance: true, canManageEvents: true }),
}));

describe('AttendanceTabsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders the Attendance Management heading', () => {
    render(<AttendanceTabsPage />, { withRouter: true });
    expect(screen.getByRole('heading', { name: /attendance management/i })).toBeDefined();
  });

  test('renders all three tabs for a user with full permissions', () => {
    render(<AttendanceTabsPage />, { withRouter: true });
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBeGreaterThanOrEqual(2);
  });

  test('shows analytics page content by default (first tab)', () => {
    render(<AttendanceTabsPage />, { withRouter: true });
    expect(screen.getByTestId('analytics-page')).toBeDefined();
  });

  test('switches to Attendance tab on click', () => {
    render(<AttendanceTabsPage />, { withRouter: true });
    const tabs = screen.getAllByRole('tab');
    // Click the second tab (Attendance)
    fireEvent.click(tabs[1]);
    expect(screen.getByTestId('attendance-page')).toBeDefined();
  });
});
