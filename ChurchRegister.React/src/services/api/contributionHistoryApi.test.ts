import { describe, test, expect, vi, beforeEach } from 'vitest';
import { contributionHistoryApi } from './contributionHistoryApi';
import { apiClient } from './ApiClient';

vi.mock('./ApiClient', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('contributionHistoryApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.get).mockResolvedValue([]);
  });

  describe('getContributionHistory', () => {
    test('calls the correct endpoint for a member', async () => {
      await contributionHistoryApi.getContributionHistory(5);
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string;
      expect(url).toContain('/api/church-members/5/contributions');
    });

    test('calls without query string when no dates provided', async () => {
      await contributionHistoryApi.getContributionHistory(1);
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string;
      expect(url).toBe('/api/church-members/1/contributions');
    });

    test('includes startDate when provided', async () => {
      await contributionHistoryApi.getContributionHistory(1, '2024-01-01');
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string;
      expect(url).toContain('startDate=2024-01-01');
    });

    test('includes endDate when provided', async () => {
      await contributionHistoryApi.getContributionHistory(1, undefined, '2024-12-31');
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string;
      expect(url).toContain('endDate=2024-12-31');
    });

    test('includes both dates when both provided', async () => {
      await contributionHistoryApi.getContributionHistory(1, '2024-01-01', '2024-12-31');
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string;
      expect(url).toContain('startDate=2024-01-01');
      expect(url).toContain('endDate=2024-12-31');
    });

    test('returns the array of contributions', async () => {
      const mockData = [{ id: 1, amount: 100, date: '2024-03-01' }];
      vi.mocked(apiClient.get).mockResolvedValue(mockData);
      const result = await contributionHistoryApi.getContributionHistory(2);
      expect(result).toEqual(mockData);
    });
  });
});
