import { describe, test, expect, beforeEach, vi } from 'vitest';
import { AttendanceAnalyticsService } from './attendanceAnalyticsService';
import type { AttendanceAnalyticsResponse, AttendanceRecord, ChartDataPoint } from './attendanceService';

// ─── Mocks for async methods ──────────────────────────────────────────────────
const {
  mockGetAttendanceAnalytics,
  mockGetRecentAttendance,
  mockEmailAttendanceAnalytics,
  mockGetAttendanceRecords,
} = vi.hoisted(() => ({
  mockGetAttendanceAnalytics: vi.fn(),
  mockGetRecentAttendance: vi.fn(),
  mockEmailAttendanceAnalytics: vi.fn(),
  mockGetAttendanceRecords: vi.fn(),
}));

vi.mock('./attendanceService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./attendanceService')>();
  return {
    ...actual,
    attendanceService: {
      getAttendanceAnalytics: mockGetAttendanceAnalytics,
      getRecentAttendance: mockGetRecentAttendance,
      emailAttendanceAnalytics: mockEmailAttendanceAnalytics,
      getAttendanceRecords: mockGetAttendanceRecords,
    },
  };
});

const { mockGetEvents, mockGetActiveEvents, mockGetAnalysisEvents } = vi.hoisted(() => ({
  mockGetEvents: vi.fn(),
  mockGetActiveEvents: vi.fn(),
  mockGetAnalysisEvents: vi.fn(),
}));

vi.mock('./eventService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./eventService')>();
  return {
    ...actual,
    eventService: {
      getEvents: mockGetEvents,
      getActiveEvents: mockGetActiveEvents,
      getAnalysisEvents: mockGetAnalysisEvents,
    },
  };
});

describe('AttendanceAnalyticsService – pure methods', () => {
  let service: AttendanceAnalyticsService;

  beforeEach(() => {
    service = new AttendanceAnalyticsService();
  });

  // ─── transformDataForChart ────────────────────────────────────────────────

  describe('transformDataForChart', () => {
    const makeAnalytics = (dataPoints: ChartDataPoint[]): AttendanceAnalyticsResponse => ({
      eventId: 1,
      eventName: 'Sunday Service',
      statistics: {
        totalRecords: dataPoints.length,
        averageAttendance: 100,
        highestAttendance: 150,
        lowestAttendance: 50,
        currentMonthAverage: 100,
        previousMonthAverage: 95,
        percentageChange: 5.3,
      },
      monthlyData: [],
      recentRecords: [],
      dataPoints,
    });

    test('returns empty array for no data points', () => {
      const result = service.transformDataForChart(makeAnalytics([]));
      expect(result).toEqual([]);
    });

    test('maps single data point to chart format with formattedDate', () => {
      const analytics = makeAnalytics([{ date: '2024-01-15', attendance: 120 }]);
      const result = service.transformDataForChart(analytics);
      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2024-01-15');
      expect(result[0].attendance).toBe(120);
      expect((result[0] as unknown as Record<string, unknown>)['formattedDate']).toBeTruthy();
      expect(typeof (result[0] as unknown as Record<string, unknown>)['formattedDate']).toBe('string');
    });

    test('maps multiple data points preserving order', () => {
      const dataPoints: ChartDataPoint[] = [
        { date: '2024-01-01', attendance: 100 },
        { date: '2024-02-01', attendance: 150 },
        { date: '2024-03-01', attendance: 80 },
      ];
      const result = service.transformDataForChart(makeAnalytics(dataPoints));
      expect(result).toHaveLength(3);
      expect(result[0].attendance).toBe(100);
      expect(result[1].attendance).toBe(150);
      expect(result[2].attendance).toBe(80);
    });

    test('preserves monthYear when provided', () => {
      const analytics = makeAnalytics([
        { date: '2024-06-15', attendance: 90, monthYear: 'Jun 2024' },
      ]);
      const result = service.transformDataForChart(analytics);
      expect(result[0].monthYear).toBe('Jun 2024');
    });

    test('formattedDate contains month name and day', () => {
      const analytics = makeAnalytics([{ date: '2024-06-15', attendance: 90 }]);
      const result = service.transformDataForChart(analytics);
      // Should be in "Jun 15" or similar locale short format
      expect((result[0] as unknown as Record<string, unknown>)['formattedDate']).toMatch(/Jun|15|2024/);
    });
  });

  // ─── aggregateDataByMonth ─────────────────────────────────────────────────

  describe('aggregateDataByMonth', () => {
    test('returns empty array for empty input', () => {
      expect(service.aggregateDataByMonth([])).toEqual([]);
    });

    test('returns empty array for null-ish input', () => {
      expect(service.aggregateDataByMonth(null as unknown as [])).toEqual([]);
    });

    test('aggregates single data point into one month', () => {
      const result = service.aggregateDataByMonth([
        { date: '2024-01-15', attendance: 100, monthYear: 'Jan 2024' },
      ]);
      expect(result).toHaveLength(1);
      expect(result[0].month).toBe('Jan');
      expect(result[0].averageAttendance).toBe(100);
      expect(result[0].recordCount).toBe(1);
    });

    test('averages multiple records in the same month', () => {
      const result = service.aggregateDataByMonth([
        { date: '2024-01-05', attendance: 100, monthYear: 'Jan 2024' },
        { date: '2024-01-12', attendance: 200, monthYear: 'Jan 2024' },
      ]);
      expect(result).toHaveLength(1);
      expect(result[0].averageAttendance).toBe(150); // Math.round(300/2)
      expect(result[0].recordCount).toBe(2);
    });

    test('separates records from different months', () => {
      const result = service.aggregateDataByMonth([
        { date: '2024-01-15', attendance: 100, monthYear: 'Jan 2024' },
        { date: '2024-02-15', attendance: 200, monthYear: 'Feb 2024' },
        { date: '2024-03-15', attendance: 150, monthYear: 'Mar 2024' },
      ]);
      expect(result).toHaveLength(3);
    });

    test('returns months sorted most-recent-first', () => {
      const result = service.aggregateDataByMonth([
        { date: '2024-01-15', attendance: 100, monthYear: 'Jan 2024' },
        { date: '2024-03-15', attendance: 150, monthYear: 'Mar 2024' },
        { date: '2024-02-15', attendance: 200, monthYear: 'Feb 2024' },
      ]);
      // Most recent first: Mar > Feb > Jan
      expect(result[0].month).toBe('Mar');
      expect(result[result.length - 1].month).toBe('Jan');
    });

    test('contains correct monthYear string', () => {
      const result = service.aggregateDataByMonth([
        { date: '2024-06-10', attendance: 80, monthYear: 'Jun 2024' },
      ]);
      expect(result[0].monthYear).toBe('Jun 2024');
    });

    test('contains correct monthIndex (0-based)', () => {
      const result = service.aggregateDataByMonth([
        { date: '2024-06-10', attendance: 80, monthYear: 'Jun 2024' },
      ]);
      expect(result[0].monthIndex).toBe(5); // June is month index 5
    });
  });

  // ─── calculateTrends ──────────────────────────────────────────────────────

  describe('calculateTrends', () => {
    const makeRecord = (date: string, attendance: number): AttendanceRecord => ({
      id: 1,
      eventId: 1,
      eventName: 'Service',
      date,
      attendance,
      createdBy: 'admin',
      recordedByName: 'Admin',
      createdDateTime: date,
    });

    test('returns empty monthly array for no records', () => {
      const result = service.calculateTrends([]);
      expect(result.monthly).toEqual([]);
      expect(result.overall.direction).toBe('stable');
      expect(result.overall.percentage).toBe(0);
    });

    test('single record returns one monthly entry', () => {
      const result = service.calculateTrends([makeRecord('2024-01-15', 100)]);
      expect(result.monthly).toHaveLength(1);
      expect(result.monthly[0].average).toBe(100);
      expect(result.monthly[0].count).toBe(1);
      expect(result.monthly[0].total).toBe(100);
    });

    test('groups records from the same month together', () => {
      const result = service.calculateTrends([
        makeRecord('2024-01-05', 100),
        makeRecord('2024-01-20', 200),
      ]);
      expect(result.monthly).toHaveLength(1);
      expect(result.monthly[0].average).toBe(150);
      expect(result.monthly[0].count).toBe(2);
    });

    test('stable trend when fewer than 2 months of data', () => {
      const result = service.calculateTrends([makeRecord('2024-01-15', 100)]);
      expect(result.overall.direction).toBe('stable');
    });

    test('detects upward trend when second half average is higher', () => {
      // First half: Jan-Mar avg ~50, Second half: Apr-Jun avg ~200
      const records = [
        makeRecord('2024-01-15', 50),
        makeRecord('2024-02-15', 50),
        makeRecord('2024-03-15', 50),
        makeRecord('2024-04-15', 200),
        makeRecord('2024-05-15', 200),
        makeRecord('2024-06-15', 200),
      ];
      const result = service.calculateTrends(records);
      expect(result.overall.direction).toBe('up');
      expect(result.overall.percentage).toBeGreaterThan(5);
    });

    test('detects downward trend when second half average is lower', () => {
      const records = [
        makeRecord('2024-01-15', 200),
        makeRecord('2024-02-15', 200),
        makeRecord('2024-03-15', 200),
        makeRecord('2024-04-15', 50),
        makeRecord('2024-05-15', 50),
        makeRecord('2024-06-15', 50),
      ];
      const result = service.calculateTrends(records);
      expect(result.overall.direction).toBe('down');
    });

    test('monthly entry contains month label string', () => {
      const result = service.calculateTrends([makeRecord('2024-06-15', 100)]);
      expect(result.monthly[0].month).toMatch(/Jun|2024/);
    });
  });

  // ─── exportToFormat ───────────────────────────────────────────────────────

  describe('exportToFormat', () => {
    const sampleAnalytics: AttendanceAnalyticsResponse = {
      eventId: 1,
      eventName: 'Sunday Service',
      statistics: {
        totalRecords: 2,
        averageAttendance: 110,
        highestAttendance: 120,
        lowestAttendance: 100,
        currentMonthAverage: 110,
        previousMonthAverage: 100,
        percentageChange: 10,
      },
      monthlyData: [],
      recentRecords: [],
      dataPoints: [
        { date: '2024-01-07', attendance: 100 },
        { date: '2024-01-14', attendance: 120 },
      ],
    };

    test('csv format has correct header row', () => {
      const result = service.exportToFormat(sampleAnalytics, 'csv');
      const lines = result.split('\n');
      expect(lines[0]).toBe('Date,Event,Attendance');
    });

    test('csv format includes one row per data point', () => {
      const result = service.exportToFormat(sampleAnalytics, 'csv');
      const lines = result.split('\n');
      expect(lines).toHaveLength(3); // header + 2 data rows
    });

    test('csv rows contain correct values', () => {
      const result = service.exportToFormat(sampleAnalytics, 'csv');
      expect(result).toContain('2024-01-07');
      expect(result).toContain('Sunday Service');
      expect(result).toContain('100');
      expect(result).toContain('120');
    });

    test('json format returns valid JSON', () => {
      const result = service.exportToFormat(sampleAnalytics, 'json');
      expect(() => JSON.parse(result)).not.toThrow();
    });

    test('json format contains event data', () => {
      const result = service.exportToFormat(sampleAnalytics, 'json');
      const parsed = JSON.parse(result);
      expect(parsed.eventId).toBe(1);
      expect(parsed.eventName).toBe('Sunday Service');
    });

    test('csv with empty dataPoints returns just the header', () => {
      const emptyAnalytics = { ...sampleAnalytics, dataPoints: [] };
      const result = service.exportToFormat(emptyAnalytics, 'csv');
      const lines = result.split('\n').filter(Boolean);
      expect(lines).toHaveLength(1);
      expect(lines[0]).toBe('Date,Event,Attendance');
    });
  });
});

// ─── Async API-calling methods ────────────────────────────────────────────────
const makeAnalytics = (
  eventId = 1,
  eventName = 'Sunday Service',
  dataPoints: ChartDataPoint[] = []
): AttendanceAnalyticsResponse => ({
  eventId,
  eventName,
  statistics: {
    totalRecords: dataPoints.length,
    averageAttendance: 100,
    highestAttendance: 150,
    lowestAttendance: 50,
    currentMonthAverage: 100,
    previousMonthAverage: 95,
    percentageChange: 5.3,
  },
  monthlyData: [],
  recentRecords: [],
  dataPoints,
});

const currentDate = new Date();
const currentYear = currentDate.getFullYear();
const currentMonth = currentDate.getMonth();
const thisMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-15`;
const prevMonthNum = currentMonth === 0 ? 12 : currentMonth;
const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
const prevMonthStr = `${prevYear}-${String(prevMonthNum).padStart(2, '0')}-10`;

const mockRecentEntries: AttendanceRecord[] = [
  { id: 1, eventId: 2, date: thisMonthStr, attendance: 80, eventName: 'Sunday Service', createdBy: 'admin', recordedByName: 'Admin', createdDateTime: thisMonthStr },
  { id: 2, eventId: 2, date: thisMonthStr, attendance: 100, eventName: 'Sunday Service', createdBy: 'admin', recordedByName: 'Admin', createdDateTime: thisMonthStr },
  { id: 3, eventId: 3, date: prevMonthStr, attendance: 60, eventName: 'Prayer', createdBy: 'admin', recordedByName: 'Admin', createdDateTime: prevMonthStr },
];

describe('AttendanceAnalyticsService – async methods', () => {
  let service: AttendanceAnalyticsService;

  beforeEach(() => {
    service = new AttendanceAnalyticsService();
    vi.clearAllMocks();
  });

  describe('getEventAnalytics', () => {
    test('returns analytics from attendanceService', async () => {
      const analytics = makeAnalytics(1, 'Sunday Service', [{ date: '2024-01-01', attendance: 100 }]);
      mockGetAttendanceAnalytics.mockResolvedValue(analytics);

      const result = await service.getEventAnalytics(1);
      expect(result).toEqual(analytics);
      expect(mockGetAttendanceAnalytics).toHaveBeenCalledWith(1);
    });

    test('propagates errors from attendanceService', async () => {
      mockGetAttendanceAnalytics.mockRejectedValue(new Error('Not found'));
      await expect(service.getEventAnalytics(999)).rejects.toThrow('Not found');
    });
  });

  describe('getAllEventsAnalytics', () => {
    test('fetches analytics for all analysis events', async () => {
      const events = [{ id: 1, name: 'Sunday Service', isActive: true }, { id: 2, name: 'Prayer', isActive: true }];
      mockGetAnalysisEvents.mockResolvedValue(events);
      mockGetAttendanceAnalytics
        .mockResolvedValueOnce(makeAnalytics(1, 'Sunday Service'))
        .mockResolvedValueOnce(makeAnalytics(2, 'Prayer'));

      const results = await service.getAllEventsAnalytics();
      expect(results).toHaveLength(2);
      expect(mockGetAnalysisEvents).toHaveBeenCalledOnce();
      expect(mockGetAttendanceAnalytics).toHaveBeenCalledTimes(2);
    });

    test('returns empty array when no analysis events', async () => {
      mockGetAnalysisEvents.mockResolvedValue([]);
      const results = await service.getAllEventsAnalytics();
      expect(results).toEqual([]);
    });
  });

  describe('getEventMonthlyAnalytics', () => {
    test('returns monthly analytics for an event', async () => {
      const dp = [
        { date: '2024-01-15', attendance: 100 },
        { date: '2024-02-10', attendance: 120 },
      ];
      mockGetAttendanceAnalytics.mockResolvedValue(makeAnalytics(1, 'Sunday Service', dp));

      const result = await service.getEventMonthlyAnalytics(1);
      expect(result.eventId).toBe(1);
      expect(result.eventName).toBe('Sunday Service');
      expect(result.monthlyData).toBeDefined();
      expect(result.hasData).toBe(true);
    });

    test('returns hasData false when no data points', async () => {
      mockGetAttendanceAnalytics.mockResolvedValue(makeAnalytics(1, 'Empty', []));
      const result = await service.getEventMonthlyAnalytics(1);
      expect(result.hasData).toBe(false);
      expect(result.totalMonths).toBe(0);
    });
  });

  describe('getDashboardWidgetData', () => {
    test('returns widget data with current month stats', async () => {
      mockGetRecentAttendance.mockResolvedValue(mockRecentEntries);
      mockGetEvents.mockResolvedValue([{ id: 2, name: 'Sunday', isActive: true }, { id: 3, name: 'Prayer', isActive: true }]);

      const result = await service.getDashboardWidgetData();
      expect(result.totalEvents).toBe(2);
      expect(result.totalRecords).toBe(3);
      expect(result.trendDirection).toMatch(/up|down|stable/);
    });

    test('handles empty recent entries', async () => {
      mockGetRecentAttendance.mockResolvedValue([]);
      mockGetEvents.mockResolvedValue([]);

      const result = await service.getDashboardWidgetData();
      expect(result.averageAttendance).toBe(0);
      expect(result.thisMonthRecords).toBe(0);
    });
  });

  describe('emailEventAnalytics', () => {
    test('calls attendanceService.emailAttendanceAnalytics with event request', async () => {
      mockEmailAttendanceAnalytics.mockResolvedValue(undefined);
      await service.emailEventAnalytics('test@example.com', 1);
      expect(mockEmailAttendanceAnalytics).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'test@example.com', eventId: 1 })
      );
    });
  });

  describe('emailAllEventsAnalytics', () => {
    test('calls attendanceService.emailAttendanceAnalytics without eventId', async () => {
      mockEmailAttendanceAnalytics.mockResolvedValue(undefined);
      await service.emailAllEventsAnalytics('all@example.com');
      expect(mockEmailAttendanceAnalytics).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'all@example.com' })
      );
    });
  });

  describe('generatePDFData', () => {
    test('generates PDF data for all analysis events when no IDs specified', async () => {
      const events = [{ id: 1, name: 'Sunday', isActive: true }];
      mockGetAnalysisEvents.mockResolvedValue(events);
      mockGetAttendanceAnalytics.mockResolvedValue(makeAnalytics(1, 'Sunday', [{ date: '2024-01-01', attendance: 80 }]));

      const result = await service.generatePDFData();
      expect(result.events).toHaveLength(1);
      expect(result.analytics).toHaveLength(1);
      expect(result.chartData).toHaveLength(1);
    });

    test('generates PDF data for specific event IDs', async () => {
      const allEvents = [
        { id: 1, name: 'Sunday', isActive: true },
        { id: 2, name: 'Prayer', isActive: true },
      ];
      mockGetEvents.mockResolvedValue(allEvents);
      mockGetAttendanceAnalytics.mockResolvedValue(makeAnalytics(1, 'Sunday'));

      const result = await service.generatePDFData([1]);
      expect(result.events).toHaveLength(1);
      expect(result.events[0].id).toBe(1);
    });
  });

  describe('getEventComparison', () => {
    test('returns sorted comparison data for all active events', async () => {
      const events = [
        { id: 1, name: 'Sunday', isActive: true },
        { id: 2, name: 'Prayer', isActive: true },
      ];
      const records: AttendanceRecord[] = [
        { id: 1, eventId: 1, date: '2024-01-01', attendance: 100, eventName: 'Sunday', createdBy: 'admin', recordedByName: 'Admin', createdDateTime: '2024-01-01' },
        { id: 2, eventId: 2, date: '2024-01-01', attendance: 50, eventName: 'Prayer', createdBy: 'admin', recordedByName: 'Admin', createdDateTime: '2024-01-01' },
      ];
      mockGetActiveEvents.mockResolvedValue(events);
      mockGetAttendanceRecords.mockResolvedValue(records);

      const result = await service.getEventComparison();
      expect(result).toHaveLength(2);
      expect(result[0].averageAttendance).toBeGreaterThanOrEqual(result[1].averageAttendance);
    });

    test('returns lastRecorded as Never when no records for event', async () => {
      const events = [{ id: 1, name: 'New Event', isActive: true }];
      mockGetActiveEvents.mockResolvedValue(events);
      mockGetAttendanceRecords.mockResolvedValue([]);

      const result = await service.getEventComparison();
      expect(result[0].lastRecorded).toBe('Never');
    });
  });

  describe('emailReport', () => {
    test('converts blob to base64 and calls emailAttendanceAnalytics', async () => {
      mockEmailAttendanceAnalytics.mockResolvedValue(undefined);
      const buffer = new ArrayBuffer(8);
      const mockBlob = {
        arrayBuffer: vi.fn().mockResolvedValue(buffer),
        size: 8,
        type: 'application/pdf',
      } as unknown as Blob;

      await service.emailReport({
        period: '2024-Q1',
        reportData: makeAnalytics(1, 'Sunday'),
        pdfAttachment: mockBlob,
      });

      expect(mockEmailAttendanceAnalytics).toHaveBeenCalledWith(
        expect.objectContaining({
          period: '2024-Q1',
          attachmentName: expect.stringContaining('.pdf'),
        })
      );
    });
  });
});
