/**
 * Unit tests for RemindersPage
 *
 * Strategy: mock all grid/drawer sub-components and API modules.
 * Test heading, tabs, and button interactions.
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { render } from '../test-utils';
import { RemindersPage } from './RemindersPage';

// Mock API modules
vi.mock('@services/api', () => ({
  remindersApi: {
    getReminders: vi.fn().mockResolvedValue({ items: [], totalCount: 0 }),
    getCategories: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../utils/excelExport', () => ({
  exportRemindersToExcel: vi.fn().mockResolvedValue(undefined),
}));

// Mock heavy sub-components
vi.mock('../components/Reminders/CategoryManagementGrid', () => ({
  CategoryManagementGrid: ({ onEditCategory }: { onEditCategory?: (c: unknown) => void }) => (
    <div data-testid="category-management-grid">
      <button onClick={() => onEditCategory?.({ id: 1, name: 'Health' })}>Edit Cat</button>
    </div>
  ),
}));

vi.mock('../components/Reminders/CreateCategoryDrawer', () => ({
  CreateCategoryDrawer: ({ open }: { open: boolean }) =>
    open ? <div data-testid="create-category-drawer">Create Category</div> : null,
}));

vi.mock('../components/Reminders/EditCategoryDrawer', () => ({
  EditCategoryDrawer: ({ open }: { open: boolean }) =>
    open ? <div data-testid="edit-category-drawer">Edit Category</div> : null,
}));

vi.mock('../components/Reminders/RemindersGrid', () => ({
  RemindersGrid: ({ onEditReminder }: { onEditReminder?: (r: unknown) => void }) => (
    <div data-testid="reminders-grid">
      <button onClick={() => onEditReminder?.({ id: 1, title: 'Test' })}>Edit Reminder</button>
    </div>
  ),
}));

vi.mock('../components/Reminders/CreateReminderDrawer', () => ({
  CreateReminderDrawer: ({ open }: { open: boolean }) =>
    open ? <div data-testid="create-reminder-drawer">Create Reminder</div> : null,
}));

vi.mock('../components/Reminders/EditReminderDrawer', () => ({
  EditReminderDrawer: ({ open }: { open: boolean }) =>
    open ? <div data-testid="edit-reminder-drawer">Edit Reminder</div> : null,
}));

vi.mock('../components/Reminders/CompleteReminderDrawer', () => ({
  CompleteReminderDrawer: ({ open }: { open: boolean }) =>
    open ? <div data-testid="complete-reminder-drawer">Complete</div> : null,
}));

describe('RemindersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders the Reminders Management heading', () => {
    render(<RemindersPage />, { withRouter: true });
    expect(screen.getByRole('heading', { name: /reminders management/i })).toBeDefined();
  });

  test('renders two tabs: Reminders and Categories', () => {
    render(<RemindersPage />, { withRouter: true });
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBeGreaterThanOrEqual(2);
  });

  test('shows Reminders tab content (RemindersGrid) by default', () => {
    render(<RemindersPage />, { withRouter: true });
    expect(screen.getByTestId('reminders-grid')).toBeDefined();
  });

  test('shows Add Reminder button on Reminders tab', () => {
    render(<RemindersPage />, { withRouter: true });
    expect(screen.getByRole('button', { name: /create reminder/i })).toBeDefined();
  });

  test('opens create reminder drawer when Add Reminder is clicked', () => {
    render(<RemindersPage />, { withRouter: true });
    fireEvent.click(screen.getByRole('button', { name: /create reminder/i }));
    expect(screen.getByTestId('create-reminder-drawer')).toBeDefined();
  });

  test('switches to Categories tab on click', () => {
    render(<RemindersPage />, { withRouter: true });
    const tabs = screen.getAllByRole('tab');
    fireEvent.click(tabs[1]); // Categories tab
    expect(screen.getByTestId('category-management-grid')).toBeDefined();
  });

  test('opens create category drawer when Add Category is clicked on Categories tab', () => {
    render(<RemindersPage />, { withRouter: true });
    const tabs = screen.getAllByRole('tab');
    fireEvent.click(tabs[1]); // Switch to Categories tab
    fireEvent.click(screen.getByRole('button', { name: /create category/i }));
    expect(screen.getByTestId('create-category-drawer')).toBeDefined();
  });
});
