/**
 * Unit tests for AdministrationPage
 *
 * Strategy: mock all heavy sub-components (UserManagementTab, DistrictsGrid)
 * to avoid rendering real data grids. Test page structure and tab navigation.
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { render } from '../../test-utils';
import { AdministrationPage } from './AdministrationPage';

// Mock heavy sub-components
vi.mock('../../components/Administration/UserManagementTab', () => ({
  UserManagementTab: () => <div data-testid="user-management-tab">Users</div>,
}));

vi.mock('../../components/Administration', () => ({
  DistrictsGrid: () => <div data-testid="districts-grid">Districts</div>,
}));

describe('AdministrationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders the Administration heading', () => {
    render(<AdministrationPage />, { withRouter: true });
    expect(screen.getByRole('heading', { name: 'Administration' })).toBeDefined();
  });

  test('renders Users and Districts tabs', () => {
    render(<AdministrationPage />, { withRouter: true });
    expect(screen.getByRole('tab', { name: /user management/i })).toBeDefined();
    expect(screen.getByRole('tab', { name: /districts/i })).toBeDefined();
  });

  test('shows UserManagement tab content by default', () => {
    render(<AdministrationPage />, { withRouter: true });
    expect(screen.getByTestId('user-management-tab')).toBeDefined();
  });

  test('switches to Districts tab on click', () => {
    render(<AdministrationPage />, { withRouter: true });
    const districtsTab = screen.getByRole('tab', { name: /districts/i });
    fireEvent.click(districtsTab);
    expect(screen.getByTestId('districts-grid')).toBeDefined();
  });
});
