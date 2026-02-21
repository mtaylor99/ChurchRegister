---
title: Church Attendance Template Upload - Excel-Based Bulk Attendance Record Management
version: 1.0
date_created: 2026-02-13
last_updated: 2026-02-13
owner: Church Register Development Team
tags:
  [attendance, data-processing, excel-upload, bulk-operations, event-management]
---

# Introduction

This specification defines a comprehensive system for managing church attendance records through Excel template uploads. The system allows users to maintain attendance data offline in a standardized Excel template and bulk upload weekly attendance records. This addresses the need for efficient data entry, particularly when multiple events occur each week. The system includes event type management with day-of-week associations, template-based upload functionality with intelligent merge logic, and data validation to ensure accuracy.

## 1. Purpose & Scope

This specification covers:

- Event management with day-of-week association and default event type seeding
- Excel template structure for offline attendance data maintenance
- Bulk upload endpoint for processing Excel templates
- Intelligent merge logic (create, update, or skip unchanged records)
- Date picker restrictions based on event day-of-week
- Data validation and error handling for template uploads
- User permissions and role-based access control
- Integration with existing attendance analytics and reporting

**Intended Audience**: Backend developers, frontend developers, database administrators, QA engineers, and system architects.

**Assumptions**:

- Events table exists with Id, Name, Description, IsActive, ShowInAnalysis fields
- EventAttendance table exists with Id, EventId, Date, Attendance fields
- Users have appropriate permissions for attendance data management
- Excel file processing library (e.g., EPPlus, ClosedXML) is available in the stack
- Existing attendance recording and analytics features remain functional

## 2. Definitions

- **Event Type**: A recurring church activity/service with a specific day of the week (e.g., Sunday Morning Service)
- **Day of Week**: The specific day (Sunday through Saturday) when an event typically occurs
- **Attendance Template**: A standardized Excel file (.xlsx format) containing attendance records organized by event types
- **Template Upload**: The process of importing attendance records from an Excel file into the database
- **Merge Logic**: The algorithm that determines whether to create, update, or skip an attendance record based on existing data
- **Attendance Record**: A single entry associating an event, date, and attendance count
- **AttendanceViewer**: User role with read-only access to view attendance records and analytics
- **AttendanceContributor**: User role with permission to manually record attendance and upload templates
- **AttendanceAdministrator**: User role with full attendance permissions including event management and template uploads
- **SystemAdministrator**: User role with complete system access and all permissions
- **Template Truncation**: The condition where older records are removed from the template to reduce file size

## 3. Requirements, Constraints & Guidelines

### Event Type Management

- **REQ-001**: Events entity MUST be extended with a DayOfWeek field (nullable integer, 0=Sunday, 6=Saturday)
- **REQ-002**: System MUST clear existing event types and seed default event types with associated days of week from blank on initial migration
- **REQ-003**: Default seeded events MUST be:
  - Sunday Morning Online (Sunday - 0)
  - Sunday Morning Service (Sunday - 0)
  - Junior Church (Sunday - 0)
  - Coffee Corner (Sunday - 0)
  - Sunday Evening Service (Sunday - 0)
  - Sunday Evening Call (Sunday - 0)
  - Just A Thought (Monday - 1)
  - Men's Fellowship (Monday - 1)
  - Tuesday Morning Service (Tuesday - 2)
  - Bible Study (Tuesday - 2)
  - Open Door (Wednesday - 3)
  - Soup Station (Wednesday - 3)
  - Choir (Thursday - 4)
  - Youth Meeting (Friday - 5)
  - Torch (Saturday - 6)
- **REQ-004**: System MUST allow administrators to manually create new event types with optional day-of-week
- **REQ-005**: Events without an assigned DayOfWeek MUST allow selection of any date in date pickers
- **REQ-006**: Manual attendance entry date picker MUST restrict date selection to the event's designated day of week
- **REQ-007**: Date picker MUST disable all dates except those matching the event's DayOfWeek value
- **REQ-008**: Event management UI MUST include day-of-week dropdown (None, Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday)
- **REQ-009**: Existing events without DayOfWeek values remain functional with no date restrictions

### Database Schema Changes

- **SCH-001**: Add nullable DayOfWeek column to Events table (data type: int?, range 0-6)
- **SCH-002**: Create database migration to add DayOfWeek field
- **SCH-003**: Migration MUST update existing event records with appropriate DayOfWeek values based on event names
- **SCH-004**: Migration MUST handle any existing events not in the default list by leaving DayOfWeek as null
- **SCH-005**: Ensure unique index on EventAttendance (EventId, Date) remains enforced

### Excel Template Structure

- **REQ-010**: Template MUST be an .xlsx file format (Excel 2007+)
- **REQ-011**: ~~Removed - filename not enforced~~
- **REQ-012**: Template structure MUST contain:
  - Row 1: Day-of-week header row with "Date" in column A, followed by day names (e.g., "Sunday", "Monday") with merged cells spanning their event columns
  - Row 2: Event name header row with "Date" in column A, followed by specific event names under their respective day-of-week merged cells
  - Row 3+: Data rows with date in column A (formatted as date), attendance counts in event columns
- **REQ-013**: Date column (Column A) MUST contain dates in recognizable date format (ISO 8601 preferred, locale dates acceptable)
- **REQ-014**: Event columns MUST match event names exactly (case-insensitive comparison during processing)
- **REQ-015**: Empty cells in attendance columns MUST be treated as "no data" (not zero)
- **REQ-016**: Template MAY omit events (columns) that are not tracked
- **REQ-017**: Template MAY contain additional event columns; if the event name matches an active event in the database, it will be processed; otherwise it will be logged as a warning and ignored
- **REQ-018**: Template rows can be added incrementally (new weeks appended to bottom)
- **REQ-019**: Template date column MUST be chronologically sorted (oldest to newest) for clarity
- **REQ-020**: Template MAY include example/instructions rows that system ignores (automatically detected as non-date values)
- **REQ-021**: System MUST handle merged cells in header rows (row 1 contains day-of-week groupings, row 2 contains event names)

### Template Upload Processing

- **REQ-022**: System MUST provide a "Upload Attendance Template" button on the Attendance page
- **REQ-023**: Upload endpoint MUST accept .xlsx files up to 5MB in size
- **REQ-024**: System MUST validate file format before processing (reject non-Excel files)
- **REQ-025**: System MUST parse row 2 (event name header row) to identify event columns by name, ignoring row 1 (day-of-week grouping row)
- **REQ-026**: System MUST match event names case-insensitively to database Events.Name
- **REQ-027**: System MUST log warnings for unrecognized event column names (not fail upload)
- **REQ-028**: System MUST parse each data row (starting from row 3):
  - Extract date from column A
  - Validate date is valid and parseable
  - Skip rows with invalid/missing dates
  - Process attendance values for each event column
- **REQ-029**: System MUST handle various date formats gracefully (Excel serial dates, ISO strings, locale strings)
- **REQ-030**: Empty cells or non-numeric values in attendance columns MUST be treated as "no entry" (not zero, skip creation)
- **REQ-031**: System MUST process attendance values as integers (round decimals if present)
- **REQ-032**: Negative attendance values MUST be rejected with validation warning
- **REQ-033**: System MUST implement transaction-based processing (all-or-nothing approach optional, row-by-row with error collection preferred)

### Merge Logic (Create/Update/Skip)

- **REQ-034**: For each attendance entry in the template, system MUST:
  1. Check if EventAttendance record exists for (EventId, Date)
  2. If does not exist: Create new record with template values
  3. If exists and attendance value differs: Update existing record with template value
  4. If exists and attendance value matches: Skip (no database operation)
- **REQ-035**: Merge operations MUST respect audit trail fields (CreatedBy, CreatedDateTime, ModifiedBy, ModifiedDateTime)
- **REQ-036**: Created records MUST set CreatedBy to current user username
- **REQ-037**: Updated records MUST set ModifiedBy to current user username and ModifiedDateTime to current timestamp
- **REQ-038**: Unchanged records MUST not have ModifiedBy or ModifiedDateTime updated
- **REQ-039**: System MUST generate upload summary report showing:
  - Total rows processed
  - Records created (count)
  - Records updated (count)
  - Records skipped (unchanged)
  - Records failed (with reasons)
- **REQ-040**: Upload process MUST continue processing all rows even if some fail (collect errors, don't abort)
- **REQ-041**: System MUST return detailed error messages for each failed row (row number, event, date, reason)

### Template Truncation Handling

- **REQ-042**: If an attendance record exists in database but NOT in uploaded template, system MUST do nothing
- **REQ-043**: System MUST NOT delete EventAttendance records missing from template
- **REQ-044**: This design assumes users truncate old data from template to manage file size
- **REQ-045**: Upload summary MUST NOT report "missing" records from template as warnings or errors
- **REQ-046**: Documentation MUST clarify that template truncation is safe and expected behavior

### Security & Permissions

- **SEC-001**: Upload attendance template endpoint MUST require authentication (Bearer token)
- **SEC-002**: Upload MUST be restricted to users with roles:
  - SystemAdministrator
  - AttendanceAdministrator
  - AttendanceContributor
- **SEC-003**: AttendanceViewer role MUST NOT have upload permissions
- **SEC-004**: System MUST validate user permissions before processing upload
- **SEC-005**: System MUST log all upload attempts with username, timestamp, and outcome
- **SEC-006**: Failed uploads due to permissions MUST return HTTP 403 Forbidden
- **SEC-007**: File upload endpoint MUST validate content type (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)
- **SEC-008**: System MUST sanitize filename to prevent path traversal attacks
- **SEC-009**: Uploaded files MUST NOT be persisted to disk (process in memory or temp location with immediate cleanup)

### Error Handling & Validation

- **ERR-001**: System MUST validate that at least one valid event column exists in template
- **ERR-002**: System MUST return HTTP 400 Bad Request if no recognizable event columns found
- **ERR-003**: System MUST validate file is not empty and contains at least header row
- **ERR-004**: System MUST provide clear error messages identifying specific issues (row numbers, column names)
- **ERR-005**: Upload response MUST include:
  - Success status (true/false)
  - Summary statistics (created, updated, skipped, failed counts)
  - Array of errors with details (row, event, date, message)
  - Warning messages (unrecognized columns, skipped rows)
- **ERR-006**: System MUST handle large templates gracefully (chunked processing if needed for performance)
- **ERR-007**: If template processing exceeds timeout threshold (e.g., 60 seconds), system MUST abort and return partial results
- **ERR-008**: System MUST rollback transaction if critical error occurs (database connection loss, etc.)
- **ERR-009**: Non-critical errors (individual row failures) MUST NOT rollback entire upload

### UI/UX Guidelines

- **GUD-001**: Upload button should be prominently placed on Attendance page near "Add Attendance" button
- **GUD-002**: Upload modal SHOULD display file selection interface with drag-and-drop support
- **GUD-003**: UI SHOULD show upload progress indicator during processing
- **GUD-004**: After upload completion, UI SHOULD display detailed results summary with counts
- **GUD-005**: UI SHOULD allow users to download error report if any rows failed
- **GUD-006**: Success notification SHOULD clearly state number of records created, updated, and skipped
- **GUD-007**: UI SHOULD provide link to download empty/example template
- **GUD-008**: Template download link SHOULD be available on Attendance page and in upload modal
- **GUD-009**: Date picker for manual entry SHOULD visually indicate restricted days (grey out unavailable dates)
- **GUD-010**: Event form SHOULD display selected day-of-week clearly when set

### Performance Constraints

- **CON-001**: Template processing MUST complete within 60 seconds for files with up to 1000 rows
- **CON-002**: System SHOULD use batch insert/update operations where possible to minimize database round-trips
- **CON-003**: Memory consumption during processing SHOULD not exceed 100MB for typical templates
- **CON-004**: System SHOULD process rows in batches of 50-100 to balance memory and performance
- **CON-005**: Upload endpoint SHOULD use asynchronous processing for files with more than 500 rows

### Data Integrity Patterns

- **PAT-001**: Use optimistic concurrency control if EventAttendance has concurrency token
- **PAT-002**: Implement idempotent upload logic (uploading same template twice yields same result)
- **PAT-003**: Follow Clean Architecture pattern: Create use cases for UploadAttendanceTemplate and ProcessAttendanceRow
- **PAT-004**: Use builder pattern for constructing EventAttendance entities during processing
- **PAT-005**: Implement repository pattern for EventAttendance data access
- **PAT-006**: Use value objects for date validation and normalization
- **PAT-007**: Leverage entity framework change tracking for update detection if beneficial

## 4. Interfaces & Data Contracts

### API Endpoint

```
POST /api/attendance/upload-template
Content-Type: multipart/form-data
Authorization: Bearer {token}

Request Body:
- file: (binary Excel file)

Response (200 OK):
{
  "success": true,
  "summary": {
    "totalRows": 52,
    "recordsCreated": 15,
    "recordsUpdated": 10,
    "recordsSkipped": 25,
    "recordsFailed": 2
  },
  "errors": [
    {
      "row": 15,
      "event": "Sunday Morning Service",
      "date": "2026-02-25",
      "message": "Attendance value must be a positive integer"
    },
    {
      "row": 28,
      "date": "invalid-date",
      "message": "Unable to parse date value"
    }
  ],
  "warnings": [
    "Column 'Special Event' does not match any active event type and was ignored"
  ]
}

Response (400 Bad Request):
{
  "success": false,
  "error": "No valid event columns found in template. Expected columns matching event names."
}

Response (403 Forbidden):
{
  "success": false,
  "error": "User does not have permission to upload attendance templates"
}
```

### Events Entity Extension

```csharp
public class Events : IAuditableEntity
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;

    public bool ShowInAnalysis { get; set; } = true;

    // NEW FIELD
    /// <summary>
    /// Day of week when this event typically occurs (0=Sunday, 6=Saturday).
    /// Null indicates no specific day restriction.
    /// </summary>
    [Range(0, 6)]
    public int? DayOfWeek { get; set; }

    // Navigation property
    public virtual ICollection<EventAttendance> EventAttendances { get; set; } = new List<EventAttendance>();

    // Audit properties
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedDateTime { get; set; }
    public string? ModifiedBy { get; set; }
    public DateTime? ModifiedDateTime { get; set; }
}
```

### Excel Template Structure

#### Row 1 (Day-of-Week Header with Merged Cells):

| A    | B-F (merged) | G-H (merged) | I (merged)  | J-K (merged)  | ... |
| ---- | ------------ | ------------ | ----------- | ------------- | --- |
| Date | **Sunday**   | **Monday**   | **Tuesday** | **Wednesday** | ... |

#### Row 2 (Event Name Header):

| A    | B                     | C                      | D             | E             | F                      | G              | H                | I                       | J           | K         | ... |
| ---- | --------------------- | ---------------------- | ------------- | ------------- | ---------------------- | -------------- | ---------------- | ----------------------- | ----------- | --------- | --- |
| Date | Sunday Morning Online | Sunday Morning Service | Junior Church | Coffee Corner | Sunday Evening Service | Just A Thought | Men's Fellowship | Tuesday Morning Service | Bible Study | Open Door | ... |

#### Row 3+ (Data):

| A          | B   | C   | D   | E   | F   | G   | H   | I   | J   | K   | ... |
| ---------- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-01-04 | 85  | 92  | 18  | 12  | 42  |     |     |     |     |     | ... |
| 2026-01-06 |     |     |     |     |     | 35  |     |     |     |     | ... |
| 2026-01-07 |     |     |     |     |     |     |     | 40  | 28  |     | ... |
| 2026-01-11 | 78  | 95  | 20  | 15  | 38  |     |     |     |     |     | ... |
| ...        | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... |

**Note**: Row 1 contains day-of-week labels with merged cells spanning multiple event columns. Row 2 contains the actual event names used for matching. Data rows start from row 3.

### Upload Request/Response Models

```csharp
namespace ChurchRegister.ApiService.Models.Attendance;

public class UploadAttendanceTemplateRequest
{
    public IFormFile File { get; set; } = null!;
}

public class UploadAttendanceTemplateResponse
{
    public bool Success { get; set; }
    public UploadSummary Summary { get; set; } = new();
    public List<UploadError> Errors { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
}

public class UploadSummary
{
    public int TotalRows { get; set; }
    public int RecordsCreated { get; set; }
    public int RecordsUpdated { get; set; }
    public int RecordsSkipped { get; set; }
    public int RecordsFailed { get; set; }
}

public class UploadError
{
    public int Row { get; set; }
    public string? Event { get; set; }
    public string? Date { get; set; }
    public string Message { get; set; } = string.Empty;
}
```

### TypeScript Interfaces

```typescript
export interface UploadAttendanceTemplateResponse {
  success: boolean;
  summary: UploadSummary;
  errors: UploadError[];
  warnings: string[];
}

export interface UploadSummary {
  totalRows: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsSkipped: number;
  recordsFailed: number;
}

export interface UploadError {
  row: number;
  event?: string;
  date?: string;
  message: string;
}

export interface Event {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  showInAnalysis: boolean;
  dayOfWeek?: number; // 0-6, null if unrestricted
  createdAt: string;
  createdBy: string;
  lastModifiedAt?: string;
  lastModifiedBy?: string;
}
```

## 5. Acceptance Criteria

- **AC-001**: Given Events table migration completed, When querying Events, Then DayOfWeek field exists and is nullable
- **AC-002**: Given default events are seeded, When querying Events table, Then 15 default events exist with appropriate DayOfWeek values
- **AC-003**: Given event has DayOfWeek=0 (Sunday), When selecting date in manual entry form, Then only Sundays are enabled in date picker
- **AC-004**: Given event has DayOfWeek=null, When selecting date in manual entry form, Then all dates are enabled in date picker
- **AC-005**: Given valid Excel template uploaded, When processing template, Then records are created for new date-event combinations
- **AC-006**: Given template with existing attendance record at same value, When processing template, Then record is skipped without update
- **AC-007**: Given template with existing attendance record at different value, When processing template, Then record is updated with new value
- **AC-008**: Given template with invalid date in row, When processing template, Then row is skipped and error recorded with row number
- **AC-009**: Given template with unrecognized event column (not in database), When processing template, Then column is ignored and warning returned
- **AC-010**: Given template uploaded by AttendanceContributor, When processing completes, Then upload succeeds and records created with correct CreatedBy
- **AC-011**: Given template uploaded by AttendanceViewer, When attempting upload, Then HTTP 403 Forbidden is returned
- **AC-012**: Given uploaded template has 50 rows, When processing completes, Then summary returns accurate counts for created/updated/skipped/failed
- **AC-013**: Given database has attendance records not in template, When processing template, Then existing records remain unchanged
- **AC-014**: Given template has negative attendance value, When processing row, Then error is recorded and row is skipped
- **AC-015**: Given template has empty attendance cell, When processing row, Then that event-date combination is skipped (no zero value created)
- **AC-016**: Given administrator navigates to Event Management, When creating new event, Then day-of-week dropdown is available
- **AC-017**: Given uploaded template with 100 valid rows, When processing completes, Then upload finishes within 10 seconds
- **AC-018**: Given malformed non-Excel file uploaded, When processing begins, Then HTTP 400 Bad Request returned with appropriate error message
- **AC-019**: Given successful upload with warnings, When viewing results, Then UI displays summary and allows download of error details
- **AC-020**: Given attendance analytics page, When viewing charts, Then newly uploaded attendance data appears in analytics

## 6. Test Automation Strategy

### Test Levels

- **Unit Tests**:
  - Excel parsing logic (row parsing, date extraction, event column matching)
  - Merge logic (create/update/skip decision making)
  - Validation rules (date formats, attendance values, event matching)
  - DayOfWeek date picker filtering logic
- **Integration Tests**:
  - Full template upload process with database operations
  - Event seeding migration verification
  - API endpoint authentication and authorization
  - Database transaction handling and rollback scenarios
- **End-to-End Tests**:
  - Complete upload workflow from UI to database
  - Day-of-week restricted date picker behavior
  - Error handling and user feedback display
  - Template download and re-upload idempotency

### Testing Frameworks

- **Backend**: MSTest, FluentAssertions, Moq for mocking
- **Frontend**: Vitest, React Testing Library, MSW for API mocking
- **Excel Processing**: In-memory test templates created programmatically

### Test Data Management

- **Test Templates**: Create fixture Excel files with various scenarios:
  - Valid complete template with merged cells in row 1
  - Template with missing dates
  - Template with invalid attendance values
  - Template with unrecognized event columns
  - Template with manually added events (matching database)
  - Large template (1000+ rows) for performance testing
- **Test Database**: Use in-memory database or test container with seeded events

### CI/CD Integration

- **Automated Testing**: Run full test suite on every pull request
- **Code Coverage**: Maintain minimum 80% coverage for upload processing logic
- **Performance Testing**: Automated benchmark for template processing speed

### Coverage Requirements

- **Critical Paths**: 95% coverage for merge logic, validation, and security checks
- **UI Components**: 80% coverage for upload modal and date picker components
- **Error Handling**: 90% coverage for error scenarios and validation

## 7. Rationale & Context

### Design Decisions

**Why Excel Upload vs. Manual Entry Only?**

- Church administrators often maintain attendance records offline during the week
- Bulk upload reduces data entry time significantly (weekly batch vs. individual entries)
- Excel format is familiar to non-technical users
- Allows offline work and batch processing on a weekly schedule

**Why Merge Logic (Create/Update/Skip) vs. Replace All?**

- Preserves audit trail for records entered manually
- Allows incremental updates without re-entering all historical data
- Supports correction of errors without full re-upload
- Prevents accidental data loss from template truncation

**Why Not Delete Missing Records?**

- Templates are expected to be truncated over time to reduce file size
- Deletion would be destructive and error-prone
- Manual deletion through UI is safer for corrections
- Template is not the source of truth, database is

**Why Day-of-Week Association?**

- Prevents data entry errors (entering Sunday service on Wednesday)
- Simplifies date picker UX by removing irrelevant dates
- Matches real-world church scheduling patterns
- Improves data quality through validation

**Why Nullable DayOfWeek?**

- Supports special events without fixed schedules
- Maintains backward compatibility with existing events
- Allows flexibility for seasonal or one-time events

### Alternative Approaches Considered

**CSV Upload Instead of Excel**: Rejected because Excel is more user-friendly for tabular data and supports better formatting

**Real-Time Sync with Cloud Sheet**: Rejected due to complexity, security concerns, and requirement for constant connectivity

**Automatic Weekly Import**: Rejected because processing should be explicit and user-initiated for better control

## 8. Dependencies & External Integrations

### External Systems

- **EXT-001**: Excel File Parsing Library - Requires EPPlus, ClosedXML, or similar library for reading .xlsx files

### Third-Party Services

- **SVC-001**: No third-party services required (purely internal processing)

### Infrastructure Dependencies

- **INF-001**: File Upload Support - Web server must support multipart/form-data with file uploads up to 5MB
- **INF-002**: Temporary File Storage - System needs temp storage or memory capacity for file processing
- **INF-003**: Database Transaction Support - Entity Framework Core with transaction capabilities

### Data Dependencies

- **DAT-001**: Events Table - Must have existing events with names matching template columns
- **DAT-002**: EventAttendance Table - Must exist with unique constraint on (EventId, Date)
- **DAT-003**: User Authentication - Active authentication system providing user identity claims

### Technology Platform Dependencies

- **PLT-001**: .NET 8 or higher - Required for API endpoint implementation
- **PLT-002**: Entity Framework Core - For database operations and migrations
- **PLT-003**: React 18+ - For frontend upload UI components
- **PLT-004**: Material-UI - For date picker components with day-of-week restrictions

### Compliance Dependencies

- **COM-001**: Data Protection - Uploaded files must be handled in compliance with data protection policies (no persistent storage of templates)

## 9. Examples & Edge Cases

### Example Template Upload Scenario

```
Template Contents:
Date            | Sunday Morning Service | Bible Study | Youth Meeting
2026-01-04      | 85                    | 30          |
2026-01-11      | 92                    | 28          | 22
2026-01-18      | 78                    | 32          | 20

Processing Results:
- Row 2: Sunday Morning Service (2026-01-04) = 85 → Created (new record)
- Row 2: Bible Study (2026-01-04) = 30 → Created (new record)
- Row 2: Youth Meeting (2026-01-04) = empty → Skipped (no entry)
- Row 3: Sunday Morning Service (2026-01-11) = 92 → Updated (was 90 in DB)
- Row 3: Bible Study (2026-01-11) = 28 → Skipped (matches DB)
- Row 3: Youth Meeting (2026-01-11) = 22 → Created (new record)
- Row 4: All entries processed similarly...

Summary:
- Total Rows: 3
- Records Created: 4
- Records Updated: 1
- Records Skipped: 1
- Records Failed: 0
```

### Edge Cases

**Edge Case 1: Template Uploaded Twice**

- First upload creates all records
- Second upload (same file) skips all records (idempotent)
- Summary shows 100% skipped

**Edge Case 2: Template with Future Dates**

- System accepts future dates (no restriction)
- Useful for planning/pre-entry

**Edge Case 3: Template Missing Event Column**

- Event exists in DB but not in template
- System processes other columns normally
- No error or warning (intentional flexibility)

**Edge Case 4: Template with Decimal Attendance**

- Value: 45.7
- System rounds to 46 (or truncates to 45, documented behavior)
- Warning logged but processing continues

**Edge Case 5: Template with Different Date Formats**

- Supports: 2026-01-04, 1/4/2026, 04-Jan-2026, Excel serial dates
- Parser attempts multiple formats
- Invalid format results in row error

**Edge Case 6: Empty Template (Header Only)**

- Zero data rows
- Returns success with 0 records processed
- No errors

**Edge Case 7: Concurrent Uploads**

- Two users upload templates simultaneously
- Database unique constraint prevents duplicates
- Second upload receives "already exists" errors for overlapping data

**Edge Case 8: Manually Added Event in Both System and Template**

- Administrator adds new event "Special Prayer Meeting" to database
- Template is updated to include "Special Prayer Meeting" column
- Upload processes this column correctly (matches active event in database)
- No warning generated

**Edge Case 9: Event Name Change After Template Creation**

- Template has old event name that doesn't exist in database
- Upload returns warning about unrecognized column
- Administrator must update template or database event name

**Edge Case 10: Sunday-Only Event on Template with Monday Date**

- Template has Sunday Morning Service with date 2026-01-05 (Monday)
- System creates record (no validation against event DayOfWeek during upload)
- This allows correction of manual entry errors
- Alternative: Add CHECK constraint on EventAttendance if strict validation desired

**Edge Case 11: Template with Merged Cells in Headers**

- Row 1 has merged cells for day-of-week groupings
- Parser reads row 2 for actual event names
- Row 1 merged cell values are ignored during event column identification
- System correctly identifies event columns from row 2

**Edge Case 12: Extremely Large Template (5000 rows)**

- System processes in batches
- May take longer than typical uploads
- Consider timeout and progress feedback

## 10. Validation Criteria

The following must be validated for compliance with this specification:

- ✅ DayOfWeek column exists in Events table as nullable integer (0-6)
- ✅ Database migration clears existing event types and seeds 15 default events with correct DayOfWeek values
- ✅ Manual attendance entry date picker restricts to event's day of week
- ✅ Upload endpoint accepts .xlsx files and rejects other formats
- ✅ Upload endpoint requires authentication and correct role permissions
- ✅ Template parsing correctly identifies event columns from row 2, ignoring row 1 merged day-of-week headers (case-insensitive matching)
- ✅ Template parsing handles various date formats correctly
- ✅ Merge logic creates new records for non-existent date-event combinations
- ✅ Merge logic updates records when attendance value differs
- ✅ Merge logic skips unchanged records without database operation
- ✅ Merge logic does not delete records missing from template
- ✅ Upload summary returns accurate counts for all operations
- ✅ Upload errors include row numbers and specific failure reasons
- ✅ Warnings are returned for unrecognized event columns
- ✅ Empty cells in attendance columns do not create zero-value records
- ✅ Negative attendance values are rejected with clear error message
- ✅ Audit fields (CreatedBy, ModifiedBy, timestamps) are correctly maintained
- ✅ Event management UI includes day-of-week selection
- ✅ Template processing completes within performance constraints (60s for 1000 rows)
- ✅ System remains stable under concurrent upload scenarios
- ✅ Integration tests cover full upload workflow with various template scenarios
- ✅ Unit tests achieve minimum code coverage thresholds
- ✅ End-to-end tests validate complete user journey from upload to analytics

## 11. Related Specifications / Further Reading

- [Envelope Contribution Specification](envelope-contribution-spec.md) - Similar bulk upload pattern
- [Church Attendance Specification](member-contributions-spec.md) - Manual attendance entry
- [Event Management Documentation](../docs/ARCHITECTURE.md) - Overall system architecture
- [HSBC Transactions Specification](hsbc-transactions-spec.md) - Another file upload pattern
- EPPlus Documentation: https://epplussoftware.com/docs/
- ClosedXML Documentation: https://github.com/ClosedXML/ClosedXML/wiki
- Entity Framework Core Transactions: https://learn.microsoft.com/en-us/ef/core/saving/transactions
