/**
 * Envelope Template Parser Service
 * Parses Excel template files for envelope batch entry
 */

import type {
  ParsedEnvelopeEntry,
  TemplateParseResult,
  TemplateParseError,
  TemplateParseWarning,
} from '../types/envelopeTemplateUpload';

// Type for xlsx-js-style library
type XLSX = typeof import('xlsx-js-style');

/**
 * Parse envelope template Excel file
 * @param file - Excel file to parse (.xlsx format)
 * @returns Promise with parse result containing collection date, envelopes, errors, and warnings
 */
export async function parseEnvelopeTemplate(
  file: File
): Promise<TemplateParseResult> {
  const errors: TemplateParseError[] = [];
  const warnings: TemplateParseWarning[] = [];
  const envelopes: ParsedEnvelopeEntry[] = [];

  try {
    // Validate file size (2MB limit)
    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_FILE_SIZE) {
      errors.push({
        type: 'error',
        message: 'File size exceeds 2MB limit. Please use smaller template.',
        code: 'INVALID_FILE',
      });
      return { success: false, envelopes: [], errors, warnings };
    }

    // Validate file type
    if (
      !file.name.endsWith('.xlsx') &&
      file.type !==
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      errors.push({
        type: 'error',
        message: 'Invalid file type. Please upload .xlsx Excel file.',
        code: 'INVALID_FILE',
      });
      return { success: false, envelopes: [], errors, warnings };
    }

    // Read file as ArrayBuffer
    const arrayBuffer = await readFileAsArrayBuffer(file);

    // Dynamically import xlsx library
    const XLSX: XLSX = await import('xlsx-js-style');

    // Parse workbook
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });

    // Get first worksheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      errors.push({
        type: 'error',
        message: 'Template file is empty or has no worksheets.',
        code: 'EMPTY_TEMPLATE',
      });
      return { success: false, envelopes: [], errors, warnings };
    }

    const worksheet = workbook.Sheets[sheetName];

    // Extract collection date from cell B1
    const b1Cell = worksheet['B1'];
    if (!b1Cell || !b1Cell.v) {
      errors.push({
        type: 'error',
        message:
          'Unable to read collection date from cell B1. Please ensure date is in correct format.',
        code: 'MISSING_DATE',
      });
      return { success: false, envelopes: [], errors, warnings };
    }

    // Parse date from B1
    const collectionDate = parseExcelDate(b1Cell.v);
    if (!collectionDate) {
      errors.push({
        type: 'error',
        message:
          'Invalid date format in cell B1. Please use a valid date format.',
        code: 'INVALID_DATE',
      });
      return { success: false, envelopes: [], errors, warnings };
    }

    // Validate Sunday
    if (collectionDate.getDay() !== 0) {
      const dayNames = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ];
      errors.push({
        type: 'error',
        message: `Collection date in template must be a Sunday. Found: ${
          dayNames[collectionDate.getDay()]
        }.`,
        code: 'NON_SUNDAY',
      });
      return { success: false, envelopes: [], errors, warnings };
    }

    // Parse envelope data starting from Row 3 (index 2)
    let rowIndex = 2; // Excel row 3 = index 2
    let hasData = false;

    while (true) {
      const excelRowNumber = rowIndex + 1; // For display purposes (1-based)
      const registerCell = worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: 0 })]; // Column A
      const amountCell = worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: 1 })]; // Column B

      // Check if both cells are empty (end of data)
      if (
        (!registerCell || !registerCell.v) &&
        (!amountCell || !amountCell.v)
      ) {
        // Stop if we've gone 10 rows without data
        if (hasData) {
          rowIndex++;
          if (rowIndex > 500) break; // Safety limit
          continue;
        } else {
          break;
        }
      }

      // Check for partial data (only one cell filled)
      const hasRegister = registerCell && registerCell.v;
      const hasAmount = amountCell && amountCell.v;

      if (hasRegister && !hasAmount) {
        warnings.push({
          type: 'warning',
          message: `Row ${excelRowNumber}: Amount missing for Register Number ${registerCell.v}`,
          rowNumber: excelRowNumber,
          code: 'PARTIAL_DATA',
        });
        rowIndex++;
        continue;
      }

      if (!hasRegister && hasAmount) {
        warnings.push({
          type: 'warning',
          message: `Row ${excelRowNumber}: Register Number missing for Amount ${amountCell.v}`,
          rowNumber: excelRowNumber,
          code: 'PARTIAL_DATA',
        });
        rowIndex++;
        continue;
      }

      // Parse register number
      const registerValue = registerCell.v;
      const registerNumber = parseInt(String(registerValue));
      if (isNaN(registerNumber) || registerNumber <= 0) {
        warnings.push({
          type: 'warning',
          message: `Row ${excelRowNumber}: Invalid register number format`,
          rowNumber: excelRowNumber,
          code: 'INVALID_REGISTER',
        });
        rowIndex++;
        continue;
      }

      // Parse amount
      const amountValue = amountCell.v;
      const amount = parseFloat(String(amountValue));
      if (isNaN(amount) || amount <= 0) {
        warnings.push({
          type: 'warning',
          message: `Row ${excelRowNumber}: Invalid amount format`,
          rowNumber: excelRowNumber,
          code: 'INVALID_AMOUNT',
        });
        rowIndex++;
        continue;
      }

      // Round amount to 2 decimal places
      const roundedAmount = Math.round(amount * 100) / 100;

      // Add valid envelope entry
      envelopes.push({
        registerNumber,
        amount: roundedAmount,
        rowNumber: excelRowNumber,
      });

      hasData = true;
      rowIndex++;

      // Safety limit
      if (rowIndex > 500) break;
    }

    // Check if template has data
    if (envelopes.length === 0) {
      errors.push({
        type: 'error',
        message:
          'No envelope data found in template. Please ensure data starts from Row 3.',
        code: 'EMPTY_TEMPLATE',
      });
      return { success: false, envelopes: [], errors, warnings };
    }

    return {
      success: true,
      collectionDate,
      envelopes,
      errors,
      warnings,
    };
  } catch (error) {
    errors.push({
      type: 'error',
      message:
        'Unable to read Excel file. Please ensure file is a valid .xlsx format.',
      code: 'CORRUPTED_FILE',
    });
    return { success: false, envelopes: [], errors, warnings };
  }
}

/**
 * Read file as ArrayBuffer using FileReader API
 */
function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (result instanceof ArrayBuffer) {
        resolve(result);
      } else {
        reject(new Error('Failed to read file as ArrayBuffer'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse Excel date value (handles Excel serial dates, Date objects, and strings)
 */
function parseExcelDate(value: unknown): Date | null {
  try {
    // If already a Date object
    if (value instanceof Date) {
      return value;
    }

    // If Excel serial number (number)
    if (typeof value === 'number') {
      // Excel date starts from 1900-01-01 (December 30, 1899 accounting for 1900 leap year bug)
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const msPerDay = 24 * 60 * 60 * 1000;
      const resultDate = new Date(excelEpoch.getTime() + value * msPerDay);
      return resultDate;
    }

    // If ISO string or locale date string
    if (typeof value === 'string') {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    return null;
  } catch {
    return null;
  }
}
