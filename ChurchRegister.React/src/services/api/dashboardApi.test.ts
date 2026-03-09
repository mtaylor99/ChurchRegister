import { describe, test, expect, vi, beforeEach } from 'vitest';
import { DashboardApi } from './dashboardApi';
import { apiClient } from './ApiClient';

vi.mock('./ApiClient', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('DashboardApi', () => {
  let api: DashboardApi;

  beforeEach(() => {
    vi.clearAllMocks();
    api = new DashboardApi();
    vi.mocked(apiClient.get).mockResolvedValue({});
  });

  describe('getStatistics', () => {
    test('calls the dashboard statistics endpoint', async () => {
      await api.getStatistics();
      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith('/api/dashboard/statistics');
    });

    test('returns the response from apiClient', async () => {
      const mockData = { totalMembers: 150, newMembersThisMonth: 5, trainingAlerts: [] };
      vi.mocked(apiClient.get).mockResolvedValue(mockData);
      const result = await api.getStatistics();
      expect(result).toEqual(mockData);
    });
  });
});
