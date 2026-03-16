import { describe, test, expect, vi, beforeEach } from 'vitest';
import { RemindersApi } from './remindersApi';
import { apiClient } from './ApiClient';
import type { ReminderQueryParameters } from '../../types/reminders';

vi.mock('./ApiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('RemindersApi', () => {
  let api: RemindersApi;

  beforeEach(() => {
    vi.clearAllMocks();
    api = new RemindersApi();
    vi.mocked(apiClient.get).mockResolvedValue([]);
    vi.mocked(apiClient.post).mockResolvedValue({});
    vi.mocked(apiClient.put).mockResolvedValue({});
    vi.mocked(apiClient.delete).mockResolvedValue(undefined);
  });

  // ─── getReminders ─────────────────────────────────────────────────────────

  describe('getReminders', () => {
    test('calls apiClient.get without params when empty query', async () => {
      const params: ReminderQueryParameters = {};
      await api.getReminders(params);
      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith(
        '/api/reminders'
      );
    });

    test('appends status param when provided', async () => {
      await api.getReminders({ status: 'Pending' });
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string;
      expect(url).toContain('status=Pending');
    });

    test('appends assignedToUserId when provided', async () => {
      await api.getReminders({ assignedToUserId: 'user-123' });
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string;
      expect(url).toContain('assignedToUserId=user-123');
    });

    test('appends categoryId when provided', async () => {
      await api.getReminders({ categoryId: 5 });
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string;
      expect(url).toContain('categoryId=5');
    });

    test('appends description when provided', async () => {
      await api.getReminders({ description: 'annual review' });
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string;
      expect(url).toContain('description=annual+review');
    });

    test('appends showCompleted when provided', async () => {
      await api.getReminders({ showCompleted: true });
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string;
      expect(url).toContain('showCompleted=true');
    });

    test('combines multiple params correctly', async () => {
      await api.getReminders({ status: 'Pending', categoryId: 3 });
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string;
      expect(url).toContain('status=Pending');
      expect(url).toContain('categoryId=3');
    });
  });

  // ─── getReminderById ──────────────────────────────────────────────────────

  describe('getReminderById', () => {
    test('calls apiClient.get with the correct id path', async () => {
      await api.getReminderById(42);
      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith('/api/reminders/42');
    });
  });

  // ─── createReminder ───────────────────────────────────────────────────────

  describe('createReminder', () => {
    test('calls apiClient.post with the base path and request', async () => {
      const request = {
        description: 'Annual visit',
        dueDate: '2024-12-31',
        assignedToUserId: 'user-1',
        categoryId: null as null,
        priority: null as null,
      };
      await api.createReminder(request);
      expect(vi.mocked(apiClient.post)).toHaveBeenCalledWith(
        '/api/reminders',
        request
      );
    });
  });

  // ─── updateReminder ───────────────────────────────────────────────────────

  describe('updateReminder', () => {
    test('calls apiClient.put with the id path and request', async () => {
      const request = {
        description: 'Updated',
        dueDate: '2024-12-31',
        assignedToUserId: 'user-1',
        categoryId: null as null,
        priority: null as null,
      };
      await api.updateReminder(7, request);
      expect(vi.mocked(apiClient.put)).toHaveBeenCalledWith(
        '/api/reminders/7',
        request
      );
    });
  });

  // ─── completeReminder ─────────────────────────────────────────────────────

  describe('completeReminder', () => {
    test('calls apiClient.put with complete path and request', async () => {
      const request = { completionNotes: 'Done', createNext: false, nextInterval: null as null, customDueDate: null as null };
      await api.completeReminder(5, request);
      expect(vi.mocked(apiClient.put)).toHaveBeenCalledWith(
        '/api/reminders/5/complete',
        request
      );
    });
  });

  // ─── deleteReminder ───────────────────────────────────────────────────────

  describe('deleteReminder', () => {
    test('calls apiClient.delete with the correct path', async () => {
      await api.deleteReminder(3);
      expect(vi.mocked(apiClient.delete)).toHaveBeenCalledWith('/api/reminders/3');
    });
  });

  // ─── getDashboardSummary ──────────────────────────────────────────────────

  describe('getDashboardSummary', () => {
    test('calls apiClient.get with dashboard-summary path', async () => {
      await api.getDashboardSummary();
      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith(
        '/api/reminders/dashboard-summary'
      );
    });
  });
});
