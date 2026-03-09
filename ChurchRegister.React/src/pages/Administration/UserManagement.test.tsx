/**
 * Unit tests for UserManagement page
 *
 * Strategy: mock all heavy Administration components (UserGrid, UserDrawer,
 * AddUserForm, EditUserForm) to focus on page-level behavior.
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { render } from '../../test-utils';
import { UserManagement } from './UserManagement';

// Mock heavy sub-components
vi.mock('../../components/Administration', () => ({
  UserGrid: ({ onEditUser, onViewUser }: { onEditUser: (u: unknown) => void; onViewUser: (u: unknown) => void }) => (
    <div data-testid="user-grid">
      <button onClick={() => onEditUser({ id: 1, firstName: 'Alice' })}>Edit</button>
      <button onClick={() => onViewUser({ id: 1, firstName: 'Alice' })}>View</button>
    </div>
  ),
  UserDrawer: ({ open, mode }: { open: boolean; mode: string }) =>
    open ? <div data-testid="user-drawer" data-mode={mode}>Drawer</div> : null,
  AddUserForm: () => <div>AddUserForm</div>,
  EditUserForm: () => <div>EditUserForm</div>,
}));

describe('UserManagement page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders the User Management heading', () => {
    render(<UserManagement />, { withRouter: true });
    expect(screen.getByRole('heading', { name: 'User Management' })).toBeDefined();
  });

  test('renders the Add User button', () => {
    render(<UserManagement />, { withRouter: true });
    expect(screen.getByRole('button', { name: /add new user/i })).toBeDefined();
  });

  test('renders the UserGrid', () => {
    render(<UserManagement />, { withRouter: true });
    expect(screen.getByTestId('user-grid')).toBeDefined();
  });

  test('opens drawer in add mode when Add User button is clicked', () => {
    render(<UserManagement />, { withRouter: true });
    fireEvent.click(screen.getByRole('button', { name: /add new user/i }));
    const drawer = screen.getByTestId('user-drawer');
    expect(drawer.getAttribute('data-mode')).toBe('add');
  });

  test('opens drawer in edit mode when grid triggers edit', () => {
    render(<UserManagement />, { withRouter: true });
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const drawer = screen.getByTestId('user-drawer');
    expect(drawer.getAttribute('data-mode')).toBe('edit');
  });

  test('opens drawer in view mode when grid triggers view', () => {
    render(<UserManagement />, { withRouter: true });
    fireEvent.click(screen.getByRole('button', { name: 'View' }));
    const drawer = screen.getByTestId('user-drawer');
    expect(drawer.getAttribute('data-mode')).toBe('view');
  });
});
