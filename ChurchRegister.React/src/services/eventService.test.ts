import { describe, test, expect, vi, beforeEach } from 'vitest';
import { EventService, type Event, type CreateEventRequest, type UpdateEventRequest } from './eventService';
import { apiClient } from './api/ApiClient';

vi.mock('./api/ApiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const makeEvent = (overrides: Partial<Event> = {}): Event => ({
  id: 1,
  name: 'Sunday Service',
  isActive: true,
  showInAnalysis: true,
  createdBy: 'admin',
  createdDateTime: '2024-01-01T00:00:00Z',
  ...overrides,
});

describe('EventService', () => {
  let service: EventService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new EventService();
  });

  // ─── getEvents ─────────────────────────────────────────────────────────────

  describe('getEvents', () => {
    test('calls apiClient.get with the events path', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([]);
      await service.getEvents();
      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith('/api/events');
    });

    test('returns the list from apiClient', async () => {
      const events = [makeEvent({ id: 1 }), makeEvent({ id: 2 })];
      vi.mocked(apiClient.get).mockResolvedValue(events);
      const result = await service.getEvents();
      expect(result).toEqual(events);
    });
  });

  // ─── getActiveEvents ───────────────────────────────────────────────────────

  describe('getActiveEvents', () => {
    test('returns only active events', async () => {
      const events = [
        makeEvent({ id: 1, isActive: true }),
        makeEvent({ id: 2, isActive: false }),
        makeEvent({ id: 3, isActive: true }),
      ];
      vi.mocked(apiClient.get).mockResolvedValue(events);
      const result = await service.getActiveEvents();
      expect(result).toHaveLength(2);
      expect(result.every((e) => e.isActive)).toBe(true);
    });

    test('returns empty array when no active events', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([
        makeEvent({ isActive: false }),
      ]);
      const result = await service.getActiveEvents();
      expect(result).toEqual([]);
    });
  });

  // ─── getAnalysisEvents ─────────────────────────────────────────────────────

  describe('getAnalysisEvents', () => {
    test('returns only active events that show in analysis', async () => {
      const events = [
        makeEvent({ id: 1, isActive: true, showInAnalysis: true }),
        makeEvent({ id: 2, isActive: true, showInAnalysis: false }),
        makeEvent({ id: 3, isActive: false, showInAnalysis: true }),
        makeEvent({ id: 4, isActive: false, showInAnalysis: false }),
      ];
      vi.mocked(apiClient.get).mockResolvedValue(events);
      const result = await service.getAnalysisEvents();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    test('returns empty array when no qualifying events', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([
        makeEvent({ isActive: false, showInAnalysis: true }),
      ]);
      const result = await service.getAnalysisEvents();
      expect(result).toEqual([]);
    });
  });

  // ─── getEvent ──────────────────────────────────────────────────────────────

  describe('getEvent', () => {
    test('returns event when found by id', async () => {
      const events = [makeEvent({ id: 5 })];
      vi.mocked(apiClient.get).mockResolvedValue(events);
      const result = await service.getEvent(5);
      expect(result).toEqual(events[0]);
    });

    test('returns null when event not found', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([makeEvent({ id: 1 })]);
      const result = await service.getEvent(999);
      expect(result).toBeNull();
    });

    test('returns null and does not throw when apiClient throws', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'));
      const result = await service.getEvent(1);
      expect(result).toBeNull();
    });
  });

  // ─── createEvent ───────────────────────────────────────────────────────────

  describe('createEvent', () => {
    test('calls apiClient.post with the request', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(undefined);
      const request: CreateEventRequest = {
        name: 'New Event',
        isActive: true,
        showInAnalysis: false,
      };
      await service.createEvent(request);
      expect(vi.mocked(apiClient.post)).toHaveBeenCalledWith(
        '/api/events',
        request
      );
    });
  });

  // ─── updateEvent ───────────────────────────────────────────────────────────

  describe('updateEvent', () => {
    test('calls apiClient.put with the correct path and request', async () => {
      vi.mocked(apiClient.put).mockResolvedValue(undefined);
      const request: UpdateEventRequest = {
        id: 7,
        name: 'Updated',
        isActive: true,
        showInAnalysis: true,
      };
      await service.updateEvent(request);
      expect(vi.mocked(apiClient.put)).toHaveBeenCalledWith(
        '/api/events/7',
        request
      );
    });
  });

  // ─── toggleEventStatus ─────────────────────────────────────────────────────

  describe('toggleEventStatus', () => {
    test('toggles isActive from true to false', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([
        makeEvent({ id: 1, isActive: true }),
      ]);
      vi.mocked(apiClient.put).mockResolvedValue(undefined);
      await service.toggleEventStatus(1);
      const putCall = vi.mocked(apiClient.put).mock.calls[0];
      expect((putCall[1] as UpdateEventRequest).isActive).toBe(false);
    });

    test('toggles isActive from false to true', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([
        makeEvent({ id: 1, isActive: false }),
      ]);
      vi.mocked(apiClient.put).mockResolvedValue(undefined);
      await service.toggleEventStatus(1);
      const putCall = vi.mocked(apiClient.put).mock.calls[0];
      expect((putCall[1] as UpdateEventRequest).isActive).toBe(true);
    });

    test('throws when event not found', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'));
      await expect(service.toggleEventStatus(999)).rejects.toThrow();
    });
  });

  // ─── toggleAnalysisVisibility ──────────────────────────────────────────────

  describe('toggleAnalysisVisibility', () => {
    test('toggles showInAnalysis from true to false', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([
        makeEvent({ id: 1, showInAnalysis: true }),
      ]);
      vi.mocked(apiClient.put).mockResolvedValue(undefined);
      await service.toggleAnalysisVisibility(1);
      const putCall = vi.mocked(apiClient.put).mock.calls[0];
      expect((putCall[1] as UpdateEventRequest).showInAnalysis).toBe(false);
    });

    test('throws when event not found', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([]);
      await expect(service.toggleAnalysisVisibility(1)).rejects.toThrow('Event not found');
    });
  });

  // ─── searchEvents ──────────────────────────────────────────────────────────

  describe('searchEvents', () => {
    test('filters events by name (case-insensitive)', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([
        makeEvent({ id: 1, name: 'Sunday Service' }),
        makeEvent({ id: 2, name: 'Prayer Meeting' }),
        makeEvent({ id: 3, name: 'Sunday School' }),
      ]);
      const result = await service.searchEvents('sunday');
      expect(result).toHaveLength(2);
      expect(result.every((e) => e.name.toLowerCase().includes('sunday'))).toBe(true);
    });

    test('filters by description when provided', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([
        makeEvent({ id: 1, name: 'Event', description: 'youth ministry' }),
        makeEvent({ id: 2, name: 'Other', description: 'adults' }),
      ]);
      const result = await service.searchEvents('youth');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    test('returns empty array when no matches', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([
        makeEvent({ name: 'Sunday Service' }),
      ]);
      const result = await service.searchEvents('nonexistent');
      expect(result).toEqual([]);
    });
  });

  // ─── isEventNameUnique ─────────────────────────────────────────────────────

  describe('isEventNameUnique', () => {
    test('returns true when name does not exist', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([
        makeEvent({ id: 1, name: 'Sunday Service' }),
      ]);
      const result = await service.isEventNameUnique('Prayer Meeting');
      expect(result).toBe(true);
    });

    test('returns false when name already exists', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([
        makeEvent({ id: 1, name: 'Sunday Service' }),
      ]);
      const result = await service.isEventNameUnique('Sunday Service');
      expect(result).toBe(false);
    });

    test('is case-insensitive for name comparison', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([
        makeEvent({ id: 1, name: 'Sunday Service' }),
      ]);
      const result = await service.isEventNameUnique('sunday service');
      expect(result).toBe(false);
    });

    test('excludes the event with excludeId from the check', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([
        makeEvent({ id: 1, name: 'Sunday Service' }),
      ]);
      // Same name but excluding id 1 (the event being updated)
      const result = await service.isEventNameUnique('Sunday Service', 1);
      expect(result).toBe(true);
    });
  });

  // ─── getEventsWithRecentActivity ───────────────────────────────────────────

  describe('getEventsWithRecentActivity', () => {
    test('delegates to getActiveEvents', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([
        makeEvent({ isActive: true }),
        makeEvent({ id: 2, isActive: false }),
      ]);
      const result = await service.getEventsWithRecentActivity();
      expect(result.every((e) => e.isActive)).toBe(true);
    });
  });
});
