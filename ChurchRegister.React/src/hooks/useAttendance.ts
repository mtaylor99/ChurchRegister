import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  attendanceService,
  type CreateAttendanceRequest,
  type UpdateAttendanceRequest,
} from '../services/attendanceService';
import {
  eventService,
  type CreateEventRequest,
  type UpdateEventRequest,
} from '../services/eventService';
import { attendanceAnalyticsService } from '../services/attendanceAnalyticsService';
import { useNotification } from './useNotification';
import type {
  AttendanceGridQuery,
  MonthlyAnalyticsResponse,
} from '../types/attendance';

// Query keys for consistent caching
export const attendanceQueryKeys = {
  all: ['attendance'] as const,
  records: () => [...attendanceQueryKeys.all, 'records'] as const,
  gridRecords: (query: AttendanceGridQuery) =>
    [...attendanceQueryKeys.all, 'grid', query] as const,
  events: () => [...attendanceQueryKeys.all, 'events'] as const,
  activeEvents: () => [...attendanceQueryKeys.events(), 'active'] as const,
  analysisEvents: () => [...attendanceQueryKeys.events(), 'analysis'] as const,
  analytics: (eventId: number) =>
    [...attendanceQueryKeys.all, 'analytics', eventId] as const,
  allAnalytics: () => [...attendanceQueryKeys.all, 'analytics', 'all'] as const,
  widgetData: () => [...attendanceQueryKeys.all, 'widget'] as const,
  recentRecords: () => [...attendanceQueryKeys.records(), 'recent'] as const,
};

// Attendance Records Hooks
export function useAttendanceRecords() {
  return useQuery({
    queryKey: attendanceQueryKeys.records(),
    queryFn: () => attendanceService.getAttendanceRecords(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAttendanceGridData(query: AttendanceGridQuery) {
  return useQuery({
    queryKey: attendanceQueryKeys.gridRecords(query),
    queryFn: () => attendanceService.getAttendanceGridData(query),
    staleTime: 2 * 60 * 1000, // 2 minutes for grid data
  });
}

export function useRecentAttendance() {
  return useQuery({
    queryKey: attendanceQueryKeys.recentRecords(),
    queryFn: () => attendanceService.getRecentAttendance(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useCreateAttendance() {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  return useMutation({
    mutationFn: (request: CreateAttendanceRequest) =>
      attendanceService.createAttendanceRecord(request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: attendanceQueryKeys.records(),
      });
      queryClient.invalidateQueries({
        queryKey: [...attendanceQueryKeys.all, 'grid'],
      });
      queryClient.invalidateQueries({
        queryKey: attendanceQueryKeys.widgetData(),
      });
      showNotification('Attendance record created successfully', 'success');
    },
    onError: (error: Error) => {
      showNotification(
        `Failed to create attendance record: ${error.message}`,
        'error'
      );
    },
  });
}

export function useUpdateAttendance() {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  return useMutation({
    mutationFn: (request: UpdateAttendanceRequest) =>
      attendanceService.updateAttendanceRecord(request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: attendanceQueryKeys.records(),
      });
      queryClient.invalidateQueries({
        queryKey: [...attendanceQueryKeys.all, 'grid'],
      });
      queryClient.invalidateQueries({
        queryKey: attendanceQueryKeys.widgetData(),
      });
      showNotification('Attendance record updated successfully', 'success');
    },
    onError: (error: Error) => {
      showNotification(
        `Failed to update attendance record: ${error.message}`,
        'error'
      );
    },
  });
}

export function useDeleteAttendance() {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  return useMutation({
    mutationFn: (id: number) => attendanceService.deleteAttendanceRecord(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: attendanceQueryKeys.records(),
      });
      queryClient.invalidateQueries({
        queryKey: [...attendanceQueryKeys.all, 'grid'],
      });
      queryClient.invalidateQueries({
        queryKey: attendanceQueryKeys.widgetData(),
      });
      showNotification('Attendance record deleted successfully', 'success');
    },
    onError: (error: Error) => {
      showNotification(
        `Failed to delete attendance record: ${error.message}`,
        'error'
      );
    },
  });
}

// Event Management Hooks
export function useEvents() {
  return useQuery({
    queryKey: attendanceQueryKeys.events(),
    queryFn: () => eventService.getEvents(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useActiveEvents() {
  return useQuery({
    queryKey: attendanceQueryKeys.activeEvents(),
    queryFn: () => eventService.getActiveEvents(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useAnalysisEvents() {
  return useQuery({
    queryKey: attendanceQueryKeys.analysisEvents(),
    queryFn: () => eventService.getAnalysisEvents(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  return useMutation({
    mutationFn: (request: CreateEventRequest) =>
      eventService.createEvent(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceQueryKeys.events() });
      showNotification('Event created successfully', 'success');
    },
    onError: (error: Error) => {
      showNotification(`Failed to create event: ${error.message}`, 'error');
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  return useMutation({
    mutationFn: (request: UpdateEventRequest) =>
      eventService.updateEvent(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceQueryKeys.events() });
      showNotification('Event updated successfully', 'success');
    },
    onError: (error: Error) => {
      showNotification(`Failed to update event: ${error.message}`, 'error');
    },
  });
}

// Analytics Hooks
export function useEventAnalytics(eventId: number | undefined) {
  return useQuery({
    queryKey: eventId ? attendanceQueryKeys.analytics(eventId) : [],
    queryFn: () =>
      eventId ? attendanceAnalyticsService.getEventAnalytics(eventId) : null,
    enabled: !!eventId,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

export function useAllEventsAnalytics() {
  return useQuery({
    queryKey: attendanceQueryKeys.allAnalytics(),
    queryFn: () => attendanceAnalyticsService.getAllEventsAnalytics(),
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

export function useMonthlyAnalyticsForAllEvents() {
  return useQuery({
    queryKey: [...attendanceQueryKeys.all, 'monthlyAnalytics'],
    queryFn: async (): Promise<MonthlyAnalyticsResponse[]> => {
      const analysisEvents = await eventService.getAnalysisEvents();
      const monthlyAnalyticsPromises = analysisEvents.map((event) =>
        attendanceAnalyticsService.getEventMonthlyAnalytics(event.id)
      );
      return Promise.all(monthlyAnalyticsPromises);
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

export function useDashboardWidgetData() {
  return useQuery({
    queryKey: attendanceQueryKeys.widgetData(),
    queryFn: () => attendanceAnalyticsService.getDashboardWidgetData(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Email Hooks
export function useEmailEventAnalytics() {
  const { showNotification } = useNotification();

  return useMutation({
    mutationFn: ({
      email,
      eventId,
      chartData,
    }: {
      email: string;
      eventId: number;
      chartData?: import('../services/attendanceService').ChartDataPoint[];
    }) =>
      attendanceAnalyticsService.emailEventAnalytics(email, eventId, chartData),
    onSuccess: () => {
      showNotification('Analytics email sent successfully', 'success');
    },
    onError: (error: Error) => {
      showNotification(
        `Failed to send analytics email: ${error.message}`,
        'error'
      );
    },
  });
}

export function useEmailAllEventsAnalytics() {
  const { showNotification } = useNotification();

  return useMutation({
    mutationFn: (email: string) =>
      attendanceAnalyticsService.emailAllEventsAnalytics(email),
    onSuccess: () => {
      showNotification(
        'All events analytics email sent successfully',
        'success'
      );
    },
    onError: (error: Error) => {
      showNotification(
        `Failed to send analytics email: ${error.message}`,
        'error'
      );
    },
  });
}

// Utility Hooks
export function useAttendanceValidation() {
  return {
    checkDuplicate: async (eventId: number, date: string) => {
      return attendanceService.checkDuplicateAttendance(eventId, date);
    },
    validateEventName: async (name: string, excludeId?: number) => {
      return eventService.isEventNameUnique(name, excludeId);
    },
  };
}

// Combined hooks for complex operations
export function useAttendanceManagement() {
  const createAttendance = useCreateAttendance();
  const updateAttendance = useUpdateAttendance();
  const deleteAttendance = useDeleteAttendance();
  const { checkDuplicate } = useAttendanceValidation();

  return {
    createAttendance: createAttendance.mutate,
    updateAttendance: updateAttendance.mutate,
    deleteAttendance: deleteAttendance.mutate,
    checkDuplicate,
    isCreating: createAttendance.isPending,
    isUpdating: updateAttendance.isPending,
    isDeleting: deleteAttendance.isPending,
  };
}

export function useEventManagement() {
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const { validateEventName } = useAttendanceValidation();

  return {
    createEvent: createEvent.mutate,
    updateEvent: updateEvent.mutate,
    validateEventName,
    isCreating: createEvent.isPending,
    isUpdating: updateEvent.isPending,
  };
}
