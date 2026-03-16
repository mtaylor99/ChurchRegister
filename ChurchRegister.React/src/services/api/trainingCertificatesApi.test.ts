import { describe, test, expect, vi, beforeEach } from 'vitest';
import { TrainingCertificatesApi } from './trainingCertificatesApi';
import { apiClient } from './ApiClient';

vi.mock('./ApiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const BASE = '/api/training-certificates';
const TYPES = '/api/training-certificate-types';
const DASHBOARD = '/api/dashboard/training-summary';

describe('TrainingCertificatesApi', () => {
  let api: TrainingCertificatesApi;

  beforeEach(() => {
    vi.clearAllMocks();
    api = new TrainingCertificatesApi();
    vi.mocked(apiClient.get).mockResolvedValue([]);
    vi.mocked(apiClient.post).mockResolvedValue({});
    vi.mocked(apiClient.put).mockResolvedValue({});
  });

  const baseQuery = {
    page: 1,
    pageSize: 20,
    sortBy: 'name',
    sortDirection: 'asc',
    expiringWithinDays: 30,
  };

  // ─── getTrainingCertificates ──────────────────────────────────────────────

  describe('getTrainingCertificates', () => {
    test('calls base endpoint with required params', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ items: [] });
      await api.getTrainingCertificates(baseQuery as Parameters<TrainingCertificatesApi['getTrainingCertificates']>[0]);
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string;
      expect(url).toContain(BASE);
      expect(url).toContain('page=1');
      expect(url).toContain('pageSize=20');
      expect(url).toContain('sortBy=name');
      expect(url).toContain('sortDirection=asc');
      expect(url).toContain('expiringWithinDays=30');
    });

    test('includes name when provided', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ items: [] });
      await api.getTrainingCertificates({ ...baseQuery, name: 'First Aid' } as Parameters<TrainingCertificatesApi['getTrainingCertificates']>[0]);
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string;
      expect(url).toContain('name=First+Aid');
    });

    test('includes status when provided', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ items: [] });
      await api.getTrainingCertificates({ ...baseQuery, status: 'Valid' } as Parameters<TrainingCertificatesApi['getTrainingCertificates']>[0]);
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string;
      expect(url).toContain('status=Valid');
    });

    test('includes typeId when provided', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ items: [] });
      await api.getTrainingCertificates({ ...baseQuery, typeId: 5 } as Parameters<TrainingCertificatesApi['getTrainingCertificates']>[0]);
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string;
      expect(url).toContain('typeId=5');
    });

    test('omits optional params when not provided', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ items: [] });
      await api.getTrainingCertificates(baseQuery as Parameters<TrainingCertificatesApi['getTrainingCertificates']>[0]);
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string;
      expect(url).not.toContain('name=');
      expect(url).not.toContain('status=');
      expect(url).not.toContain('typeId=');
    });
  });

  // ─── getTrainingCertificateById ───────────────────────────────────────────

  describe('getTrainingCertificateById', () => {
    test('calls the correct endpoint with id', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({});
      await api.getTrainingCertificateById(42);
      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith(`${BASE}/42`);
    });
  });

  // ─── createTrainingCertificate ────────────────────────────────────────────

  describe('createTrainingCertificate', () => {
    test('posts to base endpoint with request body', async () => {
      const request = { memberId: 1, typeId: 2, issueDate: '2024-01-01', expiryDate: '2025-01-01' };
      await api.createTrainingCertificate(request as unknown as Parameters<TrainingCertificatesApi['createTrainingCertificate']>[0]);
      expect(vi.mocked(apiClient.post)).toHaveBeenCalledWith(BASE, request);
    });
  });

  // ─── updateTrainingCertificate ────────────────────────────────────────────

  describe('updateTrainingCertificate', () => {
    test('puts to correct endpoint', async () => {
      const request = { issueDate: '2024-06-01', expiryDate: '2025-06-01' };
      await api.updateTrainingCertificate(7, request as unknown as Parameters<TrainingCertificatesApi['updateTrainingCertificate']>[1]);
      expect(vi.mocked(apiClient.put)).toHaveBeenCalledWith(`${BASE}/7`, request);
    });
  });

  // ─── getTrainingCertificateTypes ──────────────────────────────────────────

  describe('getTrainingCertificateTypes', () => {
    test('calls types endpoint without filter when not provided', async () => {
      await api.getTrainingCertificateTypes();
      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith(TYPES);
    });

    test('includes statusFilter when provided', async () => {
      await api.getTrainingCertificateTypes('Active');
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string;
      expect(url).toContain(`${TYPES}?`);
      expect(url).toContain('statusFilter=Active');
    });
  });

  // ─── createTrainingCertificateType ───────────────────────────────────────

  describe('createTrainingCertificateType', () => {
    test('posts to types endpoint', async () => {
      const request = { name: 'Food Safety', validityDays: 365 };
      await api.createTrainingCertificateType(request as unknown as Parameters<TrainingCertificatesApi['createTrainingCertificateType']>[0]);
      expect(vi.mocked(apiClient.post)).toHaveBeenCalledWith(TYPES, request);
    });
  });

  // ─── updateTrainingCertificateType ───────────────────────────────────────

  describe('updateTrainingCertificateType', () => {
    test('puts to correct type endpoint', async () => {
      const request = { name: 'Updated Type', validityDays: 730 };
      await api.updateTrainingCertificateType(3, request as unknown as Parameters<TrainingCertificatesApi['updateTrainingCertificateType']>[1]);
      expect(vi.mocked(apiClient.put)).toHaveBeenCalledWith(`${TYPES}/3`, request);
    });
  });

  // ─── getDashboardTrainingSummary ──────────────────────────────────────────

  describe('getDashboardTrainingSummary', () => {
    test('calls the dashboard training summary endpoint', async () => {
      await api.getDashboardTrainingSummary();
      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith(DASHBOARD);
    });
  });
});
