/**
 * Unit tests for useAttendance hooks
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { NotificationProvider } from '../contexts/NotificationContext';

// ─── Hoist mock functions ─────────────────────────────────────────────────────
const { mockShowNotification } = vi.hoisted(() => ({
  mockShowNotification: vi.fn(),
}));

vi.mock('./useNotification', () => ({
  useNotification: () => ({
    showNotification: mockShowNotification,
    showSuccess: vi.fn(),
    showError: vi.fn(),
  }),
}));

// ─── Mock attendanceService ───────────────────────────────────────────────────
const {
  mockGetAttendanceRecords,
  mockGetAttendanceGridData,
  mockGetRecentAttendance,
  mockCreateAttendanceRecord,
  mockUpdateAttendanceRecord,
  mockDeleteAttendanceRecord,
  mockCheckDuplicateAttendance,
} = vi.hoisted(() => ({
  mockGetAttendanceRecords: vi.fn(),
  mockGetAttendanceGridData: vi.fn(),
  mockGetRecentAttendance: vi.fn(),
  mockCreateAttendanceRecord: vi.fn(),
  mockUpdateAttendanceRecord: vi.fn(),
  mockDeleteAttendanceRecord: vi.fn(),
  mockCheckDuplicateAttendance: vi.fn().mockResolvedValue(false),
}));

vi.mock('../services/attendanceService', () => ({
  attendanceService: {
    getAttendanceRecords: mockGetAttendanceRecords,
    getAttendanceGridData: mockGetAttendanceGridData,
    getRecentAttendance: mockGetRecentAttendance,
    createAttendanceRecord: mockCreateAttendanceRecord,
    updateAttendanceRecord: mockUpdateAttendanceRecord,
    deleteAttendanceRecord: mockDeleteAttendanceRecord,
    checkDuplicateAttendance: mockCheckDuplicateAttendance,
  },
}));

// ─── Mock eventService ────────────────────────────────────────────────────────
const { mockGetEvents, mockGetActiveEvents, mockGetAnalysisEvents, mockCreateEvent, mockUpdateEvent, mockIsEventNameUnique } =
  vi.hoisted(() => ({
    mockGetEvents: vi.fn(),
    mockGetActiveEvents: vi.fn(),
    mockGetAnalysisEvents: vi.fn(),
    mockCreateEvent: vi.fn(),
    mockUpdateEvent: vi.fn(),
    mockIsEventNameUnique: vi.fn().mockResolvedValue(true),
  }));

vi.mock('../services/eventService', () => ({
  eventService: {
    getEvents: mockGetEvents,
    getActiveEvents: mockGetActiveEvents,
    getAnalysisEvents: mockGetAnalysisEvents,
    createEvent: mockCreateEvent,
    updateEvent: mockUpdateEvent,
    isEventNameUnique: mockIsEventNameUnique,
  },
}));

// ─── Mock attendanceAnalyticsService ─────────────────────────────────────────
const {
  mockGetEventAnalytics,
  mockGetAllEventsAnalytics,
  mockGetDashboardWidgetData,
  mockGetEventMonthlyAnalytics,
  mockEmailEventAnalytics,
  mockEmailAllEventsAnalytics,
} = vi.hoisted(() => ({
  mockGetEventAnalytics: vi.fn(),
  mockGetAllEventsAnalytics: vi.fn(),
  mockGetDashboardWidgetData: vi.fn(),
  mockGetEventMonthlyAnalytics: vi.fn(),
  mockEmailEventAnalytics: vi.fn(),
  mockEmailAllEventsAnalytics: vi.fn(),
}));

vi.mock('../services/attendanceAnalyticsService', () => ({
  attendanceAnalyticsService: {
    getEventAnalytics: mockGetEventAnalytics,
    getAllEventsAnalytics: mockGetAllEventsAnalytics,
    getDashboardWidgetData: mockGetDashboardWidgetData,
    getEventMonthlyAnalytics: mockGetEventMonthlyAnalytics,
    emailEventAnalytics: mockEmailEventAnalytics,
    emailAllEventsAnalytics: mockEmailAllEventsAnalytics,
  },
}));

import {
  useAttendanceRecords,
  useAttendanceGridData,
  useRecentAttendance,
  useCreateAttendance,
  useUpdateAttendance,
  useDeleteAttendance,
  useEvents,
  useActiveEvents,
  useAnalysisEvents,
  useCreateEvent,
  useUpdateEvent,
  useEventAnalytics,
  useAllEventsAnalytics,
  useMonthlyAnalyticsForAllEvents,
  useDashboardWidgetData,
  useEmailEventAnalytics,
  useEmailAllEventsAnalytics,
  useAttendanceValidation,
  useAttendanceManagement,
  useEventManagement,
} from './useAttendance';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>{children}</NotificationProvider>
      </QueryClientProvider>
    );
  };
}

const mockAttendanceRecord = { id: 1, memberId: 10, eventId: 2, date: '2024-01-01', attended: true };
const mockEvent = { id: 2, name: 'Sunday Service', isActive: true };

describe('useAttendanceRecords', () => {
  beforeEach(() => vi.clearAllMocks());

  test('fetches attendance records', async () => {
    mockGetAttendanceRecords.mockResolvedValue([mockAttendanceRecord]);
    const { result } = renderHook(() => useAttendanceRecords(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([mockAttendanceRecord]);
  });

  test('handles empty list', async () => {
    mockGetAttendanceRecords.mockResolvedValue([]);
    const { result } = renderHook(() => useAttendanceRecords(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});

describe('useAttendanceGridData', () => {
  beforeEach(() => vi.clearAllMocks());

  test('fetches grid data with query', async () => {
    const gridData = { items: [mockAttendanceRecord], total: 1 };
    mockGetAttendanceGridData.mockResolvedValue(gridData);
    const query = { page: 1, pageSize: 10, sortBy: 'date', sortDirection: 'asc' as const, filters: {} };
    const { result } = renderHook(() => useAttendanceGridData(query), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGetAttendanceGridData).toHaveBeenCalledWith(query);
  });
});

describe('useRecentAttendance', () => {
  beforeEach(() => vi.clearAllMocks());

  test('fetches recent attendance', async () => {
    mockGetRecentAttendance.mockResolvedValue([mockAttendanceRecord]);
    const { result } = renderHook(() => useRecentAttendance(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([mockAttendanceRecord]);
  });
});

describe('useCreateAttendance', () => {
  beforeEach(() => vi.clearAllMocks());

  test('creates attendance record and shows success', async () => {
    mockCreateAttendanceRecord.mockResolvedValue(mockAttendanceRecord);
    const { result } = renderHook(() => useCreateAttendance(), { wrapper: createWrapper() });
    await act(async () => {
      result.current.mutate({ eventId: 2, date: '2024-01-01', attendance: 10 });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockShowNotification).toHaveBeenCalledWith('Attendance record created successfully', 'success');
  });

  test('shows error on create failure', async () => {
    mockCreateAttendanceRecord.mockRejectedValue(new Error('Server error'));
    const { result } = renderHook(() => useCreateAttendance(), { wrapper: createWrapper() });
    await act(async () => {
      result.current.mutate({ eventId: 2, date: '2024-01-01', attendance: 10 });
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockShowNotification).toHaveBeenCalledWith(expect.any(String), 'error');
  });
});

describe('useUpdateAttendance', () => {
  beforeEach(() => vi.clearAllMocks());

  test('updates attendance record and shows success', async () => {
    mockUpdateAttendanceRecord.mockResolvedValue(mockAttendanceRecord);
    const { result } = renderHook(() => useUpdateAttendance(), { wrapper: createWrapper() });
    await act(async () => {
      result.current.mutate({ id: 1, eventId: 2, date: '2024-01-01', attendance: 0 });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockShowNotification).toHaveBeenCalledWith('Attendance record updated successfully', 'success');
  });

  test('shows error on update failure', async () => {
    mockUpdateAttendanceRecord.mockRejectedValue(new Error('Not found'));
    const { result } = renderHook(() => useUpdateAttendance(), { wrapper: createWrapper() });
    await act(async () => {
      result.current.mutate({ id: 99, eventId: 2, date: '2024-01-01', attendance: 0 });
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockShowNotification).toHaveBeenCalledWith(expect.any(String), 'error');
  });
});

describe('useDeleteAttendance', () => {
  beforeEach(() => vi.clearAllMocks());

  test('deletes attendance record and shows success', async () => {
    mockDeleteAttendanceRecord.mockResolvedValue(undefined);
    const { result } = renderHook(() => useDeleteAttendance(), { wrapper: createWrapper() });
    await act(async () => {
      result.current.mutate(1);
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockShowNotification).toHaveBeenCalledWith('Attendance record deleted successfully', 'success');
  });

  test('shows error on delete failure', async () => {
    mockDeleteAttendanceRecord.mockRejectedValue(new Error('Not found'));
    const { result } = renderHook(() => useDeleteAttendance(), { wrapper: createWrapper() });
    await act(async () => {
      result.current.mutate(99);
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockShowNotification).toHaveBeenCalledWith(expect.any(String), 'error');
  });
});

describe('useEvents', () => {
  beforeEach(() => vi.clearAllMocks());

  test('fetches events list', async () => {
    mockGetEvents.mockResolvedValue([mockEvent]);
    const { result } = renderHook(() => useEvents(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([mockEvent]);
  });
});

describe('useActiveEvents', () => {
  beforeEach(() => vi.clearAllMocks());

  test('fetches active events', async () => {
    mockGetActiveEvents.mockResolvedValue([mockEvent]);
    const { result } = renderHook(() => useActiveEvents(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([mockEvent]);
  });
});

describe('useCreateEvent', () => {
  beforeEach(() => vi.clearAllMocks());

  test('creates event and shows success', async () => {
    mockCreateEvent.mockResolvedValue(mockEvent);
    const { result } = renderHook(() => useCreateEvent(), { wrapper: createWrapper() });
    await act(async () => {
      result.current.mutate({ name: 'Sunday Service', isActive: true, showInAnalysis: false });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockShowNotification).toHaveBeenCalledWith('Event created successfully', 'success');
  });

  test('shows error on create event failure', async () => {
    mockCreateEvent.mockRejectedValue(new Error('Conflict'));
    const { result } = renderHook(() => useCreateEvent(), { wrapper: createWrapper() });
    await act(async () => {
      result.current.mutate({ name: 'Duplicate', isActive: true, showInAnalysis: false });
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockShowNotification).toHaveBeenCalledWith(expect.any(String), 'error');
  });
});

describe('useUpdateEvent', () => {
  beforeEach(() => vi.clearAllMocks());

  test('updates event and shows success', async () => {
    mockUpdateEvent.mockResolvedValue({ ...mockEvent, name: 'Updated' });
    const { result } = renderHook(() => useUpdateEvent(), { wrapper: createWrapper() });
    await act(async () => {
      result.current.mutate({ id: 2, name: 'Updated', isActive: true, showInAnalysis: false });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockShowNotification).toHaveBeenCalledWith('Event updated successfully', 'success');
  });
});

describe('useEventAnalytics', () => {
  beforeEach(() => vi.clearAllMocks());

  test('fetches event analytics when eventId provided', async () => {
    const analytics = { eventId: 2, totalAttendance: 100 };
    mockGetEventAnalytics.mockResolvedValue(analytics);
    const { result } = renderHook(() => useEventAnalytics(2), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(analytics);
  });

  test('does not fetch analytics when eventId is undefined', () => {
    const { result } = renderHook(() => useEventAnalytics(undefined), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockGetEventAnalytics).not.toHaveBeenCalled();
  });
});

describe('useAllEventsAnalytics', () => {
  beforeEach(() => vi.clearAllMocks());

  test('fetches analytics for all events', async () => {
    mockGetAllEventsAnalytics.mockResolvedValue([{ eventId: 2, totalAttendance: 50 }]);
    const { result } = renderHook(() => useAllEventsAnalytics(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });
});

describe('useDashboardWidgetData', () => {
  beforeEach(() => vi.clearAllMocks());

  test('fetches dashboard widget data', async () => {
    const widgetData = { totalAttendance: 200, recentMonths: [] };
    mockGetDashboardWidgetData.mockResolvedValue(widgetData);
    const { result } = renderHook(() => useDashboardWidgetData(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(widgetData);
  });
});

describe('useAnalysisEvents', () => {
  beforeEach(() => vi.clearAllMocks());

  test('fetches analysis events', async () => {
    mockGetAnalysisEvents.mockResolvedValue([{ id: 5, name: 'Analysis Event' }]);
    const { result } = renderHook(() => useAnalysisEvents(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });
});

describe('useMonthlyAnalyticsForAllEvents', () => {
  beforeEach(() => vi.clearAllMocks());

  test('fetches monthly analytics for all events', async () => {
    mockGetAnalysisEvents.mockResolvedValue([{ id: 1, name: 'Event' }]);
    mockGetEventMonthlyAnalytics.mockResolvedValue([{ month: 'Jan', total: 10 }]);
    const { result } = renderHook(() => useMonthlyAnalyticsForAllEvents(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(Array.isArray(result.current.data)).toBe(true);
  });

  test('returns empty array when no analysis events', async () => {
    mockGetAnalysisEvents.mockResolvedValue([]);
    const { result } = renderHook(() => useMonthlyAnalyticsForAllEvents(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});

describe('useEmailEventAnalytics', () => {
  beforeEach(() => vi.clearAllMocks());

  test('calls emailEventAnalytics on mutate', async () => {
    mockEmailEventAnalytics.mockResolvedValue({ success: true });
    const { result } = renderHook(() => useEmailEventAnalytics(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({ email: 'test@example.com', eventId: 2 });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockEmailEventAnalytics).toHaveBeenCalledWith('test@example.com', 2, undefined);
    expect(mockShowNotification).toHaveBeenCalledWith('Analytics email sent successfully', 'success');
  });

  test('shows error notification on failure', async () => {
    mockEmailEventAnalytics.mockRejectedValue(new Error('Email failed'));
    const { result } = renderHook(() => useEmailEventAnalytics(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({ email: 'test@example.com', eventId: 2 });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockShowNotification).toHaveBeenCalledWith(expect.any(String), 'error');
  });
});

describe('useEmailAllEventsAnalytics', () => {
  beforeEach(() => vi.clearAllMocks());

  test('calls emailAllEventsAnalytics on mutate', async () => {
    mockEmailAllEventsAnalytics.mockResolvedValue({ success: true });
    const { result } = renderHook(() => useEmailAllEventsAnalytics(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate('test@example.com');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockEmailAllEventsAnalytics).toHaveBeenCalledWith('test@example.com');
    expect(mockShowNotification).toHaveBeenCalledWith('All events analytics email sent successfully', 'success');
  });

  test('shows error notification on failure', async () => {
    mockEmailAllEventsAnalytics.mockRejectedValue(new Error('Failed'));
    const { result } = renderHook(() => useEmailAllEventsAnalytics(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate('test@example.com');
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockShowNotification).toHaveBeenCalledWith(expect.any(String), 'error');
  });
});

describe('useAttendanceValidation', () => {
  beforeEach(() => vi.clearAllMocks());

  test('returns checkDuplicate and validateEventName functions', () => {
    const { result } = renderHook(() => useAttendanceValidation(), { wrapper: createWrapper() });
    expect(typeof result.current.checkDuplicate).toBe('function');
    expect(typeof result.current.validateEventName).toBe('function');
  });

  test('checkDuplicate calls attendanceService.checkDuplicateAttendance', async () => {
    mockCheckDuplicateAttendance.mockResolvedValue(true);
    const { result } = renderHook(() => useAttendanceValidation(), { wrapper: createWrapper() });
    const isDuplicate = await result.current.checkDuplicate(1, '2024-01-01');
    expect(isDuplicate).toBe(true);
    expect(mockCheckDuplicateAttendance).toHaveBeenCalledWith(1, '2024-01-01');
  });

  test('validateEventName calls eventService.isEventNameUnique', async () => {
    mockIsEventNameUnique.mockResolvedValue(false);
    const { result } = renderHook(() => useAttendanceValidation(), { wrapper: createWrapper() });
    const isUnique = await result.current.validateEventName('Test Event', 2);
    expect(isUnique).toBe(false);
    expect(mockIsEventNameUnique).toHaveBeenCalledWith('Test Event', 2);
  });
});

describe('useAttendanceManagement', () => {
  test('exposes combined attendance CRUD operations', () => {
    const { result } = renderHook(() => useAttendanceManagement(), { wrapper: createWrapper() });
    expect(typeof result.current.createAttendance).toBe('function');
    expect(typeof result.current.updateAttendance).toBe('function');
    expect(typeof result.current.deleteAttendance).toBe('function');
    expect(typeof result.current.checkDuplicate).toBe('function');
    expect(typeof result.current.isCreating).toBe('boolean');
    expect(typeof result.current.isUpdating).toBe('boolean');
    expect(typeof result.current.isDeleting).toBe('boolean');
  });
});

describe('useEventManagement', () => {
  test('exposes combined event CRUD operations', () => {
    const { result } = renderHook(() => useEventManagement(), { wrapper: createWrapper() });
    expect(typeof result.current.createEvent).toBe('function');
    expect(typeof result.current.updateEvent).toBe('function');
    expect(typeof result.current.validateEventName).toBe('function');
    expect(typeof result.current.isCreating).toBe('boolean');
    expect(typeof result.current.isUpdating).toBe('boolean');
  });
});
