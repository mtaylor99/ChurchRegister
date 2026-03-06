import { describe, test, expect, vi, beforeEach } from 'vitest';
import { ContributionsApi } from './contributionsApi';
import { apiClient } from './ApiClient';

vi.mock('./ApiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const makeApiItem = (overrides = {}) => ({
  id: 1,
  firstName: 'John',
  lastName: 'Doe',
  statusId: 1,
  statusName: 'Active',
  memberNumber: 100,
  thisYearsContribution: 500,
  giftAid: true,
  ...overrides,
});

const makeApiResponse = (items: object[]) => ({
  items,
  totalCount: items.length,
  currentPage: 1,
  pageSize: 20,
  totalPages: 1,
});

describe('ContributionsApi', () => {
  let api: ContributionsApi;

  beforeEach(() => {
    vi.clearAllMocks();
    api = new ContributionsApi();
    vi.mocked(apiClient.get).mockResolvedValue(makeApiResponse([]));
    vi.mocked(apiClient.post).mockResolvedValue({});
  });

  // ─── getContributionMembers ───────────────────────────────────────────────

  describe('getContributionMembers', () => {
    test('calls the church-members endpoint', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(makeApiResponse([]));
      await api.getContributionMembers({ page: 1, pageSize: 20, sortBy: 'name', sortDirection: 'asc' });
      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith(
        '/api/church-members',
        expect.any(Object)
      );
    });

    test('transforms member items to ContributionMemberDto format', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(
        makeApiResponse([makeApiItem()])
      );
      const result = await api.getContributionMembers({
        page: 1,
        pageSize: 20,
        sortBy: 'name',
        sortDirection: 'asc',
      });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe(1);
      expect(result.items[0].firstName).toBe('John');
      expect(result.items[0].lastName).toBe('Doe');
      expect(result.items[0].thisYearsContribution).toBe(500);
    });

    test('defaults fullName to firstName + lastName when not provided', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(
        makeApiResponse([makeApiItem({ fullName: undefined })])
      );
      const result = await api.getContributionMembers({
        page: 1, pageSize: 20, sortBy: 'name', sortDirection: 'asc',
      });
      expect(result.items[0].fullName).toBe('John Doe');
    });

    test('defaults thisYearsContribution to 0 when undefined', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(
        makeApiResponse([makeApiItem({ thisYearsContribution: undefined })])
      );
      const result = await api.getContributionMembers({
        page: 1, pageSize: 20, sortBy: 'name', sortDirection: 'asc',
      });
      expect(result.items[0].thisYearsContribution).toBe(0);
    });

    test('maps status colors correctly for known statuses', async () => {
      const statuses = ['Active', 'Inactive', 'InActive', 'Expired', 'In Glory', 'Unknown'];
      for (const statusName of statuses) {
        vi.mocked(apiClient.get).mockResolvedValue(
          makeApiResponse([makeApiItem({ statusName })])
        );
        const result = await api.getContributionMembers({
          page: 1, pageSize: 20, sortBy: 'name', sortDirection: 'asc',
        });
        expect(result.items[0].statusColor).toBeTruthy();
      }
    });

    test('re-throws errors', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'));
      await expect(
        api.getContributionMembers({ page: 1, pageSize: 20, sortBy: 'name', sortDirection: 'asc' })
      ).rejects.toThrow('Network error');
    });

    test('returns pagination metadata from response', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        items: [],
        totalCount: 100,
        currentPage: 2,
        pageSize: 20,
        totalPages: 5,
      });
      const result = await api.getContributionMembers({
        page: 2, pageSize: 20, sortBy: 'name', sortDirection: 'asc',
      });
      expect(result.totalCount).toBe(100);
      expect(result.currentPage).toBe(2);
      expect(result.totalPages).toBe(5);
    });
  });

  // ─── addOneOffContribution ────────────────────────────────────────────────

  describe('addOneOffContribution', () => {
    test('calls apiClient.post with the one-off endpoint', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        contributionId: 1, message: 'OK', memberName: 'John',
      });
      const data = { memberId: 1, amount: 50, date: '2024-01-01', description: 'Gift' };
      await api.addOneOffContribution(data);
      expect(vi.mocked(apiClient.post)).toHaveBeenCalledWith(
        '/api/contributions/one-off',
        data
      );
    });

    test('re-throws errors from the API', async () => {
      vi.mocked(apiClient.post).mockRejectedValue(new Error('Server error'));
      await expect(
        api.addOneOffContribution({ memberId: 1, amount: 10, date: '2024-01-01', description: 'x' })
      ).rejects.toThrow('Server error');
    });
  });

  // ─── getUnmatchedTransactions ─────────────────────────────────────────────

  describe('getUnmatchedTransactions', () => {
    test('calls the unmatched-transactions endpoint', async () => {
      await api.getUnmatchedTransactions();
      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith(
        '/api/financial/hsbc-transactions/unmatched'
      );
    });
  });

  // ─── assignTransaction ────────────────────────────────────────────────────

  describe('assignTransaction', () => {
    test('calls apiClient.post with the assign endpoint', async () => {
      const request = { churchMemberId: 5 };
      await api.assignTransaction(10, request);
      expect(vi.mocked(apiClient.post)).toHaveBeenCalledWith(
        '/api/financial/hsbc-transactions/10/assign',
        request
      );
    });
  });

  // ─── excludeReference ─────────────────────────────────────────────────────

  describe('excludeReference', () => {
    test('calls apiClient.post with the exclude endpoint', async () => {
      await api.excludeReference(7);
      expect(vi.mocked(apiClient.post)).toHaveBeenCalledWith(
        '/api/financial/hsbc-transactions/7/exclude',
        {}
      );
    });
  });

  // ─── getExcludedReferences ────────────────────────────────────────────────

  describe('getExcludedReferences', () => {
    test('calls the excluded-references endpoint', async () => {
      await api.getExcludedReferences();
      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith(
        '/api/financial/hsbc-transactions/excluded-references'
      );
    });
  });
});
