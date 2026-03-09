/**
 * Unit tests for UnmatchedTransactionsPage
 *
 * This page uses useQuery directly (no sub-components to mock for data).
 * Mock the API modules to control returned data.
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from '../../test-utils';
import { UnmatchedTransactionsPage } from './UnmatchedTransactionsPage';

// Mutable mock return value so individual tests can override it
const mockGetUnmatchedTransactions = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ items: [], totalCount: 0 })
);

vi.mock('@services/api', () => ({
  contributionsApi: {
    getUnmatchedTransactions: mockGetUnmatchedTransactions,
    assignTransaction: vi.fn().mockResolvedValue({}),
    excludeTransaction: vi.fn().mockResolvedValue({}),
  },
  churchMembersApi: {
    getMembers: vi.fn().mockResolvedValue({ items: [], totalCount: 0 }),
  },
}));

describe('UnmatchedTransactionsPage', () => {
  beforeEach(() => {
    mockGetUnmatchedTransactions.mockResolvedValue({ items: [], totalCount: 0 });
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
});
