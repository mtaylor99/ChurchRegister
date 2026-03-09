/**
 * Unit tests for AttendanceService, EnvelopeContributionService, and RegisterNumberService
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';

// ─── Mock ApiClient ───────────────────────────────────────────────────────────
const { mockGet, mockPost, mockPut, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockPut: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock('./api/ApiClient', () => ({
  apiClient: {
    get: mockGet,
    post: mockPost,
    put: mockPut,
    delete: mockDelete,
  },
}));

import {
  AttendanceService,
  EnvelopeContributionService,
  RegisterNumberService,
  attendanceService,
  envelopeContributionService,
  registerNumberService,
} from './attendanceService';
import type { AttendanceRecord } from './attendanceService';
import type { AttendanceGridQuery } from '../types/attendance';

// ─── Test data helpers ────────────────────────────────────────────────────────
const makeRecord = (overrides: Partial<AttendanceRecord> = {}): AttendanceRecord => ({
  id: 1,
  eventId: 10,
  eventName: 'Sunday Service',
  date: new Date().toISOString().split('T')[0],
  attendance: 45,
  createdBy: 'admin',
  recordedByName: 'Admin User',
  createdDateTime: new Date().toISOString(),
  ...overrides,
});

const makeGridQuery = (overrides: Partial<AttendanceGridQuery> = {}): AttendanceGridQuery => ({
  page: 1,
  pageSize: 10,
  sortBy: 'date',
  sortDirection: 'asc',
  filters: {},
  ...overrides,
});

// ─── AttendanceService ────────────────────────────────────────────────────────
describe('AttendanceService', () => {
  let service: AttendanceService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AttendanceService();
  });

  describe('getAttendanceRecords', () => {
    test('calls apiClient.get with correct path', async () => {
      mockGet.mockResolvedValue([]);
      await service.getAttendanceRecords();
      expect(mockGet).toHaveBeenCalledWith('/api/attendance');
    });

    test('returns records from API', async () => {
      const records = [makeRecord()];
      mockGet.mockResolvedValue(records);
      const result = await service.getAttendanceRecords();
      expect(result).toEqual(records);
    });
  });

  describe('getAttendanceGridData', () => {
    test('returns all records without filters', async () => {
      const records = [makeRecord({ id: 1 }), makeRecord({ id: 2 })];
      mockGet.mockResolvedValue(records);
      const result = await service.getAttendanceGridData(makeGridQuery());
      expect(result.data).toHaveLength(2);
      expect(result.totalCount).toBe(2);
    });

    test('filters by eventTypeId', async () => {
      const records = [
        makeRecord({ id: 1, eventId: 10 }),
        makeRecord({ id: 2, eventId: 20 }),
      ];
      mockGet.mockResolvedValue(records);
      const query = makeGridQuery({ filters: { eventTypeId: '10' } });
      const result = await service.getAttendanceGridData(query);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].eventId).toBe(10);
    });

    test('filters by startDate', async () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      // Use UTC midnight so date string comparison is consistent
      const startDate = new Date(todayStr);
      const records = [
        makeRecord({ id: 1, date: todayStr }),
        makeRecord({ id: 2, date: yesterdayStr }),
      ];
      mockGet.mockResolvedValue(records);
      const query = makeGridQuery({ filters: { startDate } });
      const result = await service.getAttendanceGridData(query);
      expect(result.data).toHaveLength(1);
    });

    test('filters by endDate', async () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const records = [
        makeRecord({ id: 1, date: today.toISOString().split('T')[0] }),
        makeRecord({ id: 2, date: tomorrow.toISOString().split('T')[0] }),
      ];
      mockGet.mockResolvedValue(records);
      const query = makeGridQuery({ filters: { endDate: today } });
      const result = await service.getAttendanceGridData(query);
      expect(result.data).toHaveLength(1);
    });

    test('paginates results correctly', async () => {
      const records = Array.from({ length: 25 }, (_, i) => makeRecord({ id: i + 1 }));
      mockGet.mockResolvedValue(records);
      const query = makeGridQuery({ page: 2, pageSize: 10 });
      const result = await service.getAttendanceGridData(query);
      expect(result.data).toHaveLength(10);
      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(10);
      expect(result.totalCount).toBe(25);
      expect(result.totalPages).toBe(3);
    });

    test('sorts by eventName ascending', async () => {
      const records = [
        makeRecord({ id: 1, eventName: 'Zebra Service' }),
        makeRecord({ id: 2, eventName: 'Alpha Service' }),
      ];
      mockGet.mockResolvedValue(records);
      const query = makeGridQuery({ sortBy: 'eventName', sortDirection: 'asc' });
      const result = await service.getAttendanceGridData(query);
      expect(result.data[0].eventName).toBe('Alpha Service');
      expect(result.data[1].eventName).toBe('Zebra Service');
    });

    test('sorts by eventName descending', async () => {
      const records = [
        makeRecord({ id: 1, eventName: 'Alpha Service' }),
        makeRecord({ id: 2, eventName: 'Zebra Service' }),
      ];
      mockGet.mockResolvedValue(records);
      const query = makeGridQuery({ sortBy: 'eventName', sortDirection: 'desc' });
      const result = await service.getAttendanceGridData(query);
      expect(result.data[0].eventName).toBe('Zebra Service');
    });

    test('sorts by attendance', async () => {
      const records = [
        makeRecord({ id: 1, attendance: 100 }),
        makeRecord({ id: 2, attendance: 10 }),
      ];
      mockGet.mockResolvedValue(records);
      const query = makeGridQuery({ sortBy: 'attendance', sortDirection: 'asc' });
      const result = await service.getAttendanceGridData(query);
      expect(result.data[0].attendance).toBe(10);
    });

    test('sorts by createdBy', async () => {
      const records = [
        makeRecord({ id: 1, createdBy: 'zach' }),
        makeRecord({ id: 2, createdBy: 'alice' }),
      ];
      mockGet.mockResolvedValue(records);
      const query = makeGridQuery({ sortBy: 'createdBy', sortDirection: 'asc' });
      const result = await service.getAttendanceGridData(query);
      expect(result.data[0].createdBy).toBe('alice');
    });

    test('sorts by createdDateTime', async () => {
      const records = [
        makeRecord({ id: 1, createdDateTime: '2024-03-01T10:00:00' }),
        makeRecord({ id: 2, createdDateTime: '2024-01-01T10:00:00' }),
      ];
      mockGet.mockResolvedValue(records);
      const query = makeGridQuery({ sortBy: 'createdDateTime', sortDirection: 'asc' });
      const result = await service.getAttendanceGridData(query);
      expect(result.data[0].id).toBe(2); // earlier date first in asc
    });

    test('uses default date sort for unknown sortBy field', async () => {
      const records = [
        makeRecord({ id: 1, date: '2024-03-01' }),
        makeRecord({ id: 2, date: '2024-01-01' }),
      ];
      mockGet.mockResolvedValue(records);
      const query = makeGridQuery({ sortBy: 'unknown_field', sortDirection: 'asc' });
      const result = await service.getAttendanceGridData(query);
      // Should not throw
      expect(result.data).toHaveLength(2);
    });

    test('returns empty data when no records match filter', async () => {
      mockGet.mockResolvedValue([makeRecord({ eventId: 10 })]);
      const query = makeGridQuery({ filters: { eventTypeId: '999' } });
      const result = await service.getAttendanceGridData(query);
      expect(result.data).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    test('handles empty records array', async () => {
      mockGet.mockResolvedValue([]);
      const result = await service.getAttendanceGridData(makeGridQuery());
      expect(result.data).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expect(result.totalPages).toBe(0);
    });
  });

  describe('createAttendanceRecord', () => {
    test('calls apiClient.post with correct data', async () => {
      mockPost.mockResolvedValue(undefined);
      const request = { eventId: 1, date: '2024-01-15', attendance: 50 };
      await service.createAttendanceRecord(request);
      expect(mockPost).toHaveBeenCalledWith('/api/attendance', request);
    });
  });

  describe('updateAttendanceRecord', () => {
    test('calls apiClient.put with correct URL and data', async () => {
      mockPut.mockResolvedValue(undefined);
      const request = { id: 5, eventId: 1, date: '2024-01-15', attendance: 60 };
      await service.updateAttendanceRecord(request);
      expect(mockPut).toHaveBeenCalledWith('/api/attendance/5', request);
    });
  });

  describe('deleteAttendanceRecord', () => {
    test('calls apiClient.delete with correct URL', async () => {
      mockDelete.mockResolvedValue(undefined);
      await service.deleteAttendanceRecord(7);
      expect(mockDelete).toHaveBeenCalledWith('/api/attendance/7');
    });
  });

  describe('getAttendanceAnalytics', () => {
    test('calls apiClient.get with analytics URL', async () => {
      mockGet.mockResolvedValue({ eventId: 1, dataPoints: [] });
      await service.getAttendanceAnalytics(3);
      expect(mockGet).toHaveBeenCalledWith('/api/attendance/analytics/3');
    });
  });

  describe('emailAttendanceAnalytics', () => {
    test('calls apiClient.post with email request', async () => {
      mockPost.mockResolvedValue(undefined);
      const request = { eventId: 1, email: 'test@example.com' };
      await service.emailAttendanceAnalytics(request);
      expect(mockPost).toHaveBeenCalledWith('/api/attendance/email-analytics', request);
    });
  });

  describe('checkDuplicateAttendance', () => {
    test('returns true when duplicate exists for same event and date', async () => {
      const date = '2024-06-15';
      mockGet.mockResolvedValue([makeRecord({ eventId: 10, date })]);
      const result = await service.checkDuplicateAttendance(10, date);
      expect(result).toBe(true);
    });

    test('returns false when no duplicate exists', async () => {
      mockGet.mockResolvedValue([makeRecord({ eventId: 10, date: '2024-06-15' })]);
      const result = await service.checkDuplicateAttendance(20, '2024-06-15');
      expect(result).toBe(false);
    });

    test('returns false when same event but different date', async () => {
      mockGet.mockResolvedValue([makeRecord({ eventId: 10, date: '2024-06-15' })]);
      const result = await service.checkDuplicateAttendance(10, '2024-07-01');
      expect(result).toBe(false);
    });
  });

  describe('getAttendanceByEvent', () => {
    test('returns only records for specified event', async () => {
      const records = [
        makeRecord({ id: 1, eventId: 10 }),
        makeRecord({ id: 2, eventId: 20 }),
        makeRecord({ id: 3, eventId: 10 }),
      ];
      mockGet.mockResolvedValue(records);
      const result = await service.getAttendanceByEvent(10);
      expect(result).toHaveLength(2);
      expect(result.every((r) => r.eventId === 10)).toBe(true);
    });

    test('returns empty array when no records for event', async () => {
      mockGet.mockResolvedValue([makeRecord({ eventId: 5 })]);
      const result = await service.getAttendanceByEvent(99);
      expect(result).toHaveLength(0);
    });
  });

  describe('getRecentAttendance', () => {
    test('returns records from last 30 days sorted by date descending', async () => {
      const today = new Date();
      const recent = new Date(today);
      recent.setDate(recent.getDate() - 15);
      const old = new Date(today);
      old.setDate(old.getDate() - 45);

      const records = [
        makeRecord({ id: 1, date: recent.toISOString().split('T')[0] }),
        makeRecord({ id: 2, date: old.toISOString().split('T')[0] }),
      ];
      mockGet.mockResolvedValue(records);
      const result = await service.getRecentAttendance();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    test('returns records sorted by date descending', async () => {
      const today = new Date();
      const dates = [5, 10, 2].map((d) => {
        const dt = new Date(today);
        dt.setDate(dt.getDate() - d);
        return dt.toISOString().split('T')[0];
      });
      const records = dates.map((date, i) => makeRecord({ id: i + 1, date }));
      mockGet.mockResolvedValue(records);
      const result = await service.getRecentAttendance();
      // Should be sorted newest first
      expect(new Date(result[0].date) >= new Date(result[1].date)).toBe(true);
    });
  });

  describe('uploadAttendanceTemplate', () => {
    test('calls apiClient.post with FormData and correct URL', async () => {
      mockPost.mockResolvedValue({ success: true, importedCount: 5 });
      const file = new File(['content'], 'template.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      await service.uploadAttendanceTemplate(file);
      expect(mockPost).toHaveBeenCalledWith(
        '/api/attendance/upload-template',
        expect.any(FormData),
        expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } })
      );
    });
  });

  describe('singleton export', () => {
    test('attendanceService is an instance of AttendanceService', () => {
      expect(attendanceService).toBeInstanceOf(AttendanceService);
    });
  });
});

// ─── EnvelopeContributionService ─────────────────────────────────────────────
describe('EnvelopeContributionService', () => {
  let service: EnvelopeContributionService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new EnvelopeContributionService();
  });

  test('submitBatch calls apiClient.post', async () => {
    mockPost.mockResolvedValue({ batchId: 1, total: 100 });
    const request = { year: 2024, envelopes: [] };
    await service.submitBatch(request as unknown as Parameters<typeof service.submitBatch>[0]);
    expect(mockPost).toHaveBeenCalledWith(
      '/api/financial/envelope-contributions/batches',
      request
    );
  });

  test('getBatchList calls apiClient.get with query params', async () => {
    mockGet.mockResolvedValue({ batches: [], totalCount: 0 });
    await service.getBatchList('2024-01-01', '2024-12-31', 1, 20);
    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining('batches')
    );
    const [url] = mockGet.mock.calls[0];
    expect(url).toContain('startDate=2024-01-01');
    expect(url).toContain('endDate=2024-12-31');
    expect(url).toContain('pageNumber=1');
    expect(url).toContain('pageSize=20');
  });

  test('getBatchList without dates omits date params', async () => {
    mockGet.mockResolvedValue({ batches: [], totalCount: 0 });
    await service.getBatchList();
    const [url] = mockGet.mock.calls[0];
    expect(url).not.toContain('startDate');
    expect(url).not.toContain('endDate');
  });

  test('getBatchDetails calls apiClient.get with batch ID', async () => {
    mockGet.mockResolvedValue({ id: 5, envelopes: [] });
    await service.getBatchDetails(5);
    expect(mockGet).toHaveBeenCalledWith(
      '/api/financial/envelope-contributions/batches/5'
    );
  });

  test('validateRegisterNumber calls correct URL', async () => {
    mockGet.mockResolvedValue({ isValid: true });
    await service.validateRegisterNumber(42, 2024);
    expect(mockGet).toHaveBeenCalledWith(
      '/api/financial/envelope-contributions/validate-register-number/42/2024'
    );
  });

  test('validateRegisterNumberForCurrentYear uses current year', async () => {
    mockGet.mockResolvedValue({ isValid: true });
    await service.validateRegisterNumberForCurrentYear(15);
    const [url] = mockGet.mock.calls[0];
    const currentYear = new Date().getFullYear();
    expect(url).toContain(`/validate-register-number/15/${currentYear}`);
  });

  test('envelopeContributionService singleton is correct type', () => {
    expect(envelopeContributionService).toBeInstanceOf(EnvelopeContributionService);
  });
});

// ─── RegisterNumberService ────────────────────────────────────────────────────
describe('RegisterNumberService', () => {
  let service: RegisterNumberService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RegisterNumberService();
  });

  test('generateRegisterNumbers calls apiClient.post', async () => {
    mockPost.mockResolvedValue({ generated: 50 });
    await service.generateRegisterNumbers({ targetYear: 2024, confirmGeneration: true });
    expect(mockPost).toHaveBeenCalledWith(
      '/api/register-numbers/generate',
      { targetYear: 2024, confirmGeneration: true }
    );
  });

  test('previewRegisterNumbers calls apiClient.get with year', async () => {
    mockGet.mockResolvedValue({ preview: [] });
    await service.previewRegisterNumbers(2025);
    expect(mockGet).toHaveBeenCalledWith('/api/register-numbers/preview/2025');
  });

  test('getGenerationStatus calls apiClient.get with year', async () => {
    mockGet.mockResolvedValue({ isGenerated: false, year: 2024 });
    await service.getGenerationStatus(2024);
    expect(mockGet).toHaveBeenCalledWith('/api/register-numbers/status/2024');
  });

  test('generateForCurrentYear uses current year', async () => {
    mockPost.mockResolvedValue({ generated: 50 });
    await service.generateForCurrentYear();
    const [, body] = mockPost.mock.calls[0];
    expect(body.targetYear).toBe(new Date().getFullYear());
  });

  test('previewForCurrentYear uses current year', async () => {
    mockGet.mockResolvedValue({ preview: [] });
    await service.previewForCurrentYear();
    const [url] = mockGet.mock.calls[0];
    expect(url).toContain(new Date().getFullYear().toString());
  });

  test('generateForNextYear uses next year', async () => {
    mockPost.mockResolvedValue({ generated: 50 });
    await service.generateForNextYear();
    const [, body] = mockPost.mock.calls[0];
    expect(body.targetYear).toBe(new Date().getFullYear() + 1);
  });

  test('previewForNextYear uses next year', async () => {
    mockGet.mockResolvedValue({ preview: [] });
    await service.previewForNextYear();
    const [url] = mockGet.mock.calls[0];
    expect(url).toContain((new Date().getFullYear() + 1).toString());
  });

  test('registerNumberService singleton is correct type', () => {
    expect(registerNumberService).toBeInstanceOf(RegisterNumberService);
  });
});
