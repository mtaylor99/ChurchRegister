import { describe, test, expect, vi, beforeEach } from 'vitest';
import { DistrictsApi } from './districtsApi';
import { apiClient } from './ApiClient';

vi.mock('./ApiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    getBaseUrl: vi.fn().mockReturnValue('http://localhost'),
    getToken: vi.fn().mockReturnValue('test-token'),
  },
}));

describe('DistrictsApi', () => {
  let api: DistrictsApi;

  beforeEach(() => {
    vi.clearAllMocks();
    api = new DistrictsApi();
    vi.mocked(apiClient.get).mockResolvedValue([]);
    vi.mocked(apiClient.put).mockResolvedValue(undefined);
  });

  // ─── getDistricts ─────────────────────────────────────────────────────────

  describe('getDistricts', () => {
    test('calls the /api/districts endpoint', async () => {
      await api.getDistricts();
      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith('/api/districts');
    });
  });

  // ─── assignDistrict ───────────────────────────────────────────────────────

  describe('assignDistrict', () => {
    test('calls apiClient.put with member district path', async () => {
      const request = { districtId: 2 };
      await api.assignDistrict(10, request);
      expect(vi.mocked(apiClient.put)).toHaveBeenCalledWith(
        '/api/church-members/10/district',
        request
      );
    });
  });

  // ─── getActiveDeacons ─────────────────────────────────────────────────────

  describe('getActiveDeacons', () => {
    test('calls the /api/districts/deacons endpoint', async () => {
      await api.getActiveDeacons();
      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith(
        '/api/districts/deacons'
      );
    });
  });

  // ─── getActiveDistrictOfficers ────────────────────────────────────────────

  describe('getActiveDistrictOfficers', () => {
    test('calls the endpoint without exclusion param by default', async () => {
      await api.getActiveDistrictOfficers();
      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith(
        '/api/districts/district-officers'
      );
    });

    test('appends excludeMemberId param when provided', async () => {
      await api.getActiveDistrictOfficers(5);
      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith(
        '/api/districts/district-officers?excludeMemberId=5'
      );
    });
  });

  // ─── assignDeacon ─────────────────────────────────────────────────────────

  describe('assignDeacon', () => {
    test('calls apiClient.put with assign-deacon path', async () => {
      const request = { deaconId: 3 };
      await api.assignDeacon(1, request);
      expect(vi.mocked(apiClient.put)).toHaveBeenCalledWith(
        '/api/districts/1/assign-deacon',
        request
      );
    });
  });

  // ─── assignDistrictOfficer ────────────────────────────────────────────────

  describe('assignDistrictOfficer', () => {
    test('calls apiClient.put with assign-district-officer path', async () => {
      const request = { districtOfficerId: 7 };
      await api.assignDistrictOfficer(2, request);
      expect(vi.mocked(apiClient.put)).toHaveBeenCalledWith(
        '/api/districts/2/assign-district-officer',
        request
      );
    });
  });

  // ─── assignDescription ────────────────────────────────────────────────────

  describe('assignDescription', () => {
    test('calls apiClient.put with assign-description path', async () => {
      const request = { description: 'North zone' };
      await api.assignDescription(3, request);
      expect(vi.mocked(apiClient.put)).toHaveBeenCalledWith(
        '/api/districts/3/assign-description',
        request
      );
    });
  });

  // ─── exportDistricts ─────────────────────────────────────────────────────

  describe('exportDistricts', () => {
    test('calls fetch and returns a blob on success', async () => {
      const mockBlob = new Blob(['pdf-content'], { type: 'application/pdf' });
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        blob: vi.fn().mockResolvedValue(mockBlob),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await api.exportDistricts();
      expect(result).toBe(mockBlob);

      vi.unstubAllGlobals();
    });

    test('throws when response is not ok', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
      await expect(api.exportDistricts()).rejects.toThrow('Failed to export districts');
      vi.unstubAllGlobals();
    });
  });

  // ─── exportDistrictsMemberList ────────────────────────────────────────────

  describe('exportDistrictsMemberList', () => {
    test('calls fetch and returns a blob on success', async () => {
      const mockBlob = new Blob(['pdf'], { type: 'application/pdf' });
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        blob: vi.fn().mockResolvedValue(mockBlob),
      }));

      const result = await api.exportDistrictsMemberList();
      expect(result).toBe(mockBlob);

      vi.unstubAllGlobals();
    });

    test('throws when response is not ok', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
      await expect(api.exportDistrictsMemberList()).rejects.toThrow('Failed to export');
      vi.unstubAllGlobals();
    });
  });
});
