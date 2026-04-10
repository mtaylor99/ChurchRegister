import { describe, test, expect, vi, beforeEach } from 'vitest';
import { ChurchMembersApi } from './churchMembersApi';
import { apiClient } from './ApiClient';

vi.mock('./ApiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    getBaseUrl: vi.fn(() => 'http://localhost:5000'),
    getToken: vi.fn(() => 'mock-token'),
  },
}));

const BASE = '/api/church-members';

const makeBlob = () => new Blob(['data'], { type: 'application/pdf' });
const makeFetchResponse = (ok = true) => ({
  ok,
  blob: vi.fn().mockResolvedValue(makeBlob()),
});

describe('ChurchMembersApi', () => {
  let api: ChurchMembersApi;

  beforeEach(() => {
    vi.clearAllMocks();
    api = new ChurchMembersApi();
    vi.mocked(apiClient.get).mockResolvedValue({ items: [], totalCount: 0 });
    vi.mocked(apiClient.post).mockResolvedValue({});
    vi.mocked(apiClient.put).mockResolvedValue({});
    (apiClient as unknown as { patch: ReturnType<typeof vi.fn> }).patch =
      vi.fn().mockResolvedValue({});
    vi.mocked(apiClient.delete).mockResolvedValue(undefined);

    // Stub DOM methods for blob download tests
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:http://localhost/fake'),
      revokeObjectURL: vi.fn(),
    });
    const fakeLink = {
      href: '',
      download: '',
      click: vi.fn(),
    };
    const appendChildSpy = vi.fn();
    const removeChildSpy = vi.fn();
    vi.spyOn(document.body, 'appendChild').mockImplementation(appendChildSpy);
    vi.spyOn(document.body, 'removeChild').mockImplementation(removeChildSpy);
    vi.spyOn(document, 'createElement').mockReturnValue(
      fakeLink as unknown as HTMLAnchorElement
    );
  });

  const baseQuery = {
    page: 1,
    pageSize: 20,
    sortBy: 'name',
    sortDirection: 'asc',
  };

  // ─── getChurchMembers ─────────────────────────────────────────────────────

  describe('getChurchMembers', () => {
    test('calls members endpoint with required params', async () => {
      await api.getChurchMembers(baseQuery as Parameters<ChurchMembersApi['getChurchMembers']>[0]);
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string;
      expect(url).toContain(`${BASE}?`);
      expect(url).toContain('page=1');
      expect(url).toContain('pageSize=20');
      expect(url).toContain('sortBy=name');
      expect(url).toContain('sortDirection=asc');
    });

    test('includes searchTerm when provided', async () => {
      await api.getChurchMembers({ ...baseQuery, searchTerm: 'Test' } as Parameters<ChurchMembersApi['getChurchMembers']>[0]);
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string;
      expect(url).toContain('searchTerm=Test');
    });

    test('includes statusFilter when provided', async () => {
      await api.getChurchMembers({ ...baseQuery, statusFilter: 1 } as Parameters<ChurchMembersApi['getChurchMembers']>[0]);
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string;
      expect(url).toContain('statusFilter=1');
    });

    test('includes roleFilter when provided', async () => {
      await api.getChurchMembers({ ...baseQuery, roleFilter: 2 } as Parameters<ChurchMembersApi['getChurchMembers']>[0]);
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string;
      expect(url).toContain('roleFilter=2');
    });

    test('includes districtFilter when provided', async () => {
      await api.getChurchMembers({ ...baseQuery, districtFilter: 3 } as Parameters<ChurchMembersApi['getChurchMembers']>[0]);
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string;
      expect(url).toContain('districtFilter=3');
    });

    test('includes unassignedDistrictFilter when provided', async () => {
      await api.getChurchMembers({ ...baseQuery, unassignedDistrictFilter: true } as Parameters<ChurchMembersApi['getChurchMembers']>[0]);
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string;
      expect(url).toContain('unassignedDistrictFilter=true');
    });

    test('includes baptisedFilter when provided', async () => {
      await api.getChurchMembers({ ...baseQuery, baptisedFilter: false } as Parameters<ChurchMembersApi['getChurchMembers']>[0]);
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string;
      expect(url).toContain('baptisedFilter=false');
    });

    test('includes giftAidFilter when provided', async () => {
      await api.getChurchMembers({ ...baseQuery, giftAidFilter: true } as Parameters<ChurchMembersApi['getChurchMembers']>[0]);
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string;
      expect(url).toContain('giftAidFilter=true');
    });

    test('includes pastoralCareRequired when provided', async () => {
      await api.getChurchMembers({ ...baseQuery, pastoralCareRequired: true } as Parameters<ChurchMembersApi['getChurchMembers']>[0]);
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string;
      expect(url).toContain('pastoralCareRequired=true');
    });

    test('includes noBankReferenceFilter when provided', async () => {
      await api.getChurchMembers({ ...baseQuery, noBankReferenceFilter: true } as Parameters<ChurchMembersApi['getChurchMembers']>[0]);
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string;
      expect(url).toContain('noBankReferenceFilter=true');
    });
  });

  // ─── getChurchMemberById ──────────────────────────────────────────────────

  describe('getChurchMemberById', () => {
    test('calls the correct endpoint with memberId', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({});
      await api.getChurchMemberById(99);
      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith(`${BASE}/99`);
    });
  });

  // ─── createChurchMember ───────────────────────────────────────────────────

  describe('createChurchMember', () => {
    test('posts to the base endpoint with request body', async () => {
      const request = { firstName: 'John', lastName: 'Doe' };
      await api.createChurchMember(request as Parameters<ChurchMembersApi['createChurchMember']>[0]);
      expect(vi.mocked(apiClient.post)).toHaveBeenCalledWith(BASE, request);
    });
  });

  // ─── updateChurchMember ───────────────────────────────────────────────────

  describe('updateChurchMember', () => {
    test('puts to the correct endpoint', async () => {
      vi.mocked(apiClient.put).mockResolvedValue({});
      const request = { firstName: 'Updated' };
      await api.updateChurchMember(5, request as Parameters<ChurchMembersApi['updateChurchMember']>[1]);
      expect(vi.mocked(apiClient.put)).toHaveBeenCalledWith(`${BASE}/5`, request);
    });
  });

  // ─── updateChurchMemberStatus ─────────────────────────────────────────────

  describe('updateChurchMemberStatus', () => {
    test('patches to the status endpoint', async () => {
      const patchMock = vi.fn().mockResolvedValue({});
      (apiClient as unknown as { patch: typeof patchMock }).patch = patchMock;
      const request = { statusId: 2 };
      await api.updateChurchMemberStatus(7, request as Parameters<ChurchMembersApi['updateChurchMemberStatus']>[1]);
      expect(patchMock).toHaveBeenCalledWith(`${BASE}/7/status`, request);
    });
  });

  // ─── deleteChurchMember ───────────────────────────────────────────────────

  describe('deleteChurchMember', () => {
    test('calls delete on the correct endpoint', async () => {
      await api.deleteChurchMember(12);
      expect(vi.mocked(apiClient.delete)).toHaveBeenCalledWith(`${BASE}/12`);
    });
  });

  // ─── getRoles ─────────────────────────────────────────────────────────────

  describe('getRoles', () => {
    test('calls the roles endpoint', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([]);
      await api.getRoles();
      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith(`${BASE}/roles`);
    });
  });

  // ─── getStatuses ──────────────────────────────────────────────────────────

  describe('getStatuses', () => {
    test('calls the statuses endpoint', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([]);
      await api.getStatuses();
      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith(`${BASE}/statuses`);
    });
  });

  // ─── getNextAvailableMemberNumber ─────────────────────────────────────────

  describe('getNextAvailableMemberNumber', () => {
    test('calls the next-member-number endpoint without params', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ nextNumber: 100, year: 2024 });
      await api.getNextAvailableMemberNumber();
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string;
      expect(url).toBe('/api/administration/church-members/next-member-number');
    });

    test('includes isMember param when provided', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ nextNumber: 1, year: 2024 });
      await api.getNextAvailableMemberNumber({ isMember: true });
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string;
      expect(url).toContain('isMember=true');
    });

    test('includes isBaptised param when provided', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ nextNumber: 1, year: 2024 });
      await api.getNextAvailableMemberNumber({ isBaptised: false });
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string;
      expect(url).toContain('isBaptised=false');
    });
  });

  // ─── getMemberStatistics ──────────────────────────────────────────────────

  describe('getMemberStatistics', () => {
    test('calls the statistics endpoint', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({});
      await api.getMemberStatistics();
      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith(`${BASE}/statistics`);
    });
  });

  // ─── exportPastoralCareReport ─────────────────────────────────────────────

  describe('exportPastoralCareReport', () => {
    test('fetches and downloads the pastoral care report', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeFetchResponse(true)));
      await api.exportPastoralCareReport();
      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
        expect.stringContaining('pastoral-care/export'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    test('throws on non-ok response', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeFetchResponse(false)));
      await expect(api.exportPastoralCareReport()).rejects.toThrow('Failed to export pastoral care report');
    });
  });

  // ─── exportEnvelopeLabels ─────────────────────────────────────────────────

  describe('exportEnvelopeLabels', () => {
    test('fetches envelope labels for the given year', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeFetchResponse(true)));
      await api.exportEnvelopeLabels(2024);
      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
        expect.stringContaining('envelope-labels?year=2024'),
        expect.any(Object)
      );
    });

    test('throws on non-ok response', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeFetchResponse(false)));
      await expect(api.exportEnvelopeLabels(2024)).rejects.toThrow('Failed to export envelope labels');
    });
  });

  // ─── exportAddressLabels ──────────────────────────────────────────────────

  describe('exportAddressLabels', () => {
    test('fetches address labels', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeFetchResponse(true)));
      await api.exportAddressLabels();
      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
        expect.stringContaining('address-labels'),
        expect.any(Object)
      );
    });

    test('throws on non-ok response', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeFetchResponse(false)));
      await expect(api.exportAddressLabels()).rejects.toThrow('Failed to export address labels');
    });
  });

  // ─── exportEnvelopeNumbers ────────────────────────────────────────────────

  describe('exportEnvelopeNumbers', () => {
    test('fetches envelope numbers for the given year', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeFetchResponse(true)));
      await api.exportEnvelopeNumbers(2024);
      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
        expect.stringContaining('envelope-numbers?year=2024'),
        expect.any(Object)
      );
    });

    test('throws on non-ok response', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeFetchResponse(false)));
      await expect(api.exportEnvelopeNumbers(2024)).rejects.toThrow('Failed to export envelope numbers');
    });
  });

  // ─── exportAddressList ────────────────────────────────────────────────────

  describe('exportAddressList', () => {
    test('fetches address list', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeFetchResponse(true)));
      await api.exportAddressList();
      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
        expect.stringContaining('address-list'),
        expect.any(Object)
      );
    });

    test('throws on non-ok response', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeFetchResponse(false)));
      await expect(api.exportAddressList()).rejects.toThrow('Failed to export address list');
    });
  });
});
