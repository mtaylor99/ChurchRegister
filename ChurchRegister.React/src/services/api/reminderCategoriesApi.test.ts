import { describe, test, expect, vi, beforeEach } from 'vitest';
import { ReminderCategoriesApi } from './reminderCategoriesApi';
import { apiClient } from './ApiClient';

vi.mock('./ApiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const BASE = '/api/reminder-categories';

describe('ReminderCategoriesApi', () => {
  let api: ReminderCategoriesApi;

  beforeEach(() => {
    vi.clearAllMocks();
    api = new ReminderCategoriesApi();
    vi.mocked(apiClient.get).mockResolvedValue([]);
    vi.mocked(apiClient.post).mockResolvedValue({});
    vi.mocked(apiClient.put).mockResolvedValue({});
    vi.mocked(apiClient.delete).mockResolvedValue(undefined);
  });

  describe('getCategories', () => {
    test('calls the reminder-categories endpoint', async () => {
      await api.getCategories();
      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith(BASE);
    });
  });

  describe('getCategoryById', () => {
    test('calls the endpoint with id', async () => {
      await api.getCategoryById(5);
      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith(`${BASE}/5`);
    });
  });

  describe('createCategory', () => {
    test('posts to the endpoint with request body', async () => {
      const request = { name: 'Pastoral', colorHex: '#FF5733' };
      await api.createCategory(request as Parameters<ReminderCategoriesApi['createCategory']>[0]);
      expect(vi.mocked(apiClient.post)).toHaveBeenCalledWith(BASE, request);
    });
  });

  describe('updateCategory', () => {
    test('puts to the correct endpoint', async () => {
      const request = { name: 'Updated', colorHex: '#123456' };
      await api.updateCategory(3, request as Parameters<ReminderCategoriesApi['updateCategory']>[1]);
      expect(vi.mocked(apiClient.put)).toHaveBeenCalledWith(`${BASE}/3`, request);
    });
  });

  describe('deleteCategory', () => {
    test('calls delete on the correct endpoint', async () => {
      await api.deleteCategory(8);
      expect(vi.mocked(apiClient.delete)).toHaveBeenCalledWith(`${BASE}/8`);
    });
  });
});
