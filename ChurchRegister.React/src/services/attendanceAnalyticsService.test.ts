import { describe, test, expect, beforeEach } from 'vitest';
import { AttendanceAnalyticsService } from './attendanceAnalyticsService';
import type { AttendanceAnalyticsResponse, AttendanceRecord, ChartDataPoint } from './attendanceService';

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
