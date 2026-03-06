import { describe, test, expect, vi, beforeEach } from 'vitest';
import { DataProtectionApi } from './dataProtectionApi';
import { apiClient } from './ApiClient';

vi.mock('./ApiClient', () => ({
  apiClient: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

const BASE = '/api/church-members';

describe('DataProtectionApi', () => {
  let api: DataProtectionApi;

  beforeEach(() => {
    vi.clearAllMocks();
    api = new DataProtectionApi();
    vi.mocked(apiClient.get).mockResolvedValue({});
    vi.mocked(apiClient.put).mockResolvedValue({});
  });

  describe('getDataProtection', () => {
    test('calls the correct endpoint for a member', async () => {
      await api.getDataProtection(42);
      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith(`${BASE}/42/data-protection`);
    });

    test('returns the response data', async () => {
      const mockData = { consentGiven: true, consentDate: '2024-01-01' };
      vi.mocked(apiClient.get).mockResolvedValue(mockData);
      const result = await api.getDataProtection(1);
      expect(result).toEqual(mockData);
    });
  });

  describe('updateDataProtection', () => {
    test('calls put with correct endpoint and request', async () => {
      const request = { consentGiven: false };
      await api.updateDataProtection(10, request as unknown as Parameters<DataProtectionApi['updateDataProtection']>[1]);
      expect(vi.mocked(apiClient.put)).toHaveBeenCalledWith(
        `${BASE}/10/data-protection`,
        request
      );
    });
  });
});
