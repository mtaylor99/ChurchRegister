/**
 * Unit tests for DashboardPage
 *
 * Strategy: mock all heavy widgets and the dashboardApi. Test heading,
 * loading behavior, and KPI section presence.
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from '../test-utils';
import { DashboardPage } from './DashboardPage';

// Mock auth permissions context
vi.mock('../contexts', () => ({
  useAuthPermissions: () => ({
    canViewMemberData: true,
    canManageUsers: true,
    canViewFinancialData: true,
    hasAnyRole: () => true,
  }),
}));

// Mock the dashboard API
const mockGetStatistics = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    totalMembers: 150,
    newMembersThisMonth: 5,
    newMembersThisWeek: 2,
    memberGrowthPercentage: 3.5,
    sundayMorningAverage: 120,
    sundayMorningChangePercentage: 5.0,
    sundayEveningAverage: 85,
    sundayEveningChangePercentage: -2.0,
    bibleStudyAverage: 60,
    bibleStudyChangePercentage: 1.5,
    trainingAlerts: [],
  })
);

vi.mock('@services/api', () => ({
  dashboardApi: { getStatistics: mockGetStatistics },
}));

// Mock heavy widget sub-components
vi.mock('../components/Attendance', () => ({
  AttendanceRecordForm: ({ open }: { open: boolean }) =>
    open ? <div data-testid="attendance-form">Form</div> : null,
}));

vi.mock('../components/ChurchMembers/ChurchMemberDrawer', () => ({
  ChurchMemberDrawer: ({ open }: { open: boolean }) =>
    open ? <div data-testid="member-drawer">Drawer</div> : null,
}));

vi.mock('../components/Dashboard/RemindersSummaryWidget', () => ({
  RemindersSummaryWidget: () => (
    <div data-testid="reminders-summary-widget">Reminders widget</div>
  ),
}));

vi.mock('../components/Dashboard/RiskAssessmentWidget', () => ({
  RiskAssessmentWidget: () => (
    <div data-testid="risk-assessment-widget">Risk widget</div>
  ),
}));

vi.mock('../components/MonthlyReportPack', () => ({
  MonthlyReportPackWidget: () => (
    <div data-testid="monthly-report-widget">Report widget</div>
  ),
}));

vi.mock('../hooks/useAttendance', () => ({
  useRecentAttendance: () => ({ records: [], isLoading: false }),
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    mockGetStatistics.mockClear();
    mockGetStatistics.mockResolvedValue({
      totalMembers: 150,
      newMembersThisMonth: 5,
      newMembersThisWeek: 2,
      memberGrowthPercentage: 3.5,
      sundayMorningAverage: 120,
      sundayMorningChangePercentage: 5.0,
      sundayEveningAverage: 85,
      sundayEveningChangePercentage: -2.0,
      bibleStudyAverage: 60,
      bibleStudyChangePercentage: 1.5,
      trainingAlerts: [],
    });
  });

  test('renders the Dashboard heading', async () => {
    render(<DashboardPage />, { withRouter: true });
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeDefined();
    });
  });

  test('renders the KPI section heading', async () => {
    render(<DashboardPage />, { withRouter: true });
    await waitFor(() => {
      expect(screen.getByText(/key performance indicators/i)).toBeDefined();
    });
  });

  test('renders the reminders summary widget', async () => {
    render(<DashboardPage />, { withRouter: true });
    await waitFor(() => {
      expect(screen.getByTestId('reminders-summary-widget')).toBeDefined();
    });
  });

  test('renders the risk assessment widget', async () => {
    render(<DashboardPage />, { withRouter: true });
    await waitFor(() => {
      expect(screen.getByTestId('risk-assessment-widget')).toBeDefined();
    });
  });

  test('calls getStatistics on mount', async () => {
    render(<DashboardPage />, { withRouter: true });
    await waitFor(() => {
      expect(mockGetStatistics).toHaveBeenCalledTimes(1);
    });
  });
});
