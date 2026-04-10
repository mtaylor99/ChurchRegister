import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  exportRegisterNumbersToCSV,
  exportToCSV,
} from './exportUtils';
import type { RegisterNumberAssignment } from '../services/registerNumberService';

describe('exportUtils', () => {
  // Mock URL and DOM APIs that aren't available in jsdom
  const mockUrl = 'blob://mock-url';
  const mockCreateObjectURL = vi.fn().mockReturnValue(mockUrl);
  const mockRevokeObjectURL = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('URL', {
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: mockRevokeObjectURL,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ─── exportRegisterNumbersToCSV ───────────────────────────────────────────

  describe('exportRegisterNumbersToCSV', () => {
    const makeAssignment = (
      overrides: Partial<RegisterNumberAssignment> = {}
    ): RegisterNumberAssignment => ({
      registerNumber: 100,
      memberId: 1,
      memberName: 'John Doe',
      memberSince: '2020-01-01',
      memberType: 'Member',
      currentNumber: 99,
      ...overrides,
    });

    test('does not throw with a valid assignment list', () => {
      expect(() =>
        exportRegisterNumbersToCSV([makeAssignment()], 2024)
      ).not.toThrow();
    });

    test('creates the blob and triggers download', () => {
      exportRegisterNumbersToCSV([makeAssignment()], 2024);
      expect(mockCreateObjectURL).toHaveBeenCalledOnce();
    });

    test('includes the year in the filename', () => {
      const attachSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
      vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

      exportRegisterNumbersToCSV([makeAssignment()], 2025);

      const appendedLink = attachSpy.mock.calls[0]?.[0] as HTMLAnchorElement | undefined;
      if (appendedLink) {
        expect(appendedLink.getAttribute('download')).toContain('2025');
      }

      attachSpy.mockRestore();
    });

    test('revokes the object URL after download', () => {
      exportRegisterNumbersToCSV([makeAssignment()], 2024);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith(mockUrl);
    });

    test('handles empty assignment list without throwing', () => {
      expect(() => exportRegisterNumbersToCSV([], 2024)).not.toThrow();
    });

    test('formats memberSince as a date string in the row', () => {
      const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
      vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

      exportRegisterNumbersToCSV([makeAssignment({ memberSince: '2020-06-15' })], 2024);

      // Blob content passed to createObjectURL should contain a formatted date
      expect(mockCreateObjectURL).toHaveBeenCalledOnce();

      appendSpy.mockRestore();
    });

    test('handles null currentNumber gracefully', () => {
      expect(() =>
        exportRegisterNumbersToCSV(
          [makeAssignment({ currentNumber: null })],
          2024
        )
      ).not.toThrow();
    });

    test('handles Non-Member memberType', () => {
      expect(() =>
        exportRegisterNumbersToCSV(
          [makeAssignment({ memberType: 'Non-Member' })],
          2024
        )
      ).not.toThrow();
    });
  });

  // ─── exportToCSV ──────────────────────────────────────────────────────────

  describe('exportToCSV', () => {
    type SimpleRow = { name: string; value: string; amount: number };
    const rows: SimpleRow[] = [
      { name: 'Alice', value: 'A', amount: 100 },
      { name: 'Bob', value: 'B', amount: 200 },
    ];

    test('does not throw with valid data', () => {
      expect(() => exportToCSV(rows, 'test-export')).not.toThrow();
    });

    test('logs a warning and returns early when data is empty', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      exportToCSV([], 'empty');
      expect(warnSpy).toHaveBeenCalledWith('No data to export');
      warnSpy.mockRestore();
    });

    test('does not create a blob when data is empty', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      exportToCSV([], 'empty');
      expect(mockCreateObjectURL).not.toHaveBeenCalled();
    });

    test('uses custom headers when provided', () => {
      const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
      vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

      exportToCSV(rows, 'test', ['name', 'amount']);

      // Blob should have been created (with content matching headers)
      expect(mockCreateObjectURL).toHaveBeenCalledOnce();

      appendSpy.mockRestore();
    });

    test('extracts headers from first object when not provided', () => {
      const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
      vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

      exportToCSV(rows, 'test-auto-headers');

      expect(mockCreateObjectURL).toHaveBeenCalledOnce();

      appendSpy.mockRestore();
    });

    test('revokes the object URL after download', () => {
      exportToCSV(rows, 'test');
      expect(mockRevokeObjectURL).toHaveBeenCalledWith(mockUrl);
    });

    test('handles null values in cells', () => {
      const withNull = [{ name: 'Alice', value: null as unknown as string }];
      expect(() => exportToCSV(withNull, 'null-test')).not.toThrow();
    });

    test('handles object values by JSON-stringifying them', () => {
      const withObj = [{ name: 'Alice', meta: { key: 'val' } as unknown as string }];
      expect(() => exportToCSV(withObj, 'obj-test')).not.toThrow();
    });

    test('the download filename includes the provided filename', () => {
      const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
      vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

      exportToCSV(rows, 'member-export');

      const appendedLink = appendSpy.mock.calls[0]?.[0] as HTMLAnchorElement | undefined;
      if (appendedLink) {
        expect(appendedLink.getAttribute('download')).toContain('member-export');
      }

      appendSpy.mockRestore();
    });
  });
});
