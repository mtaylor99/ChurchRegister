/**
 * Unit tests for ContributionsPage
 *
 * Strategy: mock all heavy financial sub-components, UnmatchedTransactionsPage,
 * API modules and auth context. Test page structure and tab navigation.
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { render } from '../../test-utils';
import { ContributionsPage } from './ContributionsPage';

// Mock auth context
vi.mock('../../contexts/useAuth', () => ({
  useAuth: () => ({
    user: {
      roles: ['FinancialAdministrator'],
      id: '1',
      email: 'finance@test.com',
      firstName: 'Finance',
      lastName: 'Admin',
    },
  }),
}));

// Mock API modules
vi.mock('@services/api', () => ({
  contributionsApi: {
    getMembers: vi.fn().mockResolvedValue({ items: [], totalCount: 0 }),
    getUnmatchedTransactions: vi.fn().mockResolvedValue({ items: [], totalCount: 0 }),
  },
  churchMembersApi: {
    getMembers: vi.fn().mockResolvedValue({ items: [], totalCount: 0 }),
  },
  contributionHistoryApi: {
    getHistory: vi.fn().mockResolvedValue({ items: [] }),
  },
}));

vi.mock('../../utils/excelExport', () => ({
  exportMemberContributionsToExcel: vi.fn().mockResolvedValue(undefined),
}));

// Mock heavy financial sub-components
vi.mock('../../components/Contributions', () => ({
  ContributionMemberGrid: ({ onMemberClick }: { onMemberClick?: (m: unknown) => void }) => (
    <div data-testid="contribution-member-grid">
      <button onClick={() => onMemberClick?.({ id: 1, fullName: 'John Doe' })}>Member</button>
    </div>
  ),
  FinancialActionsHeader: () => <div data-testid="financial-actions-header">Actions</div>,
}));

vi.mock('../../components/ChurchMembers/ContributionHistoryDialog', () => ({
  ContributionHistoryDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="contribution-history-dialog">History</div> : null,
}));

vi.mock('../../components/Financial/HsbcUploadModal', () => ({
  HsbcUploadModal: ({ open }: { open: boolean }) =>
    open ? <div data-testid="hsbc-upload-modal">Upload</div> : null,
}));

vi.mock('../../components/Financial', () => ({
  EnvelopeBatchHistory: () => null,
  EnvelopeBatchEntry: () => null,
  YearSelectionModal: () => null,
  AddOneOffContributionDrawer: () => null,
}));

vi.mock('./UnmatchedTransactionsPage', () => ({
  UnmatchedTransactionsPage: () => (
    <div data-testid="unmatched-transactions-page">Unmatched</div>
  ),
}));

describe('ContributionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders the Church Member Contributions heading', () => {
    render(<ContributionsPage />, { withRouter: true });
    expect(screen.getByRole('heading', { name: /church member contributions/i })).toBeDefined();
  });

  test('renders two tabs: Contributions and Unmatched', () => {
    render(<ContributionsPage />, { withRouter: true });
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBeGreaterThanOrEqual(2);
  });

  test('renders the ContributionMemberGrid by default', () => {
    render(<ContributionsPage />, { withRouter: true });
    expect(screen.getByTestId('contribution-member-grid')).toBeDefined();
  });

  test('switches to Unmatched Transactions tab on click', () => {
    render(<ContributionsPage />, { withRouter: true });
    const tabs = screen.getAllByRole('tab');
    // Click the second tab (Unmatched HSBC)
    fireEvent.click(tabs[1]);
    expect(screen.getByTestId('unmatched-transactions-page')).toBeDefined();
  });
});
