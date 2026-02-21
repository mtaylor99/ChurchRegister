import { describe, it, expect } from 'vitest';
import { parseEnvelopeTemplate } from './envelopeTemplateParser';
import XLSX from 'xlsx-js-style';

/**
 * Unit tests for envelope template parser
 */

describe('envelopeTemplateParser', () => {
  /**
   * Helper function to create test Excel files
   */
  const createTestExcelFile = (data: {
    collectionDate?: unknown;
    envelopes?: Array<{ register?: unknown; amount?: unknown }>;
  }): File => {
    const wb = XLSX.utils.book_new();
    const wsData: unknown[][] = [];

    // Row 1: Collection date in B1
    wsData.push(['', data.collectionDate || '']);

    // Row 2: Headers (optional)
    wsData.push(['Member Number', 'Amount']);

    // Rows 3+: Envelope data
    if (data.envelopes) {
      data.envelopes.forEach((env) => {
        wsData.push([
          env.register !== undefined ? env.register : '',
          env.amount !== undefined ? env.amount : '',
        ]);
      });
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    // Convert to blob then file
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    return new File([blob], 'test-template.xlsx', { type: blob.type });
  };

  describe('Valid Templates', () => {
    it('should parse valid template with Sunday date and envelope data', async () => {
      // Create test file with Sunday date (2026-02-15 is a Sunday)
      const testDate = new Date(2026, 1, 15); // February 15, 2026 (Sunday)
      const file = createTestExcelFile({
        collectionDate: testDate,
        envelopes: [
          { register: 101, amount: 25.0 },
          { register: 102, amount: 50.5 },
          { register: 103, amount: 100.0 },
        ],
      });

      const result = await parseEnvelopeTemplate(file);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.collectionDate).toEqual(testDate);
      expect(result.envelopes).toHaveLength(3);
      expect(result.envelopes[0]).toEqual({
        registerNumber: 101,
        amount: 25.0,
        rowNumber: 3,
      });
      expect(result.envelopes[1]).toEqual({
        registerNumber: 102,
        amount: 50.5,
        rowNumber: 4,
      });
      expect(result.envelopes[2]).toEqual({
        registerNumber: 103,
        amount: 100.0,
        rowNumber: 5,
      });
    });

    it('should round amounts to 2 decimal places', async () => {
      const testDate = new Date(2026, 1, 15); // Sunday
      const file = createTestExcelFile({
        collectionDate: testDate,
        envelopes: [
          { register: 101, amount: 25.556 },
          { register: 102, amount: 50.554 },
        ],
      });

      const result = await parseEnvelopeTemplate(file);

      expect(result.success).toBe(true);
      expect(result.envelopes[0].amount).toBe(25.56);
      expect(result.envelopes[1].amount).toBe(50.55);
    });

    it('should handle Excel serial date format in B1', async () => {
      // February 15, 2026 is a Sunday
      // Excel serial date for this date (calculated from 1900-01-01)
      // Days from 1900-01-01 to 2026-02-15 = 46,077 days
      const testDate = new Date(2026, 1, 15); // Sunday
      
      // Create file with Date object (xlsx library will handle the conversion)
      const file = createTestExcelFile({
        collectionDate: testDate,
        envelopes: [{ register: 101, amount: 25.0 }],
      });

      const result = await parseEnvelopeTemplate(file);

      expect(result.success).toBe(true);
      expect(result.collectionDate).toBeDefined();
      expect(result.collectionDate?.getDay()).toBe(0); // Sunday
      // Verify it's the correct date
      expect(result.collectionDate?.getFullYear()).toBe(2026);
      expect(result.collectionDate?.getMonth()).toBe(1); // February (0-indexed)
      expect(result.collectionDate?.getDate()).toBe(15);
    });

    it('should handle ISO date string in B1', async () => {
      const file = createTestExcelFile({
        collectionDate: '2026-02-15', // Sunday
        envelopes: [{ register: 101, amount: 25.0 }],
      });

      const result = await parseEnvelopeTemplate(file);

      expect(result.success).toBe(true);
      expect(result.collectionDate?.getDay()).toBe(0); // Sunday
    });

    it('should skip empty rows (both cells empty)', async () => {
      const testDate = new Date(2026, 1, 15); // Sunday
      const file = createTestExcelFile({
        collectionDate: testDate,
        envelopes: [
          { register: 101, amount: 25.0 },
          { register: '', amount: '' }, // Empty row
          { register: 102, amount: 50.0 },
        ],
      });

      const result = await parseEnvelopeTemplate(file);

      expect(result.success).toBe(true);
      expect(result.envelopes).toHaveLength(2);
      expect(result.envelopes[0].registerNumber).toBe(101);
      expect(result.envelopes[1].registerNumber).toBe(102);
    });
  });

  describe('Invalid Dates', () => {
    it('should reject template with non-Sunday date', async () => {
      // Monday, February 16, 2026
      const testDate = new Date(2026, 1, 16); // Monday
      const file = createTestExcelFile({
        collectionDate: testDate,
        envelopes: [{ register: 101, amount: 25.0 }],
      });

      const result = await parseEnvelopeTemplate(file);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Sunday');
      expect(result.errors[0].message).toContain('Monday');
      expect(result.errors[0].code).toBe('NON_SUNDAY');
    });

    it('should reject template with empty B1 cell', async () => {
      const file = createTestExcelFile({
        collectionDate: '',
        envelopes: [{ register: 101, amount: 25.0 }],
      });

      const result = await parseEnvelopeTemplate(file);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('cell B1');
      expect(result.errors[0].code).toBe('MISSING_DATE');
    });

    it('should reject template with invalid date format', async () => {
      const file = createTestExcelFile({
        collectionDate: 'invalid-date',
        envelopes: [{ register: 101, amount: 25.0 }],
      });

      const result = await parseEnvelopeTemplate(file);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Partial and Invalid Data', () => {
    it('should generate warning for partial data row (register without amount)', async () => {
      const testDate = new Date(2026, 1, 15); // Sunday
      const file = createTestExcelFile({
        collectionDate: testDate,
        envelopes: [
          { register: 101, amount: 25.0 },
          { register: 102, amount: '' }, // Missing amount
          { register: 103, amount: 50.0 },
        ],
      });

      const result = await parseEnvelopeTemplate(file);

      expect(result.success).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].message).toContain('Amount missing');
      expect(result.warnings[0].message).toContain('102');
      expect(result.warnings[0].code).toBe('PARTIAL_DATA');
      expect(result.envelopes).toHaveLength(2); // Only valid rows
    });

    it(' should generate warning for partial data row (amount without register)', async () => {
      const testDate = new Date(2026, 1, 15); // Sunday
      const file = createTestExcelFile({
        collectionDate: testDate,
        envelopes: [
          { register: 101, amount: 25.0 },
          { register: '', amount: 50.0 }, // Missing register
          { register: 103, amount: 75.0 },
        ],
      });

      const result = await parseEnvelopeTemplate(file);

      expect(result.success).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].message).toContain('Register Number missing');
      expect(result.warnings[0].message).toContain('50');
      expect(result.warnings[0].code).toBe('PARTIAL_DATA');
      expect(result.envelopes).toHaveLength(2);
    });

    it('should generate warning for invalid register number format (non-numeric)', async () => {
      const testDate = new Date(2026, 1, 15); // Sunday
      const file = createTestExcelFile({
        collectionDate: testDate,
        envelopes: [
          { register: 101, amount: 25.0 },
          { register: 'ABC', amount: 50.0 }, // Invalid register
          { register: 103, amount: 75.0 },
        ],
      });

      const result = await parseEnvelopeTemplate(file);

      expect(result.success).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].message).toContain('Invalid register number');
      expect(result.warnings[0].code).toBe('INVALID_REGISTER');
      expect(result.envelopes).toHaveLength(2);
    });

    it('should generate warning for invalid amount format (non-numeric)', async () => {
      const testDate = new Date(2026, 1, 15); // Sunday
      const file = createTestExcelFile({
        collectionDate: testDate,
        envelopes: [
          { register: 101, amount: 25.0 },
          { register: 102, amount: 'XYZ' }, // Invalid amount
          { register: 103, amount: 75.0 },
        ],
      });

      const result = await parseEnvelopeTemplate(file);

      expect(result.success).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].message).toContain('Invalid amount');
      expect(result.warnings[0].code).toBe('INVALID_AMOUNT');
      expect(result.envelopes).toHaveLength(2);
    });

    it('should generate warning for negative register number', async () => {
      const testDate = new Date(2026, 1, 15); // Sunday
      const file = createTestExcelFile({
        collectionDate: testDate,
        envelopes: [
          { register: 101, amount: 25.0 },
          { register: -5, amount: 50.0 }, // Negative register
          { register: 103, amount: 75.0 },
        ],
      });

      const result = await parseEnvelopeTemplate(file);

      expect(result.success).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.envelopes).toHaveLength(2);
    });

    it('should generate warning for negative amount', async () => {
      const testDate = new Date(2026, 1, 15); // Sunday
      const file = createTestExcelFile({
        collectionDate: testDate,
        envelopes: [
          { register: 101, amount: 25.0 },
          { register: 102, amount: -50.0 }, // Negative amount
          { register: 103, amount: 75.0 },
        ],
      });

      const result = await parseEnvelopeTemplate(file);

      expect(result.success).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.envelopes).toHaveLength(2);
    });
  });

  describe('Empty andFile Errors', () => {
    it('should reject empty template (no data rows)', async () => {
      const testDate = new Date(2026, 1, 15); // Sunday
      const file = createTestExcelFile({
        collectionDate: testDate,
        envelopes: [], // No data
      });

      const result = await parseEnvelopeTemplate(file);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('No envelope data');
      expect(result.errors[0].code).toBe('EMPTY_TEMPLATE');
    });

    it('should reject file size over 2MB', async () => {
      // Create a large blob (> 2MB)
      const largeData = new Uint8Array(3 * 1024 * 1024); // 3MB
      const blob = new Blob([largeData], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const file = new File([blob], 'large-template.xlsx', { type: blob.type });

      const result = await parseEnvelopeTemplate(file);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('2MB');
      expect(result.errors[0].code).toBe('INVALID_FILE');
    });

    it('should reject invalid file type', async () => {
      const blob = new Blob(['some text'], { type: 'text/plain' });
      const file = new File([blob], 'test.txt', { type: 'text/plain' });

      const result = await parseEnvelopeTemplate(file);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('.xlsx');
      expect(result.errors[0].code).toBe('INVALID_FILE');
    });

    it('should handle corrupted Excel file', async () => {
      // Create a blob with invalid Excel data
      const blob = new Blob(['corrupted data'], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const file = new File([blob], 'corrupted.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const result = await parseEnvelopeTemplate(file);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      // Corrupted file may fail at various stages, so check for any error
      expect(result.errors[0].message).toBeDefined();
    });
  });
});
