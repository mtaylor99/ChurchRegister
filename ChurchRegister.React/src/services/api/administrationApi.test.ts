import { describe, test, expect, vi, beforeEach } from 'vitest';
import { AdministrationApi } from './administrationApi';
import { apiClient } from './ApiClient';

vi.mock('./ApiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const BASE = '/api/administration';

describe('AdministrationApi', () => {
  let api: AdministrationApi;

  beforeEach(() => {
    vi.clearAllMocks();
    api = new AdministrationApi();
    vi.mocked(apiClient.get).mockResolvedValue([]);
    vi.mocked(apiClient.post).mockResolvedValue({});
    vi.mocked(apiClient.put).mockResolvedValue({});
    (apiClient as unknown as { patch: ReturnType<typeof vi.fn> }).patch =
      vi.fn().mockResolvedValue({});
    vi.mocked(apiClient.delete).mockResolvedValue(undefined);
  });

  // ─── getUsers ──────────────────────────────────────────────────────────────

  describe('getUsers', () => {
    test('calls users endpoint with required params', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ items: [], totalCount: 0 });
      await api.getUsers({ page: 1, pageSize: 20, sortBy: 'name', sortDirection: 'asc' });
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string;
      expect(url).toContain(`${BASE}/users`);
      expect(url).toContain('page=1');
      expect(url).toContain('pageSize=20');
      expect(url).toContain('sortBy=name');
      expect(url).toContain('sortDirection=asc');
    });

    test('includes searchTerm in query string when provided', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ items: [], totalCount: 0 });
      await api.getUsers({ page: 1, pageSize: 10, sortBy: 'name', sortDirection: 'asc', searchTerm: 'John' });
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string;
      expect(url).toContain('searchTerm=John');
    });

    test('includes statusFilter when provided', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ items: [], totalCount: 0 });
      await api.getUsers({ page: 1, pageSize: 10, sortBy: 'name', sortDirection: 'asc', statusFilter: 1 });
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string;
      expect(url).toContain('statusFilter=1');
    });

    test('includes roleFilter when provided', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ items: [], totalCount: 0 });
      await api.getUsers({ page: 1, pageSize: 10, sortBy: 'name', sortDirection: 'asc', roleFilter: 'Admin' });
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string;
      expect(url).toContain('roleFilter=Admin');
    });

    test('omits optional params when not provided', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ items: [], totalCount: 0 });
      await api.getUsers({ page: 1, pageSize: 10, sortBy: 'name', sortDirection: 'asc' });
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string;
      expect(url).not.toContain('searchTerm');
      expect(url).not.toContain('statusFilter');
      expect(url).not.toContain('roleFilter');
    });
  });

  // ─── createUser ────────────────────────────────────────────────────────────

  describe('createUser', () => {
    test('posts to users endpoint with request body', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ userId: 'abc', message: 'Created' });
      const request = { email: 'test@example.com', firstName: 'Test', lastName: 'User', roleId: 'role1' };
      await api.createUser(request as unknown as Parameters<AdministrationApi['createUser']>[0]);
      expect(vi.mocked(apiClient.post)).toHaveBeenCalledWith(`${BASE}/users`, request);
    });
  });

  // ─── updateUser ────────────────────────────────────────────────────────────

  describe('updateUser', () => {
    test('puts to user endpoint with userId and request', async () => {
      vi.mocked(apiClient.put).mockResolvedValue({});
      const request = { firstName: 'Updated', lastName: 'User', roleId: 'role1' };
      await api.updateUser('user-123', request as unknown as Parameters<AdministrationApi['updateUser']>[1]);
      expect(vi.mocked(apiClient.put)).toHaveBeenCalledWith(
        `${BASE}/users/user-123`,
        request
      );
    });
  });

  // ─── updateUserStatus ──────────────────────────────────────────────────────

  describe('updateUserStatus', () => {
    test('patches with status update', async () => {
      const patchMock = vi.fn().mockResolvedValue({});
      (apiClient as unknown as { patch: typeof patchMock }).patch = patchMock;
      const request = { isActive: false };
      await api.updateUserStatus('user-456', request as unknown as Parameters<AdministrationApi['updateUserStatus']>[1]);
      expect(patchMock).toHaveBeenCalledWith(
        `${BASE}/users/user-456/status`,
        request
      );
    });
  });

  // ─── resendInvitation ──────────────────────────────────────────────────────

  describe('resendInvitation', () => {
    test('posts to resend-invitation endpoint', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ message: 'Sent', emailSent: true });
      await api.resendInvitation('user-789');
      expect(vi.mocked(apiClient.post)).toHaveBeenCalledWith(
        `${BASE}/users/user-789/resend-invitation`,
        {}
      );
    });
  });

  // ─── getSystemRoles ────────────────────────────────────────────────────────

  describe('getSystemRoles', () => {
    test('calls the roles endpoint', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([]);
      await api.getSystemRoles();
      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith(`${BASE}/roles`);
    });
  });

  // ─── getUserById ───────────────────────────────────────────────────────────

  describe('getUserById', () => {
    test('calls users endpoint with userId', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({});
      await api.getUserById('user-001');
      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith(`${BASE}/users/user-001`);
    });
  });
});
