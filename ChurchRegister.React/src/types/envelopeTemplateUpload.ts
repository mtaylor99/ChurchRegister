/**
 * TypeScript interfaces for Envelope Template Upload feature
 */

export interface ParsedEnvelopeEntry {
  registerNumber: number;
  amount: number;
  rowNumber: number; // Original row number in Excel for error reporting
}

export interface TemplateParseError {
  type: 'error';
  message: string;
  code?:
    | 'INVALID_FILE'
    | 'MISSING_DATE'
    | 'INVALID_DATE'
    | 'NON_SUNDAY'
    | 'EMPTY_TEMPLATE'
    | 'CORRUPTED_FILE';
}

export interface TemplateParseWarning {
  type: 'warning';
  message: string;
  rowNumber: number;
  code?:
    | 'PARTIAL_DATA'
    | 'INVALID_REGISTER'
    | 'INVALID_AMOUNT'
    | 'SKIPPED_ROW';
}

export interface TemplateParseResult {
  success: boolean;
  collectionDate?: Date;
  envelopes: ParsedEnvelopeEntry[];
  errors: TemplateParseError[];
  warnings: TemplateParseWarning[];
}
