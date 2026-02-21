---
title: Envelope Contributions Template Upload - Excel-Based Bulk Envelope Entry for Weekly Cash Collections
version: 1.0
date_created: 2026-02-14
last_updated: 2026-02-14
owner: Church Register Development Team
tags:
  [financial, data-processing, excel-upload, bulk-operations, envelope-contributions, cash-contributions]
---

# Introduction

This specification defines an Excel template upload feature for the existing "Envelope Batch Entry" dialog, enabling efficient bulk entry of weekly envelope contributions. Users can maintain envelope data offline in a standardized Excel template (`Envelope-Upload-Template.xlsx`) and upload it into the dialog grid for review before submission. This addresses the common scenario where envelope data is collected and recorded offline by volunteers without system access, then uploaded by administrators for processing. The upload feature integrates seamlessly with existing validation logic (register number lookup, member name display, duplicate prevention) and maintains the current review-before-submit workflow.

## 1. Purpose & Scope

This specification covers:

- Excel template structure for offline envelope contribution data entry
- "Upload Template" button integration in existing "Envelope Batch Entry" dialog
- Client-side Excel file parsing using JavaScript/React (xlsx library)
- Population of date picker and grid rows from template data
- Leveraging existing validation logic for register numbers and amounts
- Automatic footer total updates (Total Envelopes count, Total Amounts sum)
- Maintaining full editability after upload (add/edit/delete rows)
- Error handling for malformed templates and invalid data
- User permissions aligned with existing envelope batch entry permissions

**Intended Audience**: Frontend developers (React/TypeScript), backend developers (for any API adjustments), QA engineers, and system architects.

**Assumptions**:

- Envelope Batch Entry dialog already exists with manual grid entry functionality
- Existing validation logic validates register numbers against current year's ChurchMemberRegisterNumbers
- Existing validation displays member names for valid register numbers and red errors for invalid ones
- Footer already calculates and displays Total Envelopes count and Total Amounts sum
- Date picker already validates Sunday-only selection
- Submit flow already POSTs to `/api/financial/envelope-contributions/batches`
- Excel parsing library (e.g., xlsx, exceljs) is available or will be added to React dependencies

## 2. Definitions

- **Envelope Batch Entry Dialog**: Existing modal dialog for manual entry of envelope contributions with Collection Date picker, grid (Register Number, Amount), and Submit Upload button
- **Upload Template**: Excel file (`.xlsx` format) following standardized structure for bulk envelope data entry
- **Template Structure**: Excel file with Collection Date in cell B1 and envelope data starting from row 3 (Column A = Register Number, Column B = Amount)
- **Client-Side Parsing**: JavaScript-based Excel file processing in the browser without server round-trip
- **Grid Population**: Automatic insertion of parsed template rows into the existing envelope entry grid
- **Replace Mode**: Upload clears all existing manual entries and replaces with template data
- **Existing Validation**: Current register number validation logic that queries backend and displays member names or errors
- **Footer Totals**: Automatic calculation of envelope count and total amount displayed at dialog bottom
- **Review Workflow**: User ability to review, edit, add, or delete grid rows after upload before final submission

## 3. Requirements, Constraints & Guidelines

### Excel Template Structure

- **REQ-001**: Template file MUST be named `Envelope-Upload-Template.xlsx` (naming not enforced by system but documented for users)
- **REQ-002**: Template MUST use `.xlsx` format (Excel 2007+ Open XML format)
- **REQ-003**: Cell B1 MUST contain the Collection Date in a recognizable date format (ISO 8601, Excel serial date, or locale date string)
- **REQ-004**: Data rows MUST start from Row 3 onwards
- **REQ-005**: Column A (from Row 3+) MUST contain Register Number (integer value)
- **REQ-006**: Column B (from Row 3+) MUST contain Amount (decimal value with up to 2 decimal places)
- **REQ-007**: Empty rows (both Column A and B blank) MUST be skipped during parsing
- **REQ-008**: Rows with only Register Number OR only Amount (partial data) SHOULD be treated as validation warnings
- **REQ-009**: Template MAY contain additional columns (C, D, etc.) for reference (e.g., member names) but system MUST ignore them
- **REQ-010**: Template MAY contain formatting, comments, or helper text in Row 1, Row 2, or cells outside A and B columns - system MUST ignore non-data cells

### Upload Template Button & UI Integration

- **REQ-011**: System MUST add "Upload Template" button to existing "Envelope Batch Entry" dialog
- **REQ-012**: "Upload Template" button MUST be positioned prominently near the top of the dialog, separate from grid row actions
- **REQ-013**: Button MUST trigger file input dialog accepting only `.xlsx` files (MIME type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`)
- **REQ-014**: File input MUST restrict file size to maximum 2MB
- **REQ-015**: Button MUST be enabled at all times (no permission-based disabling - permissions already enforced at dialog level)
- **REQ-016**: UI SHOULD display loading indicator (spinner or progress) during file parsing
- **REQ-017**: Upload action MUST be client-side only (no backend upload endpoint) - all parsing done in browser

### Template Parsing & Validation

- **REQ-018**: System MUST use JavaScript Excel parsing library (e.g., `xlsx` npm package) to read `.xlsx` files
- **REQ-019**: System MUST extract Collection Date from cell B1 of first worksheet
- **REQ-020**: System MUST validate B1 date is a valid Sunday date
- **REQ-021**: If B1 date is not a Sunday, system MUST display error: "Collection date in template must be a Sunday. Found: [DayOfWeek]"
- **REQ-022**: If B1 is empty or invalid date format, system MUST display error: "Unable to read collection date from cell B1. Please ensure date is in correct format."
- **REQ-023**: System MUST parse rows starting from Row 3 onwards in first worksheet
- **REQ-024**: For each row, system MUST read:
  - Column A (index 0) as Register Number (convert to integer)
  - Column B (index 1) as Amount (convert to decimal)
- **REQ-025**: System MUST skip rows where both Column A and Column B are empty/null
- **REQ-026**: System MUST warn if Column A has value but Column B is empty: "Row [N]: Amount missing for Register Number [X]"
- **REQ-027**: System MUST warn if Column B has value but Column A is empty: "Row [N]: Register Number missing for Amount [Y]"
- **REQ-028**: System MUST validate Register Number is positive integer (> 0)
- **REQ-029**: System MUST validate Amount is positive decimal (> 0.00)
- **REQ-030**: Non-numeric values in Column A or B MUST be flagged with warning: "Row [N]: Invalid data format"
- **REQ-031**: System MUST continue parsing all rows even if some fail validation (collect all errors before displaying)

### Grid Population & State Management

- **REQ-032**: On successful parse with valid B1 date, system MUST populate the Collection Date picker with template date
- **REQ-033**: If date picker already has a different date selected, system MUST override with template date
- **REQ-034**: System MUST clear all existing grid rows before populating from template (replace mode, not append)
- **REQ-035**: System MUST create grid row for each valid envelope entry parsed from template
- **REQ-036**: Each grid row MUST be populated with:
  - Register Number field = Column A value
  - Amount field = Column B value
- **REQ-037**: System MUST trigger existing register number validation for each populated row
- **REQ-038**: System MUST display member names for valid register numbers (via existing validation logic)
- **REQ-039**: System MUST display red error indicators for invalid register numbers (via existing validation logic)
- **REQ-040**: System MUST update footer "Total Envelopes" count to reflect number of populated rows
- **REQ-041**: System MUST update footer "Total Amounts" sum to reflect sum of all amounts
- **REQ-042**: Footer totals MUST update automatically as grid state changes
- **REQ-043**: Grid rows MUST remain fully editable after upload (user can modify register numbers, amounts, add rows, delete rows)

### Error Handling & User Feedback

- **ERR-001**: If file read fails (corrupted file, wrong format), system MUST display error: "Unable to read Excel file. Please ensure file is a valid .xlsx format."
- **ERR-002**: If template has no worksheet, system MUST display error: "Template file is empty or has no worksheets."
- **ERR-003**: If B1 validation fails (not Sunday), system MUST NOT populate grid and MUST display error with specific date found
- **ERR-004**: If template has no data rows (all rows 3+ are empty), system MUST display error: "No envelope data found in template. Please ensure data starts from Row 3."
- **ERR-005**: If template parsing succeeds but with warnings (partial data rows), system MUST:
  - Populate grid with valid rows
  - Display warning message listing problematic row numbers
  - Allow user to proceed with valid data
- **ERR-006**: If file size exceeds 2MB, system MUST display error: "File size exceeds 2MB limit. Please use smaller template."
- **ERR-007**: If file type is not `.xlsx`, system MUST display error: "Invalid file type. Please upload .xlsx Excel file."
- **ERR-008**: All error and warning messages MUST be displayed using existing notification system (toast/snackbar)
- **ERR-009**: Parsing errors MUST NOT close the dialog - user remains in dialog to retry or enter manually
- **ERR-010**: On successful parse with no errors, system SHOULD display success notification: "Template uploaded successfully. [N] envelopes loaded. Please review and submit."

### Post-Upload Workflow

- **REQ-044**: After successful upload and grid population, user MUST be able to:
  - Edit any register number or amount in populated rows
  - Add additional rows manually using existing "Add Row" functionality
  - Delete unwanted rows using existing delete row functionality
  - Change the Collection Date if needed
- **REQ-045**: Existing validation logic MUST continue to run as user edits data
- **REQ-046**: Footer totals MUST update in real-time as user modifies data
- **REQ-047**: Submit button enablement logic MUST remain unchanged (enabled when date is Sunday, at least one valid envelope, no validation errors)
- **REQ-048**: Submit flow MUST use existing POST endpoint `/api/financial/envelope-contributions/batches` with same request payload
- **REQ-049**: Server-side validation MUST remain unchanged (Sunday validation, duplicate batch check, register number validation)

### Security & Permissions

- **SEC-001**: Upload Template feature MUST respect existing dialog permissions (FinancialContributor, FinancialAdministrator, SystemAdministrator)
- **SEC-002**: No additional permission checks required for upload button (dialog-level authentication sufficient)
- **SEC-003**: Client-side parsing MUST NOT execute any macros or scripts from Excel file
- **SEC-004**: System MUST sanitize file name to prevent XSS attacks
- **SEC-005**: Parsed data MUST be validated same as manual entry (no bypass of server-side validation)

### Performance Constraints

- **CON-001**: Template parsing MUST complete within 5 seconds for files up to 2MB
- **CON-002**: System SHOULD handle templates with up to 500 envelope rows without performance degradation
- **CON-003**: Grid rendering after upload MUST not cause UI freezing or lag
- **CON-004**: Memory consumption during parsing SHOULD not exceed 50MB

### UI/UX Guidelines

- **GUD-001**: "Upload Template" button SHOULD use an upload icon (UploadFile, CloudUpload, or similar)
- **GUD-002**: Button label SHOULD be "Upload Template" or "Upload Excel"
- **GUD-003**: File input dialog SHOULD display clear file type filter: "Excel Files (*.xlsx)"
- **GUD-004**: Loading indicator during parsing SHOULD be non-blocking (spinner overlay on dialog)
- **GUD-005**: Success notification SHOULD include count of envelopes loaded
- **GUD-006**: Error messages SHOULD be specific and actionable (e.g., "Row 5: Invalid amount" rather than generic "Parse error")
- **GUD-007**: After upload, grid SHOULD auto-scroll to top to show first loaded envelope
- **GUD-008**: If validation errors exist after upload (invalid register numbers), they SHOULD be immediately visible with red indicators
- **GUD-009**: Dialog SHOULD remain responsive during parsing (use Web Workers if needed for large files)

### Implementation Patterns

- **PAT-001**: Use `xlsx` npm package (SheetJS) for client-side Excel parsing
- **PAT-002**: Parse Excel file as ArrayBuffer using FileReader API
- **PAT-003**: Extract first worksheet using `XLSX.utils.sheet_to_json` with appropriate options
- **PAT-004**: Use React state management (useState, useReducer) to update grid rows atomically
- **PAT-005**: Leverage existing validation hooks/functions for register number validation
- **PAT-006**: Use existing footer calculation logic - no duplication needed
- **PAT-007**: Maintain existing grid component structure - only add data population logic
- **PAT-008**: Follow Material-UI button patterns for upload button styling

## 4. Interfaces & Data Contracts

### Excel Template Structure

#### Cell B1 (Collection Date):
```
B1: 2026-02-16  (Sunday date in any valid format)
```

#### Data Rows (Starting Row 3):

| Row | Column A (Register Number) | Column B (Amount) | Column C (Ignored - Optional Member Name) |
|-----|----------------------------|-------------------|------------------------------------------|
| 3   | 1                          | 25.50             | John Smith                               |
| 4   | 5                          | 50.00             | Mary Johnson                             |
| 5   | 12                         | 30.00             | Robert Brown                             |
| 6   | 8                          | 45.75             | Sarah Davis                              |
| ... | ...                        | ...               | ...                                      |

**Example Template Data:**
```
A1: [empty/label]
B1: 2026-02-16

A2: Member Number (optional header)
B2: Amount (optional header)

A3: 1
B3: 25.50

A4: 5
B4: 50.00

A5: 12
B5: 30.00
```

### TypeScript Interfaces

```typescript
// Parsed envelope entry from template
interface ParsedEnvelopeEntry {
  rowNumber: number;           // Excel row number for error reporting
  registerNumber: number;      // Column A value
  amount: number;              // Column B value
}

// Template parse result
interface TemplateParseResult {
  success: boolean;
  collectionDate: Date | null;
  envelopes: ParsedEnvelopeEntry[];
  errors: TemplateParseError[];
  warnings: TemplateParseWarning[];
}

// Parse error details
interface TemplateParseError {
  row?: number;
  column?: string;
  message: string;
  errorType: 'INVALID_FORMAT' | 'INVALID_DATE' | 'NOT_SUNDAY' | 'MISSING_DATA' | 'FILE_ERROR';
}

// Parse warning details
interface TemplateParseWarning {
  row: number;
  message: string;
  warningType: 'PARTIAL_DATA' | 'INVALID_NUMBER' | 'INVALID_AMOUNT';
}

// Grid envelope row (existing interface - for reference)
interface EnvelopeRow {
  id: string;                    // Unique row identifier
  registerNumber: string;        // Input field value
  memberName: string;            // Looked up from validation
  amount: string;                // Input field value
  isValidating: boolean;         // Validation in progress
  isValid: boolean;              // Validation result
  error?: string;                // Validation error message
  amountError?: string;          // Amount validation error
}
```

### Excel Parsing Implementation Example

```typescript
import * as XLSX from 'xlsx';

/**
 * Parse envelope contribution template xlsx file
 * @param file - Selected Excel file from file input
 * @returns Promise<TemplateParseResult>
 */
async function parseEnvelopeTemplate(file: File): Promise<TemplateParseResult> {
  const result: TemplateParseResult = {
    success: false,
    collectionDate: null,
    envelopes: [],
    errors: [],
    warnings: [],
  };

  try {
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Parse workbook
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      result.errors.push({
        message: 'Template file is empty or has no worksheets.',
        errorType: 'FILE_ERROR',
      });
      return result;
    }

    // Get first worksheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Extract collection date from B1
    const dateCellAddress = 'B1';
    const dateCell = worksheet[dateCellAddress];
    
    if (!dateCell || !dateCell.v) {
      result.errors.push({
        message: 'Unable to read collection date from cell B1. Please ensure date is in correct format.',
        errorType: 'MISSING_DATA',
        column: 'B1',
      });
      return result;
    }

    // Parse date value
    let collectionDate: Date;
    if (dateCell.t === 'd') {
      // Excel date type
      collectionDate = dateCell.v as Date;
    } else if (dateCell.t === 'n') {
      // Excel serial date number
      collectionDate = XLSX.SSF.parse_date_code(dateCell.v as number);
    } else if (dateCell.t === 's') {
      // String date
      collectionDate = new Date(dateCell.v as string);
    } else {
      result.errors.push({
        message: 'Unable to parse collection date format in cell B1.',
        errorType: 'INVALID_DATE',
        column: 'B1',
      });
      return result;
    }

    // Validate date is valid
    if (isNaN(collectionDate.getTime())) {
      result.errors.push({
        message: 'Collection date in cell B1 is not a valid date.',
        errorType: 'INVALID_DATE',
        column: 'B1',
      });
      return result;
    }

    // Validate date is Sunday (0 = Sunday)
    if (collectionDate.getDay() !== 0) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      result.errors.push({
        message: `Collection date in template must be a Sunday. Found: ${dayNames[collectionDate.getDay()]}.`,
        errorType: 'NOT_SUNDAY',
        column: 'B1',
      });
      return result;
    }

    result.collectionDate = collectionDate;

    // Parse envelope data rows (starting from row 3)
    const startRow = 3; // Row 3 in Excel = index 2 (0-based)
    const maxRow = 1000; // Safety limit

    for (let rowIndex = startRow - 1; rowIndex < maxRow; rowIndex++) {
      const excelRowNumber = rowIndex + 1;
      const registerNumberCell = worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: 0 })]; // Column A
      const amountCell = worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: 1 })]; // Column B

      // Skip if both cells are empty
      if ((!registerNumberCell || !registerNumberCell.v) && (!amountCell || !amountCell.v)) {
        continue;
      }

      // Check for partial data
      if (registerNumberCell && registerNumberCell.v && (!amountCell || !amountCell.v)) {
        result.warnings.push({
          row: excelRowNumber,
          message: `Row ${excelRowNumber}: Amount missing for Register Number ${registerNumberCell.v}`,
          warningType: 'PARTIAL_DATA',
        });
        continue;
      }

      if ((!registerNumberCell || !registerNumberCell.v) && amountCell && amountCell.v) {
        result.warnings.push({
          row: excelRowNumber,
          message: `Row ${excelRowNumber}: Register Number missing for Amount ${amountCell.v}`,
          warningType: 'PARTIAL_DATA',
        });
        continue;
      }

      // Parse register number
      const registerNumberValue = registerNumberCell.v;
      const registerNumber = typeof registerNumberValue === 'number' 
        ? registerNumberValue 
        : parseInt(String(registerNumberValue), 10);

      if (isNaN(registerNumber) || registerNumber <= 0) {
        result.warnings.push({
          row: excelRowNumber,
          message: `Row ${excelRowNumber}: Invalid register number format`,
          warningType: 'INVALID_NUMBER',
        });
        continue;
      }

      // Parse amount
      const amountValue = amountCell.v;
      const amount = typeof amountValue === 'number'
        ? amountValue
        : parseFloat(String(amountValue));

      if (isNaN(amount) || amount <= 0) {
        result.warnings.push({
          row: excelRowNumber,
          message: `Row ${excelRowNumber}: Invalid amount format`,
          warningType: 'INVALID_AMOUNT',
        });
        continue;
      }

      // Add valid envelope entry
      result.envelopes.push({
        rowNumber: excelRowNumber,
        registerNumber,
        amount: parseFloat(amount.toFixed(2)), // Round to 2 decimals
      });
    }

    // Validate we have at least some envelope data
    if (result.envelopes.length === 0 && result.warnings.length === 0) {
      result.errors.push({
        message: 'No envelope data found in template. Please ensure data starts from Row 3.',
        errorType: 'MISSING_DATA',
      });
      return result;
    }

    result.success = true;
    return result;

  } catch (error) {
    result.errors.push({
      message: `Unable to read Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      errorType: 'FILE_ERROR',
    });
    return result;
  }
}
```

### React Component Integration Example

```typescript
// Inside EnvelopeBatchEntry component

const handleTemplateUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  // Validate file size
  if (file.size > 2 * 1024 * 1024) {
    showError('File size exceeds 2MB limit. Please use smaller template.');
    return;
  }

  // Validate file type
  if (!file.name.endsWith('.xlsx')) {
    showError('Invalid file type. Please upload .xlsx Excel file.');
    return;
  }

  setIsUploading(true);

  try {
    const parseResult = await parseEnvelopeTemplate(file);

    if (!parseResult.success) {
      // Show errors
      parseResult.errors.forEach(error => showError(error.message));
      setIsUploading(false);
      return;
    }

    // Show warnings if any
    if (parseResult.warnings.length > 0) {
      const warningMessage = parseResult.warnings.map(w => w.message).join('\n');
      showWarning(`Template loaded with warnings:\n${warningMessage}`);
    }

    // Update collection date picker
    setCollectionDate(parseResult.collectionDate);

    // Clear existing grid rows and populate from template
    const newEnvelopes = parseResult.envelopes.map((envelope, index) => ({
      id: `upload-${index}-${Date.now()}`,
      registerNumber: envelope.registerNumber.toString(),
      memberName: '', // Will be populated by validation
      amount: envelope.amount.toFixed(2),
      isValidating: true,
      isValid: false,
      error: undefined,
      amountError: undefined,
    }));

    setEnvelopes(newEnvelopes);

    // Trigger validation for all register numbers
    newEnvelopes.forEach(envelope => {
      validateRegisterNumber(envelope.id, envelope.registerNumber);
    });

    // Show success message
    showSuccess(`Template uploaded successfully. ${parseResult.envelopes.length} envelopes loaded. Please review and submit.`);

  } catch (error) {
    showError(`Failed to process template: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    setIsUploading(false);
    // Reset file input
    event.target.value = '';
  }
};

// Upload button JSX
<Button
  variant="outlined"
  startIcon={isUploading ? <CircularProgress size={20} /> : <UploadFileIcon />}
  onClick={() => fileInputRef.current?.click()}
  disabled={isUploading}
>
  {isUploading ? 'Uploading...' : 'Upload Template'}
</Button>
<input
  ref={fileInputRef}
  type="file"
  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  style={{ display: 'none' }}
  onChange={handleTemplateUpload}
/>
```

## 5. Acceptance Criteria

### Template Parsing

- **AC-001**: Given a valid `.xlsx` template file with Collection Date in B1 (Sunday) and envelope data in rows 3+, When user uploads the file, Then system successfully parses date and envelope entries
- **AC-002**: Given a template with B1 date as "2026-02-16" (Sunday), When template is uploaded, Then Collection Date picker is populated with February 16, 2026
- **AC-003**: Given a template with B1 date as "2026-02-17" (Monday), When template is uploaded, Then system displays error "Collection date in template must be a Sunday. Found: Monday" and does not populate grid
- **AC-004**: Given a template with B1 empty, When template is uploaded, Then system displays error "Unable to read collection date from cell B1"
- **AC-005**: Given a template with register numbers in Column A and amounts in Column B starting from Row 3, When template is uploaded, Then all rows are parsed into grid entries
- **AC-006**: Given a template row with Column A = 5 and Column B = 25.50, When template is uploaded, Then grid row is created with Register Number "5" and Amount "25.50"
- **AC-007**: Given a template row with both Column A and Column B empty, When template is uploaded, Then that row is skipped (not added to grid)
- **AC-008**: Given a template row with Column A = 10 but Column B empty, When template is uploaded, Then system displays warning "Row [N]: Amount missing for Register Number 10" and skips that row
- **AC-009**: Given a template row with Column A empty but Column B = 30.00, When template is uploaded, Then system displays warning "Row [N]: Register Number missing for Amount 30.00" and skips that row
- **AC-010**: Given a template row with Column A = "abc" (non-numeric), When template is uploaded, Then system displays warning "Row [N]: Invalid register number format" and skips that row
- **AC-011**: Given a template row with Column B = "xyz" (non-numeric), When template is uploaded, Then system displays warning "Row [N]: Invalid amount format" and skips that row
- **AC-012**: Given a template with 50 valid envelope entries, When template is uploaded, Then all 50 rows are added to grid

### Grid Population

- **AC-013**: Given existing manual entries in the grid, When template is uploaded successfully, Then all existing rows are cleared and replaced with template data
- **AC-014**: Given a template with 10 envelope entries, When template is uploaded, Then grid displays exactly 10 rows
- **AC-015**: Given a template upload populates 10 rows, When upload completes, Then existing register number validation triggers automatically for all 10 rows
- **AC-016**: Given a template row with Register Number 5 (valid), When validation completes, Then member name is displayed next to register number
- **AC-017**: Given a template row with Register Number 999 (invalid), When validation completes, Then register number field shows red error indicator
- **AC-018**: Given a template with 15 envelopes totaling £750.00, When template is uploaded, Then footer displays "Total Envelopes: 15" and "Total Amounts: £750.00"
- **AC-019**: Given template upload populates grid successfully, When user edits an amount field, Then footer "Total Amounts" updates immediately
- **AC-020**: Given template upload populates grid successfully, When user deletes a row, Then footer "Total Envelopes" decrements and "Total Amounts" recalculates

### Post-Upload Editability

- **AC-021**: Given template upload populates 10 rows, When user clicks in any Register Number field, Then field becomes editable
- **AC-022**: Given template upload populates 10 rows, When user clicks in any Amount field, Then field becomes editable
- **AC-023**: Given template upload populates 10 rows, When user changes Register Number from 5 to 8, Then validation re-runs for that row
- **AC-024**: Given template upload populates 10 rows, When user changes Amount from 25.50 to 30.00, Then footer "Total Amounts" updates
- **AC-025**: Given template upload populates 10 rows, When user clicks "Add Row" button, Then new empty row is added as row 11
- **AC-026**: Given template upload populates 10 rows, When user deletes row 5, Then grid shows 9 rows
- **AC-027**: Given template upload populates grid with date "2026-02-16", When user changes date picker to "2026-02-23", Then new date is selected and Sunday validation passes

### Error Handling

- **AC-028**: Given a file with `.xls` extension (old Excel format), When user selects it, Then browser file picker rejects it (file type filter)
- **AC-029**: Given a file larger than 2MB, When user uploads it, Then system displays error "File size exceeds 2MB limit"
- **AC-030**: Given a corrupted `.xlsx` file, When user uploads it, Then system displays error "Unable to read Excel file. Please ensure file is a valid .xlsx format."
- **AC-031**: Given a template with no data rows (rows 3+ all empty), When template is uploaded, Then system displays error "No envelope data found in template"
- **AC-032**: Given template parse encounters 3 warnings (partial data rows), When upload completes, Then system displays success message with envelope count AND lists warnings
- **AC-033**: Given a parsing error occurs, When error is displayed, Then dialog remains open for user to retry or enter manually

### User Experience

- **AC-034**: Given user clicks "Upload Template" button, When file picker opens, Then only `.xlsx` files are selectable
- **AC-035**: Given user uploads large template (500 rows), When parsing is in progress, Then "Upload Template" button shows loading spinner and text "Uploading..."
- **AC-036**: Given template parsing is in progress, When 2 seconds elapse, Then system continues processing without freezing UI
- **AC-037**: Given template upload succeeds with 25 envelopes, When upload completes, Then success notification displays "Template uploaded successfully. 25 envelopes loaded. Please review and submit."
- **AC-038**: Given template upload populates grid, When grid renders, Then grid auto-scrolls to top to show first envelope
- **AC-039**: Given template upload succeeds, When user reviews data and clicks "Submit Upload", Then existing submit flow executes (POST to `/api/financial/envelope-contributions/batches`)

### Security & Permissions

- **AC-040**: Given user has FinancialContributor role, When user opens Envelope Batch Entry dialog, Then "Upload Template" button is visible and enabled
- **AC-041**: Given user has FinancialViewer role only, When user attempts to open Envelope Batch Entry dialog, Then dialog does not open (existing permission check blocks access)
- **AC-042**: Given template upload populates grid with invalid register numbers, When user clicks "Submit Upload" with validation errors present, Then existing validation prevents submission

## 6. Test Automation Strategy

### Test Levels

- **Unit Tests**: React component logic, Excel parsing functions, validation logic
- **Integration Tests**: Template upload flow, grid population, validation integration
- **End-to-End Tests**: Complete workflow from file selection through grid review to submission

### Testing Frameworks

- **Frontend Unit Tests**: Vitest, React Testing Library
- **Frontend Integration Tests**: Vitest, React Testing Library, MSW (Mock Service Worker for API mocks)
- **E2E Tests**: Playwright
- **Excel File Mocking**: Create test `.xlsx` files using `xlsx` library in test setup

### Test Data Management

- Create fixture Excel templates with various scenarios:
  - Valid template (10 envelopes, Sunday date)
  - Invalid date template (Monday date in B1)
  - Empty template (no data rows)
  - Partial data template (missing amounts)
  - Large template (500 envelopes)
  - Malformed template (corrupted file)
- Store fixture files in `src/tests/fixtures/` directory
- Use `xlsx` library to generate test templates programmatically

### CI/CD Integration

- Run unit tests on every pull request
- Run integration tests on pull request merge to main branch
- Run E2E tests on staging deployment before production release
- Fail build if any tests fail
- Monitor test execution time (target < 5 minutes total)

### Coverage Requirements

- **Line Coverage**: Minimum 80% for new template upload code
- **Branch Coverage**: Minimum 70% for error handling paths
- **Critical Paths**: 100% coverage for date validation, grid population, error handling

### Test Examples

#### Unit Test Example (Vitest + React Testing Library)

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EnvelopeBatchEntry } from './EnvelopeBatchEntry';
import * as XLSX from 'xlsx';

describe('EnvelopeBatchEntry - Template Upload', () => {
  it('should parse valid template and populate grid', async () => {
    // Create test workbook
    const workbook = XLSX.utils.book_new();
    const worksheetData = [
      ['', '2026-02-16'], // Row 1: B1 = Sunday date
      ['', ''], // Row 2: Empty
      [1, 25.50], // Row 3: Register 1, Amount 25.50
      [5, 50.00], // Row 4: Register 5, Amount 50.00
      [12, 30.00], // Row 5: Register 12, Amount 30.00
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    
    // Convert to blob
    const xlsxBlob = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
    const file = new File([xlsxBlob], 'test-template.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const { container } = render(<EnvelopeBatchEntry onSubmitSuccess={vi.fn()} onCancel={vi.fn()} />);

    // Find and click upload button
    const uploadButton = screen.getByRole('button', { name: /upload template/i });
    expect(uploadButton).toBeInTheDocument();

    // Simulate file selection
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(fileInput, file);

    // Wait for parsing and grid population
    await waitFor(() => {
      expect(screen.getByText(/template uploaded successfully/i)).toBeInTheDocument();
    });

    // Verify grid has 3 rows
    const registerInputs = screen.getAllByLabelText(/register number/i);
    expect(registerInputs).toHaveLength(3);

    // Verify first row values
    expect(registerInputs[0]).toHaveValue('1');
    const amountInputs = screen.getAllByLabelText(/amount/i);
    expect(amountInputs[0]).toHaveValue('25.50');

    // Verify footer totals
    expect(screen.getByText(/total envelopes: 3/i)).toBeInTheDocument();
    expect(screen.getByText(/total amounts: £105.50/i)).toBeInTheDocument();
  });

  it('should reject template with non-Sunday date', async () => {
    const workbook = XLSX.utils.book_new();
    const worksheetData = [
      ['', '2026-02-17'], // Row 1: B1 = Monday date
      ['', ''],
      [1, 25.50],
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    
    const xlsxBlob = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
    const file = new File([xlsxBlob], 'test-template.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const { container } = render(<EnvelopeBatchEntry onSubmitSuccess={vi.fn()} onCancel={vi.fn()} />);

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByText(/collection date in template must be a sunday/i)).toBeInTheDocument();
    });

    // Verify grid is not populated
    const registerInputs = screen.queryAllByLabelText(/register number/i);
    expect(registerInputs).toHaveLength(0); // Or initial empty row count
  });

  it('should clear existing rows when uploading template', async () => {
    const { container } = render(<EnvelopeBatchEntry onSubmitSuccess={vi.fn()} onCancel={vi.fn()} />);

    // Manually add 2 rows
    const addButton = screen.getByRole('button', { name: /add row/i });
    await userEvent.click(addButton);
    await userEvent.click(addButton);

    // Enter data in manual rows
    const registerInputs = screen.getAllByLabelText(/register number/i);
    await userEvent.type(registerInputs[0], '1');
    await userEvent.type(registerInputs[1], '5');

    // Now upload template with 3 rows
    const workbook = XLSX.utils.book_new();
    const worksheetData = [
      ['', '2026-02-16'],
      ['', ''],
      [10, 100.00],
      [20, 200.00],
      [30, 300.00],
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    
    const xlsxBlob = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
    const file = new File([xlsxBlob], 'test-template.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(fileInput, file);

    await waitFor(() => {
      const updatedInputs = screen.getAllByLabelText(/register number/i);
      expect(updatedInputs).toHaveLength(3); // Only template rows, manual rows cleared
      expect(updatedInputs[0]).toHaveValue('10'); // First template value
    });
  });
});
```

#### E2E Test Example (Playwright)

```typescript
import { test, expect } from '@playwright/test';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Envelope Template Upload E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/financial/contributions');
    
    // Open Envelope Batch Entry dialog
    await page.click('button:has-text("Upload Envelopes")');
    await expect(page.locator('text=Envelope Batch Entry')).toBeVisible();
  });

  test('should upload valid template and submit batch successfully', async ({ page }) => {
    // Create test template file
    const workbook = XLSX.utils.book_new();
    const worksheetData = [
      ['', '2026-02-16'], // Sunday
      ['', ''],
      [1, 25.50],
      [5, 50.00],
      [10, 75.25],
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
    const filePath = path.join(tempDir, 'test-envelope-template.xlsx');
    XLSX.writeFile(workbook, filePath);

    // Click upload button
    await page.click('button:has-text("Upload Template")');

    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);

    // Wait for success notification
    await expect(page.locator('text=Template uploaded successfully. 3 envelopes loaded.')).toBeVisible();

    // Verify date picker populated
    await expect(page.locator('input[label="Collection Date"]')).toHaveValue('02/16/2026');

    // Verify grid populated with 3 rows
    await expect(page.locator('table tbody tr')).toHaveCount(3);

    // Verify first row values
    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow.locator('input[label="Register Number"]')).toHaveValue('1');
    await expect(firstRow.locator('input[label="Amount"]')).toHaveValue('25.50');

    // Verify footer totals
    await expect(page.locator('text=Total Envelopes: 3')).toBeVisible();
    await expect(page.locator('text=Total Amounts: £150.75')).toBeVisible();

    // Wait for validation to complete (member names should appear)
    await page.waitForTimeout(2000); // Wait for async validation

    // Submit batch
    await page.click('button:has-text("Submit Upload")');

    // Verify success
    await expect(page.locator('text=Batch submitted successfully')).toBeVisible();

    // Cleanup
    fs.unlinkSync(filePath);
  });

  test('should show error for non-Sunday date', async ({ page }) => {
    const workbook = XLSX.utils.book_new();
    const worksheetData = [
      ['', '2026-02-17'], // Monday
      ['', ''],
      [1, 25.50],
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    
    const filePath = path.join(__dirname, 'temp', 'invalid-date-template.xlsx');
    XLSX.writeFile(workbook, filePath);

    await page.click('button:has-text("Upload Template")');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);

    await expect(page.locator('text=Collection date in template must be a Sunday. Found: Monday')).toBeVisible();
    
    // Verify grid not populated
    await expect(page.locator('table tbody tr')).toHaveCount(1); // Only initial empty row

    fs.unlinkSync(filePath);
  });

  test('should allow editing after template upload', async ({ page }) => {
    const workbook = XLSX.utils.book_new();
    const worksheetData = [
      ['', '2026-02-16'],
      ['', ''],
      [1, 25.50],
      [5, 50.00],
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    
    const filePath = path.join(__dirname, 'temp', 'editable-template.xlsx');
    XLSX.writeFile(workbook, filePath);

    await page.click('button:has-text("Upload Template")');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);

    await expect(page.locator('text=Template uploaded successfully. 2 envelopes loaded.')).toBeVisible();

    // Edit first row amount
    const firstAmountInput = page.locator('table tbody tr').first().locator('input[label="Amount"]');
    await firstAmountInput.clear();
    await firstAmountInput.fill('30.00');

    // Verify footer total updated
    await expect(page.locator('text=Total Amounts: £80.00')).toBeVisible(); // 30.00 + 50.00

    // Add new row manually
    await page.click('button:has-text("Add Row")');
    await expect(page.locator('table tbody tr')).toHaveCount(3);

    // Delete second row
    await page.locator('table tbody tr').nth(1).locator('button[aria-label="Delete"]').click();
    await expect(page.locator('table tbody tr')).toHaveCount(2);
    await expect(page.locator('text=Total Envelopes: 2')).toBeVisible();

    fs.unlinkSync(filePath);
  });
});
```

## 7. Rationale & Context

### Why Client-Side Parsing Instead of Backend Upload?

**Decision**: Parse Excel files in browser using JavaScript library rather than uploading to backend

**Rationale**:
- **Performance**: Eliminates network round-trip for file upload, resulting in faster feedback
- **Scalability**: Reduces backend server load - no file storage or processing overhead
- **Security**: Files never leave user's browser, reducing attack surface
- **Simplicity**: Reuses existing submit endpoint - no new backend API needed
- **User Experience**: Immediate validation and error feedback without waiting for server response
- **Cost**: No server storage costs for uploaded files

**Trade-offs**:
- Client-side parsing requires additional JavaScript library (xlsx ~500KB gzipped)
- Browser compatibility considerations (requires modern browsers with FileReader API)
- Limited error recovery compared to robust backend processing

**Alternative Considered**: Backend multipart/form-data upload endpoint similar to attendance template upload
**Why Rejected**: Envelope batch entry already has complete backend validation via POST endpoint, adding upload endpoint would duplicate logic

### Why Replace Grid Rows Instead of Append Mode?

**Decision**: Clear existing manual entries when uploading template

**Rationale**:
- **Data Integrity**: Prevents accidental duplication - template is source of truth for that upload session
- **User Intent**: User uploading template expects to see exactly template data, not mixed data
- **Simplicity**: Clear mental model - "upload replaces all" is easier to understand than merge logic
- **Validation Clarity**: All rows come from same source (template), reducing confusion
- **Undo**: User can cancel dialog and restart if upload was mistake

**Alternative Considered**: Append template rows to existing manual entries
**Why Rejected**: Risk of duplicate envelopes, unclear which data source is authoritative, confusing validation state

### Why Validate Sunday in Template vs Relying on Date Picker?

**Decision**: Enforce Sunday validation at template parse time before populating date picker

**Rationale**:
- **Early Error Detection**: Catches data entry errors in offline template before populating UI
- **Data Integrity**: Ensures template file contains correct day-of-week for audit trail
- **User Feedback**: Clear error message pointing to cell B1 helps user fix template file
- **Consistency**: Aligns with existing business rule that envelope collections only occur on Sundays

**Alternative Considered**: Allow any date in B1, rely on date picker's Sunday-only restriction
**Why Rejected**: Would populate grid with data but show invalid date, causing confusion

### Why Skip Empty Rows Instead of Treating as Zero Contribution?

**Decision**: Empty cells (blank register number or amount) are skipped, not treated as £0.00

**Rationale**:
- **Semantic Accuracy**: Empty cell means "no data" not "zero contribution"
- **Template Flexibility**: Users can leave gaps in template for formatting without creating invalid records
- **Consistency**: Matches attendance template upload behavior (empty = no entry)
- **Validation**: Prevents accidental submission of invalid records due to incomplete data entry

**Alternative Considered**: Treat empty amount as £0.00 contribution
**Why Rejected**: Zero-value contributions are unlikely to be genuine use case, more likely data entry error

### Why No Template Download Functionality?

**Decision**: Do not provide button to generate/download pre-filled Excel template

**Rationale**:
- **Simplicity**: Reduces feature scope for initial implementation
- **Flexibility**: Users can create templates in their preferred format (Excel, Google Sheets, Numbers)
- **IT Skills**: Church administrators typically comfortable creating simple Excel files
- **Column Headers**: Register numbers change yearly, generating template would require year selection complexity
- **Future Enhancement**: Can be added later if user feedback indicates need

**Alternative Considered**: Generate template with current year's register numbers pre-filled in Column A
**Why Rejected**: Template structure has data in rows (not columns), and users may prefer to maintain their own template with additional reference columns (member names, notes, etc.)

### Why 2MB File Size Limit?

**Decision**: Restrict template uploads to maximum 2MB

**Rationale**:
- **Typical Use Case**: 500 envelope entries with formatting = ~100KB, 2MB provides 20x buffer
- **Performance**: Larger files could freeze browser during parsing (JavaScript single-threaded)
- **Security**: Prevents denial-of-service via extremely large file uploads
- **Memory**: 2MB file fits comfortably in browser memory constraints

**Calculation**: 500 rows × 2 columns × ~50 bytes per cell + Excel overhead = ~50KB - 100KB uncompressed

## 8. Dependencies & External Integrations

### External Systems

- **EXT-001**: Excel file format (Office Open XML Spreadsheet - `.xlsx`) - Required for template structure compatibility

### Third-Party Services

- **SVC-001**: None - all processing is client-side and backend uses existing API

### Infrastructure Dependencies

- **INF-001**: Modern web browser with FileReader API support (Chrome 6+, Firefox 3.6+, Safari 6+, Edge 12+)
- **INF-002**: JavaScript enabled in browser

### Data Dependencies

- **DAT-001**: ChurchMemberRegisterNumbers table with current year's register number assignments
- **DAT-002**: AspNetUsers table for audit trail (CreatedBy username from JWT)
- **DAT-003**: EnvelopeContributionBatch table with unique constraint on BatchDate
- **DAT-004**: ChurchMemberContributions table for individual contribution records

### Technology Platform Dependencies

- **PLT-001**: React 18+ - Required for component architecture and hooks
- **PLT-002**: TypeScript 5.x - Required for type safety
- **PLT-003**: xlsx (SheetJS Community Edition) 0.18+ - Required for client-side Excel file parsing
  - Alternative: exceljs 4.x if xlsx licensing becomes concern
- **PLT-004**: Material-UI 7.x - Required for Button, input, notification components
- **PLT-005**: Modern ES2020+ JavaScript features (FileReader, async/await, Promise)

### Compliance Dependencies

- **COM-001**: None specific to this feature - inherits existing data privacy controls from envelope contribution system

## 9. Examples & Edge Cases

### Example 1: Successful Template Upload with 5 Envelopes

**Scenario**: User maintains Excel template offline with 5 envelope entries and uploads it

**Template File** (`Envelope-Upload-Template.xlsx`):
```
A1: [empty]
B1: 2026-02-16

A2: Member Number
B2: Amount

A3: 1
B3: 25.50

A4: 5
B4: 50.00

A5: 12
B5: 30.00

A6: 8
B6: 45.75

A7: 20
B7: 100.00
```

**User Steps**:
1. Open "Envelope Batch Entry" dialog
2. Click "Upload Template" button
3. Select `Envelope-Upload-Template.xlsx` file
4. Review populated grid showing 5 rows with member names
5. Verify footer shows "Total Envelopes: 5" and "Total Amounts: £251.25"
6. Click "Submit Upload"

**Expected Result**:
- Date picker populated with "02/16/2026"
- Grid shows 5 rows with register numbers 1, 5, 12, 8, 20
- Member names displayed for each valid register number
- Footer totals accurate
- Batch successfully submitted to backend

### Example 2: Template with Invalid Register Number

**Scenario**: Template contains register number not in current year's assignments

**Template File**:
```
B1: 2026-02-16

A3: 1    | B3: 25.50
A4: 999  | B4: 50.00  (Invalid - register 999 not assigned)
A5: 12   | B5: 30.00
```

**Expected Result**:
- Upload succeeds with warning: "Template uploaded successfully. 3 envelopes loaded. Please review and submit."
- Grid shows 3 rows
- Row 2 (register 999) displays red error: "Invalid member number" or "Member not found"
- Submit button remains disabled due to validation error
- User can edit register 999 to valid number or delete row

### Example 3: Template with Non-Sunday Date

**Scenario**: User accidentally enters Monday date in cell B1

**Template File**:
```
B1: 2026-02-17  (Monday)

A3: 1  | B3: 25.50
A4: 5  | B4: 50.00
```

**Expected Result**:
- Error notification: "Collection date in template must be a Sunday. Found: Monday."
- Grid remains empty (not populated)
- Date picker unchanged
- User can cancel and fix template file

### Example 4: Template with Partial Data (Missing Amounts)

**Scenario**: Template has register numbers but some amounts are blank

**Template File**:
```
B1: 2026-02-16

A3: 1  | B3: 25.50
A4: 5  | B4: [empty]   (Missing amount)
A5: 12 | B5: 30.00
A6: 8  | B6: [empty]   (Missing amount)
```

**Expected Result**:
- Warning notification: "Template loaded with warnings: Row 4: Amount missing for Register Number 5, Row 6: Amount missing for Register Number 8"
- Grid shows 2 rows (only rows 3 and 5 with complete data)
- Footer shows "Total Envelopes: 2" and "Total Amounts: £55.50"
- User can manually add missing rows if needed

### Example 5: Large Template with 300 Envelopes

**Scenario**: Church has 300 active members and processes large weekly collection

**Template File**:
```
B1: 2026-02-16

A3-A302: 300 register numbers
B3-B302: 300 amount values
```

**Expected Result**:
- Template parses successfully (file size ~15KB well under 2MB limit)
- Parsing completes within 2-3 seconds
- Grid displays all 300 rows (with scrolling)
- Footer calculates total accurately
- Validation runs asynchronously for all 300 register numbers
- Submit processes all 300 contributions in single batch

### Example 6: Editing After Upload

**Scenario**: User uploads template but notices one amount is incorrect

**User Steps**:
1. Upload template with 10 envelopes
2. Review grid and spot register 5 should be £60.00 not £50.00
3. Click into Amount field for register 5
4. Change value from "50.00" to "60.00"
5. Footer "Total Amounts" updates from £500.00 to £510.00
6. Click "Submit Upload"

**Expected Result**:
- Grid remains editable after upload
- Real-time validation continues to work
- Footer recalculates on any change
- Modified data submitted (not original template values)

### Example 7: Empty Template File

**Scenario**: User uploads template file with only headers, no data rows

**Template File**:
```
B1: 2026-02-16

A2: Member Number
B2: Amount

(No rows 3+)
```

**Expected Result**:
- Error notification: "No envelope data found in template. Please ensure data starts from Row 3."
- Grid remains empty (or shows initial empty row)
- User can cancel and add data to template, or enter manually

### Example 8: Decimal Precision Handling

**Scenario**: Template contains amounts with more than 2 decimal places

**Template File**:
```
B1: 2026-02-16

A3: 1  | B3: 25.556  (3 decimals)
A4: 5  | B4: 50.999  (3 decimals)
```

**Expected Result**:
- Amounts rounded to 2 decimals during parse
- Grid shows "25.56" and "51.00"
- Footer calculates with rounded values: £76.56

### Example 9: Excel Date Formats

**Scenario**: Template uses various Excel date formats in B1

**Valid Formats**:
- `2026-02-16` (ISO string)
- `02/16/2026` (US locale)
- `16/02/2026` (UK locale)
- `44977` (Excel serial date for 2026-02-16)
- `February 16, 2026` (long date string)

**Expected Result**: All formats successfully parsed and recognized as Sunday 2026-02-16

### Example 10: Replacing Existing Manual Entries

**Scenario**: User has manually entered 3 envelopes, then decides to upload template instead

**User Steps**:
1. Manually enter 3 envelopes (registers 1, 2, 3) with amounts
2. Footer shows "Total Envelopes: 3"
3. User decides to switch to template with 10 envelopes
4. Click "Upload Template"
5. Select template file

**Expected Result**:
- Manual entries (registers 1, 2, 3) are cleared
- Grid now shows 10 template entries (different register numbers)
- Footer updates to "Total Envelopes: 10"
- No data duplication or merge conflicts

## 10. Validation Criteria

The implementation meets this specification when:

### Template Parsing

1. ✅ System successfully parses .xlsx files using xlsx JavaScript library
2. ✅ System extracts Collection Date from cell B1 in first worksheet
3. ✅ System validates B1 date is a Sunday before proceeding
4. ✅ System parses envelope data starting from Row 3 (Column A = Register Number, Column B = Amount)
5. ✅ System skips rows where both Column A and Column B are empty
6. ✅ System handles Excel serial dates, ISO strings, and locale date formats in B1
7. ✅ System rounds amounts to 2 decimal places
8. ✅ System validates register numbers are positive integers
9. ✅ System validates amounts are positive decimals
10. ✅ System collects all warnings and errors during parse (doesn't abort on first error)

### UI Integration

11. ✅ "Upload Template" button is visible in "Envelope Batch Entry" dialog
12. ✅ Button opens file picker restricted to .xlsx files only
13. ✅ File size validation rejects files larger than 2MB
14. ✅ Loading indicator displays during parsing
15. ✅ Upload is client-side only (no backend API call for parsing)

### Grid Population

16. ✅ Successful upload clears all existing grid rows
17. ✅ System populates Collection Date picker with B1 date
18. ✅ System creates grid row for each valid envelope entry
19. ✅ Grid rows display Register Number in first column and Amount in second column
20. ✅ Existing register number validation triggers automatically for all populated rows
21. ✅ Member names display for valid register numbers
22. ✅ Red error indicators display for invalid register numbers
23. ✅ Footer "Total Envelopes" updates to count of populated rows
24. ✅ Footer "Total Amounts" updates to sum of all amounts
25. ✅ Grid auto-scrolls to top after upload

### Editability

26. ✅ All grid rows remain fully editable after upload
27. ✅ User can modify register numbers and amounts
28. ✅ User can add new rows manually
29. ✅ User can delete populated rows
30. ✅ Validation re-runs when user edits register number
31. ✅ Footer totals update in real-time when user edits amounts or deletes rows

### Error Handling

32. ✅ Non-Sunday date in B1 displays error and prevents grid population
33. ✅ Empty or invalid B1 displays error
34. ✅ Empty template (no data rows) displays error
35. ✅ Partial data rows (missing register or amount) display warnings but load valid rows
36. ✅ Invalid register number formats display warnings and skip those rows
37. ✅ Invalid amount formats display warnings and skip those rows
38. ✅ Corrupted .xlsx files display clear error message
39. ✅ File size over 2MB displays error
40. ✅ Wrong file type (.xls, .csv) is rejected by file picker

### User Experience

41. ✅ Success notification displays envelope count loaded
42. ✅ Error notifications are specific and actionable
43. ✅ Warning notifications list problematic rows
44. ✅ Dialog remains open after upload errors (doesn't auto-close)
45. ✅ Parsing completes within 5 seconds for files up to 500 rows
46. ✅ UI remains responsive during parsing (no freezing)

### Submit Flow

47. ✅ Submit button enablement logic unchanged (requires valid date, valid envelopes, no errors)
48. ✅ Submit uses existing POST endpoint `/api/financial/envelope-contributions/batches`
49. ✅ Request payload matches existing SubmitEnvelopeBatchRequest structure
50. ✅ Server-side validation (Sunday check, duplicate batch, register numbers) runs as before

### Permissions

51. ✅ Upload Template button respects existing dialog permissions (FinancialContributor+)
52. ✅ No additional permission checks required
53. ✅ FinancialViewer users cannot access dialog (existing restriction)

### Security

54. ✅ Client-side parsing does not execute macros or scripts from Excel file
55. ✅ File name is sanitized to prevent XSS
56. ✅ Parsed data goes through same validation as manual entry
57. ✅ No sensitive data exposed in browser console logs

### Browser Compatibility

58. ✅ Feature works in Chrome 90+
59. ✅ Feature works in Firefox 88+
60. ✅ Feature works in Safari 14+
61. ✅ Feature works in Edge 90+
62. ✅ Graceful degradation if FileReader API unavailable (show error)

## 11. Related Specifications / Further Reading

### Internal Specifications

- [Envelope Contribution System Specification](envelope-contribution-spec.md) - Core envelope batch entry system and manual data entry
- [Church Attendance Template Upload Specification](church-attendance-template-upload-spec.md) - Similar template upload pattern for attendance records (inspiration for this feature)

### External Documentation - Technical

- [SheetJS xlsx Library](https://docs.sheetjs.com/) - Client-side Excel file parsing library documentation
- [Office Open XML Spreadsheet Format](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-xlsx/) - Microsoft's .xlsx file format specification
- [MDN FileReader API](https://developer.mozilla.org/en-US/docs/Web/API/FileReader) - Browser API for reading files client-side
- [MDN File API](https://developer.mozilla.org/en-US/docs/Web/API/File) - Browser API for file handling
- [React File Upload Patterns](https://react.dev/reference/react-dom/components/input#reading-files-that-the-user-chose) - React official docs on file inputs
- [Material-UI File Upload Component](https://mui.com/material-ui/react-button/#file-upload) - MUI button patterns for file uploads

### Architecture Documentation

- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) - Overall system architecture
- [docs/error-handling-patterns.md](../docs/error-handling-patterns.md) - Error handling conventions for frontend
- [docs/security-configuration.md](../docs/security-configuration.md) - Security best practices and JWT authentication
