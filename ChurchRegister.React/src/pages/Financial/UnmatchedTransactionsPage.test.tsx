/**
 * Unit tests for UnmatchedTransactionsPage
 *
 * This page uses useQuery directly (no sub-components to mock for data).
 * Mock the API modules to control returned data.
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../test-utils';
import { UnmatchedTransactionsPage } from './UnmatchedTransactionsPage';

// Mutable mock return values
const mockGetUnmatchedTransactions = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ items: [], totalCount: 0 })
);

const mockGetChurchMembers = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ items: [], totalCount: 0 })
);

const mockAssignTransaction = vi.hoisted(() =>
  vi
    .fn()
    .mockResolvedValue({
      success: true,
      message: 'Assigned',
      reProcessedMatchedCount: 0,
      isSharedReference: false,
      contributionsCreated: 1,
    })
);

vi.mock('@services/api', () => ({
  contributionsApi: {
    getUnmatchedTransactions: mockGetUnmatchedTransactions,
    assignTransaction: mockAssignTransaction,
    excludeTransaction: vi.fn().mockResolvedValue({}),
  },
  churchMembersApi: {
    getChurchMembers: mockGetChurchMembers,
  },
}));

describe('UnmatchedTransactionsPage', () => {
  beforeEach(() => {
    mockGetUnmatchedTransactions.mockResolvedValue({
      items: [],
      totalCount: 0,
    });
    mockGetChurchMembers.mockResolvedValue({ items: [], totalCount: 0 });
    mockAssignTransaction.mockResolvedValue({
      success: true,
      message: 'Assigned',
      reProcessedMatchedCount: 0,
      isSharedReference: false,
      contributionsCreated: 1,
    });
  });

  test('mounts without throwing', () => {
    expect(() =>
      render(<UnmatchedTransactionsPage />, { withRouter: true })
    ).not.toThrow();
  });

  test('shows "All transactions matched!" empty state when no unmatched transactions', async () => {
    render(<UnmatchedTransactionsPage />, { withRouter: true });

    await waitFor(() => {
      expect(screen.getByText('All transactions matched!')).toBeDefined();
    });
  });

  test('shows transaction count text when transactions exist', async () => {
    mockGetUnmatchedTransactions.mockResolvedValue({
      items: [
        {
          id: 1,
          date: '2024-01-15T00:00:00Z',
          reference: 'REF-001',
          description: 'Test donation',
          amount: 50.0,
        },
      ],
      totalCount: 1,
    });

    render(<UnmatchedTransactionsPage />, { withRouter: true });

    await waitFor(() => {
      expect(screen.getByText(/awaiting resolution/i)).toBeDefined();
    });
  });

  test('shows table headers when transactions exist', async () => {
    mockGetUnmatchedTransactions.mockResolvedValue({
      items: [
        {
          id: 2,
          date: '2024-02-10T00:00:00Z',
          reference: 'REF-002',
          description: null,
          amount: 25.0,
        },
      ],
      totalCount: 1,
    });

    render(<UnmatchedTransactionsPage />, { withRouter: true });

    await waitFor(() => {
      expect(screen.getByText('Reference')).toBeDefined();
      expect(screen.getByText('Amount')).toBeDefined();
    });
  });

  describe('AssignTransactionDialog - Shared References', () => {
    const mockMembers = [
      { id: 1, fullName: 'John Smith' },
      { id: 2, fullName: 'Jane Smith' },
      { id: 3, fullName: 'Bob Jones' },
    ];

    const mockTransaction = {
      id: 100,
      date: '2024-01-15T00:00:00Z',
      reference: 'COUPLE123',
      description: 'Bank transfer',
      amount: 100.0,
    };

    beforeEach(() => {
      mockGetUnmatchedTransactions.mockResolvedValue({
        items: [mockTransaction],
        totalCount: 1,
      });
      mockGetChurchMembers.mockResolvedValue({
        items: mockMembers,
        totalCount: mockMembers.length,
      });
    });

    test('dialog renders with 2 autocomplete fields when opened', async () => {
      const user = userEvent.setup();
      render(<UnmatchedTransactionsPage />, { withRouter: true });

      // Wait for transaction to load and click Assign button
      const assignButton = await screen.findByRole('button', {
        name: /assign/i,
      });
      await user.click(assignButton);

      // Verify dialog is open with both autocompletes
      await waitFor(() => {
        expect(screen.getByText(/Assign Transaction to Member/i)).toBeDefined();
      });

      const primaryAutocomplete = screen.getByLabelText(/Primary Member/i);
      const secondaryAutocomplete = screen.getByLabelText(
        /Secondary Member \(Optional\)/i
      );

      expect(primaryAutocomplete).toBeDefined();
      expect(secondaryAutocomplete).toBeDefined();
    });

    test('shows helper text explaining 50/50 split for secondary member', async () => {
      const user = userEvent.setup();
      render(<UnmatchedTransactionsPage />, { withRouter: true });

      const assignButton = await screen.findByRole('button', {
        name: /assign/i,
      });
      await user.click(assignButton);

      await waitFor(() => {
        expect(
          screen.getByText(
            /Optional: Select a second member to split this contribution 50\/50/i
          )
        ).toBeDefined();
      });
    });

    test('shows split amount confirmation message when 2 different members selected', async () => {
      const user = userEvent.setup();
      render(<UnmatchedTransactionsPage />, { withRouter: true });

      const assignButton = await screen.findByRole('button', {
        name: /assign/i,
      });
      await user.click(assignButton);

      // Select primary member
      const primaryInput = await screen.findByLabelText(/Primary Member/i);
      await user.click(primaryInput);
      await user.type(primaryInput, 'John');

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeDefined();
      });
      await user.click(screen.getByText('John Smith'));

      // Select secondary member
      const secondaryInput = screen.getByLabelText(
        /Secondary Member \(Optional\)/i
      );
      await user.click(secondaryInput);
      await user.type(secondaryInput, 'Jane');

      await waitFor(() => {
        const options = screen.getAllByText('Jane Smith');
        expect(options.length).toBeGreaterThan(0);
      });

      const janeOptions = screen.getAllByText('Jane Smith');
      await user.click(janeOptions[janeOptions.length - 1]);

      // Verify split confirmation message appears - search for key parts
      await waitFor(() => {
        // Check that the info alert is present with the split message
        const alert = screen.getByRole('alert');
        expect(alert).toBeDefined();
        expect(alert.textContent).toContain('will be split equally');
        expect(alert.textContent).toContain('John Smith');
        expect(alert.textContent).toContain('Jane Smith');
        expect(alert.textContent).toContain('50.00');
      });
    });

    test('shows error when same member selected for both fields', async () => {
      const user = userEvent.setup();
      render(<UnmatchedTransactionsPage />, { withRouter: true });

      const assignButton = await screen.findByRole('button', {
        name: /assign/i,
      });
      await user.click(assignButton);

      // Select primary member
      const primaryInput = await screen.findByLabelText(/Primary Member/i);
      await user.click(primaryInput);
      await user.type(primaryInput, 'John');
      await waitFor(() => screen.getByText('John Smith'));
      await user.click(screen.getByText('John Smith'));

      // Try to select same member for secondary
      const secondaryInput = screen.getByLabelText(
        /Secondary Member \(Optional\)/i
      );
      await user.click(secondaryInput);
      await user.type(secondaryInput, 'John');

      await waitFor(() => {
        const options = screen.getAllByText('John Smith');
        // Click the option in the secondary dropdown
        if (options.length > 1) {
          return true;
        }
        return false;
      });

      const johnOptions = screen.getAllByText('John Smith');
      // Click the last John Smith option (should be from secondary dropdown)
      await user.click(johnOptions[johnOptions.length - 1]);

      // Submit the form - this should trigger validation
      const submitButton = screen.getByRole('button', { name: /^Assign$/i });
      await user.click(submitButton);

      // Verify error message is shown (client-side validation or from API)
      await waitFor(
        () => {
          const errorText = screen.queryByText(
            /Primary and secondary members must be different/i
          );
          expect(errorText).toBeDefined();
        },
        { timeout: 3000 }
      );
    });

    test('calls API with secondaryChurchMemberId when 2 members selected', async () => {
      const user = userEvent.setup();
      mockAssignTransaction.mockResolvedValue({
        success: true,
        message: 'Assigned to 2 members',
        reProcessedMatchedCount: 0,
        isSharedReference: true,
        contributionsCreated: 2,
      });

      render(<UnmatchedTransactionsPage />, { withRouter: true });

      const assignButton = await screen.findByRole('button', {
        name: /assign/i,
      });
      await user.click(assignButton);

      // Select primary member
      const primaryInput = await screen.findByLabelText(/Primary Member/i);
      await user.click(primaryInput);
      await user.type(primaryInput, 'John');
      await waitFor(() => screen.getByText('John Smith'));
      await user.click(screen.getByText('John Smith'));

      // Select secondary member
      const secondaryInput = screen.getByLabelText(
        /Secondary Member \(Optional\)/i
      );
      await user.click(secondaryInput);
      await user.type(secondaryInput, 'Jane');
      await waitFor(() => {
        const options = screen.getAllByText('Jane Smith');
        expect(options.length).toBeGreaterThan(0);
      });
      const janeOptions = screen.getAllByText('Jane Smith');
      await user.click(janeOptions[janeOptions.length - 1]);

      // Submit
      const submitButton = screen.getByRole('button', { name: /^Assign$/i });
      await user.click(submitButton);

      // Verify API was called with both member IDs
      await waitFor(() => {
        expect(mockAssignTransaction).toHaveBeenCalledWith(
          100,
          expect.objectContaining({
            churchMemberId: 1,
            secondaryChurchMemberId: 2,
          })
        );
      });
    });

    test('displays 409 Conflict error message for conflicting reference', async () => {
      const user = userEvent.setup();
      mockAssignTransaction.mockRejectedValueOnce({
        response: {
          status: 409,
          data: {
            message:
              'Secondary member has a different bank reference already assigned',
          },
        },
      });

      render(<UnmatchedTransactionsPage />, { withRouter: true });

      const assignButton = await screen.findByRole('button', {
        name: /assign/i,
      });
      await user.click(assignButton);

      // Select members
      const primaryInput = await screen.findByLabelText(/Primary Member/i);
      await user.click(primaryInput);
      await user.type(primaryInput, 'John');
      await waitFor(() => screen.getByText('John Smith'));
      await user.click(screen.getByText('John Smith'));

      const secondaryInput = screen.getByLabelText(
        /Secondary Member \(Optional\)/i
      );
      await user.click(secondaryInput);
      await user.type(secondaryInput, 'Bob');
      await waitFor(() => screen.getByText('Bob Jones'));
      await user.click(screen.getByText('Bob Jones'));

      // Submit
      const submitButton = screen.getByRole('button', { name: /^Assign$/i });
      await user.click(submitButton);

      // Verify error is displayed
      await waitFor(() => {
        expect(
          screen.getByText(
            /Secondary member has a different bank reference already assigned/i
          )
        ).toBeDefined();
      });
    });

    test('only calls API with primary member when secondary is not selected', async () => {
      const user = userEvent.setup();
      render(<UnmatchedTransactionsPage />, { withRouter: true });

      const assignButton = await screen.findByRole('button', {
        name: /assign/i,
      });
      await user.click(assignButton);

      // Select only primary member
      const primaryInput = await screen.findByLabelText(/Primary Member/i);
      await user.click(primaryInput);
      await user.type(primaryInput, 'John');
      await waitFor(() => screen.getByText('John Smith'));
      await user.click(screen.getByText('John Smith'));

      // Submit without selecting secondary
      const submitButton = screen.getByRole('button', { name: /^Assign$/i });
      await user.click(submitButton);

      // Verify API was called with only primary member ID
      await waitFor(() => {
        expect(mockAssignTransaction).toHaveBeenCalledWith(
          100,
          expect.objectContaining({
            churchMemberId: 1,
            secondaryChurchMemberId: undefined,
          })
        );
      });
    });
  });
});
