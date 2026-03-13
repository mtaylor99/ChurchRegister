/**
 * Unit tests for RiskAssessmentsPage
 *
 * Strategy: mock all grid/drawer sub-components and hooks that fetch data.
 * Test heading, tabs, and Add button interaction.
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { render } from '../test-utils';
import { RiskAssessmentsPage } from './RiskAssessmentsPage';

// Mock hooks that fetch data
vi.mock('../hooks/useRiskAssessments', () => ({
  useRiskAssessments: () => ({
    data: { items: [], totalCount: 0 },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
  useRiskAssessment: () => ({ data: null, isLoading: false }),
  useRiskAssessmentCategories: () => ({ data: [], isLoading: false }),
  useStartReview: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteRiskAssessment: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('../utils/exportRiskAssessmentsPdf', () => ({
  exportRiskAssessmentsPdf: vi.fn().mockResolvedValue(undefined),
}));

// Mock heavy sub-components
vi.mock('../components/RiskAssessments/RiskAssessmentsGrid', () => ({
  RiskAssessmentsGrid: ({
    onViewAssessment,
  }: {
    onViewAssessment?: (ra: unknown) => void;
  }) => (
    <div data-testid="risk-assessments-grid">
      <button onClick={() => onViewAssessment?.({ id: 1, title: 'Test' })}>
        View
      </button>
    </div>
  ),
}));

vi.mock('../components/RiskAssessments/ViewRiskAssessmentDrawer', () => ({
  ViewRiskAssessmentDrawer: ({ open }: { open: boolean }) =>
    open ? <div data-testid="view-risk-drawer">View Drawer</div> : null,
}));

vi.mock('../components/RiskAssessments/EditRiskAssessmentDrawer', () => ({
  EditRiskAssessmentDrawer: ({ open }: { open: boolean }) =>
    open ? <div data-testid="edit-risk-drawer">Edit Drawer</div> : null,
}));

vi.mock('../components/RiskAssessments/AddRiskAssessmentDrawer', () => ({
  AddRiskAssessmentDrawer: ({ open }: { open: boolean }) =>
    open ? <div data-testid="add-risk-drawer">Add Drawer</div> : null,
}));

vi.mock('../components/RiskAssessments/ApproveRiskAssessmentDrawer', () => ({
  ApproveRiskAssessmentDrawer: ({ open }: { open: boolean }) =>
    open ? <div data-testid="approve-risk-drawer">Approve Drawer</div> : null,
}));

vi.mock('../components/RiskAssessments/CategoryManagementGrid', () => ({
  CategoryManagementGrid: ({}: Record<string, unknown>) => (
    <div data-testid="category-management-grid">Category Grid</div>
  ),
}));

vi.mock('../components/RiskAssessments/ViewHistoryDrawer', () => ({
  ViewHistoryDrawer: ({ open }: { open: boolean }) =>
    open ? <div data-testid="view-history-drawer">History</div> : null,
}));

describe('RiskAssessmentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders the Risk Assessments heading', () => {
    render(<RiskAssessmentsPage />, { withRouter: true });
    expect(
      screen.getByRole('heading', { name: /risk assessments/i })
    ).toBeDefined();
  });

  test('renders two tabs: Risk Assessments and Categories', () => {
    render(<RiskAssessmentsPage />, { withRouter: true });
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBeGreaterThanOrEqual(2);
  });

  test('shows the RiskAssessmentsGrid by default', () => {
    render(<RiskAssessmentsPage />, { withRouter: true });
    expect(screen.getByTestId('risk-assessments-grid')).toBeDefined();
  });

  test('shows the Add Risk Assessment button', () => {
    render(<RiskAssessmentsPage />, { withRouter: true });
    expect(
      screen.getByRole('button', { name: /add risk assessment/i })
    ).toBeDefined();
  });

  test('opens add drawer when Add Risk Assessment button is clicked', () => {
    render(<RiskAssessmentsPage />, { withRouter: true });
    fireEvent.click(
      screen.getByRole('button', { name: /add risk assessment/i })
    );
    expect(screen.getByTestId('add-risk-drawer')).toBeDefined();
  });

  test('switches to Categories tab on click', () => {
    render(<RiskAssessmentsPage />, { withRouter: true });
    const tabs = screen.getAllByRole('tab');
    fireEvent.click(tabs[1]); // Categories tab
    expect(screen.getByTestId('category-management-grid')).toBeDefined();
  });
});
