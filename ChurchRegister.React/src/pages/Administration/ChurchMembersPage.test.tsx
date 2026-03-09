/**
 * Unit tests for ChurchMembersPage
 *
 * Strategy: mock all heavy sub-components and API modules.
 * Test heading, grid rendering, and drawer open/close behavior.
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { render } from '../../test-utils';
import { ChurchMembersPage } from './ChurchMembersPage';

// Mock auth context
vi.mock('../../contexts/useAuth', () => ({
  useAuth: () => ({
    user: {
      roles: ['SystemAdministration'],
      id: '1',
      email: 'admin@test.com',
      firstName: 'Admin',
      lastName: 'User',
    },
  }),
}));

// Mock API modules
vi.mock('@services/api', () => ({
  churchMembersApi: {
    getMembers: vi.fn().mockResolvedValue({ items: [], totalCount: 0 }),
    exportWithDetails: vi.fn().mockResolvedValue(new Blob()),
  },
  districtsApi: {
    getDistricts: vi.fn().mockResolvedValue([]),
  },
}));

// Mock excel export
vi.mock('../../utils/excelExport', () => ({
  exportChurchMembersWithDetailsToExcel: vi.fn().mockResolvedValue(undefined),
}));

// Mock notification hook
vi.mock('../../hooks/useNotification', () => ({
  useNotification: () => ({ showSuccess: vi.fn(), showError: vi.fn() }),
}));

// Mock heavy grid/drawer/dialog sub-components
vi.mock('../../components/ChurchMembers/ChurchMemberGrid', () => ({
  ChurchMemberGrid: ({ onMemberClick }: { onMemberClick?: (m: unknown) => void }) => (
    <div data-testid="church-member-grid">
      <button onClick={() => onMemberClick?.({ id: 1, firstName: 'John' })}>
        Member
      </button>
    </div>
  ),
}));

vi.mock('../../components/ChurchMembers/ChurchMemberDrawer', () => ({
  ChurchMemberDrawer: ({ open, mode }: { open: boolean; mode: string }) =>
    open ? <div data-testid="church-member-drawer" data-mode={mode}>Drawer</div> : null,
}));

vi.mock('../../components/Administration/RegisterNumberGenerationDialog', () => ({
  RegisterNumberGenerationDialog: () => null,
}));

vi.mock('../../components/Administration/ExportYearSelectorDialog', () => ({
  ExportYearSelectorDialog: () => null,
}));

vi.mock('../../components/Administration/MemberStatisticsModal', () => ({
  MemberStatisticsModal: () => null,
}));

describe('ChurchMembersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders the Church Members Management heading', () => {
    render(<ChurchMembersPage />, { withRouter: true });
    expect(screen.getByRole('heading', { name: /church members management/i })).toBeDefined();
  });

  test('renders the Add Member button', () => {
    render(<ChurchMembersPage />, { withRouter: true });
    expect(screen.getByRole('button', { name: /add new member/i })).toBeDefined();
  });

  test('renders the ChurchMemberGrid', () => {
    render(<ChurchMembersPage />, { withRouter: true });
    expect(screen.getByTestId('church-member-grid')).toBeDefined();
  });

  test('opens drawer in add mode when Add Member is clicked', () => {
    render(<ChurchMembersPage />, { withRouter: true });
    fireEvent.click(screen.getByRole('button', { name: /add new member/i }));
    const drawer = screen.getByTestId('church-member-drawer');
    expect(drawer.getAttribute('data-mode')).toBe('add');
  });
});
