---
goal: Implement HSBC Bank Statement CSV Import Feature with Dashboard Widget, CSV Parser, and Duplicate Detection
version: 1.0
date_created: 2025-12-22
last_updated: 2025-12-22
owner: ChurchRegister Development Team
status: "In progress"
tags: [feature, financial, import, hsbc, dashboard, csv-parser]
---

# Introduction

![Status: In progress](https://img.shields.io/badge/status-In_progress-yellow)

Implement a complete HSBC bank statement CSV import feature accessible via a dashboard widget. This feature will enable financial administrators to:

- **Upload CSV Files**: Upload HSBC bank statement CSV files via modal dialog
- **Parse CSV Data**: Automatically detect column headers and parse transaction data
- **Extract References**: Extract payment references from transaction descriptions
- **Detect Duplicates**: Prevent duplicate imports using Date + Amount + Description matching
- **Import Credits Only**: Filter and import only credit transactions (MoneyIn > 0)
- **Track Progress**: Display progress bar during processing of large files
- **Audit Trail**: Record who uploaded and when for each transaction
- **Access Control**: Restrict access to FinancialAdministrator and FinancialContributor roles

**Key Deliverables**: Dashboard widget, CSV parser service, upload API endpoint, duplicate detection, and comprehensive testing.

## 1. Requirements & Constraints

### From Specification

- **REQ-001**: Dashboard widget visible only to FinancialAdministrator and FinancialContributor roles
- **REQ-002**: Modal dialog with CSV file upload control (accept .csv only)
- **REQ-003**: Parse HSBC CSV with auto-detection of columns: Date, Description, Money In, Money Out (ignored), Balance (ignored)
- **REQ-004**: Extract payment references from Description using "REF" keyword pattern
- **REQ-005**: Store empty string if no reference found
- **REQ-006**: Import only transactions with MoneyIn > 0
- **REQ-007**: Detect duplicates based on Date + MoneyIn + Description (exact match)
- **REQ-008**: Display progress bar during file processing
- **REQ-009**: Show upload summary: total processed, new imports, duplicates skipped, ignored (no MoneyIn)
- **REQ-010**: Store to HSBCBankCreditTransaction table with audit fields (CreatedBy, CreatedDateTime)

### Technical Constraints

- **CON-001**: HSBCBankCreditTransaction table already exists - no schema changes required
- **CON-002**: CSV parsing must handle quoted fields (commas within quotes)
- **CON-003**: Support alternative column names: "Date"/"Transaction Date", "Money In"/"Credit Amount"/"Credit"
- **CON-004**: Parse dates in UK format (DD/MM/YYYY) using en-GB culture
- **CON-005**: Maximum file size 10 MB
- **CON-006**: Description truncated at 500 chars, Reference at 100 chars
- **CON-007**: MoneyIn range: 0.01 to 999,999.99
- **CON-008**: Use database transaction for atomicity (rollback on error)

### Guidelines

- **GUD-001**: CSV files must not be persisted on server (process in memory only)
- **GUD-002**: Use indexed query for duplicate detection performance
- **GUD-003**: Process files with 1000+ transactions efficiently
- **GUD-004**: Provide clear, actionable error messages
- **GUD-005**: Follow existing ChurchRegister API patterns and conventions

## 2. Implementation Steps

### Phase 1: Backend Foundation - Models & DTOs

**GOAL-001**: Create all DTOs and request/response models for file upload and transaction import

| Task     | Description                                                                                                                 | Completed | Date       |
| -------- | --------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-001 | Create HsbcTransactionDto.cs with: Id, Date, Description, Reference, MoneyIn, CreatedBy, CreatedDateTime                    | ✅        | 2025-12-22 |
| TASK-002 | Create UploadHsbcStatementResponse.cs with: Success, Message, Summary{TotalProcessed, NewTransactions, Duplicates, Ignored} | ✅        | 2025-12-22 |
| TASK-003 | Create HsbcTransaction.cs (internal model) for parsed CSV data: Date, Description, Reference, MoneyIn                       | ✅        | 2025-12-22 |
| TASK-004 | Create HsbcParseResult.cs with: Transactions[], TotalRows, Errors[]                                                         | ✅        | 2025-12-22 |
| TASK-005 | Create ImportResult.cs with: TotalProcessed, NewTransactions, DuplicatesSkipped, IgnoredNoMoneyIn, Success, Errors[]        | ✅        | 2025-12-22 |

### Phase 2: Backend - CSV Parser Service

**GOAL-002**: Implement robust HSBC CSV parser with column auto-detection and reference extraction

| Task     | Description                                                                              | Completed | Date       |
| -------- | ---------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-006 | Create IHsbcCsvParser.cs interface with ParseAsync(Stream csvStream) method              | ✅        | 2025-12-22 |
| TASK-007 | Create HsbcCsvParser.cs service class                                                    | ✅        | 2025-12-22 |
| TASK-008 | Implement SplitCsvLine method to handle quoted fields with commas                        | ✅        | 2025-12-22 |
| TASK-009 | Implement header parsing and column index detection (case-insensitive matching)          | ✅        | 2025-12-22 |
| TASK-010 | Implement ParseDate method with UK culture (DD/MM/YYYY format)                           | ✅        | 2025-12-22 |
| TASK-011 | Implement ParseDecimal method with InvariantCulture                                      | ✅        | 2025-12-22 |
| TASK-012 | Implement Get method to retrieve values from column by multiple possible names           | ✅        | 2025-12-22 |
| TASK-013 | Implement main Parse logic: iterate rows, extract fields, create HsbcTransaction objects | ✅        | 2025-12-22 |
| TASK-014 | Add error handling for malformed rows (skip with logging, don't fail entire file)        | ✅        | 2025-12-22 |

### Phase 3: Backend - Reference Extraction

**GOAL-003**: Implement payment reference extraction from transaction descriptions

| Task     | Description                                                                                        | Completed | Date       |
| -------- | -------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-015 | Create HsbcReferenceExtractor.cs static class or extension method                                  | ✅        | 2025-12-22 |
| TASK-016 | Implement ExtractHsbcReference(string description) pure function                                   | ✅        | 2025-12-22 |
| TASK-017 | Search for " REF " marker (case-insensitive) in description                                        | ✅        | 2025-12-22 |
| TASK-018 | Extract text after " REF " until trailing token or end                                             | ✅        | 2025-12-22 |
| TASK-019 | Implement truncation at trailing tokens: " VIA ", " ONLINE BANKING", " MOBILE APP", " ON ", " AT " | ✅        | 2025-12-22 |
| TASK-020 | Return empty string if no " REF " marker found                                                     | ✅        | 2025-12-22 |
| TASK-021 | Trim leading/trailing whitespace from extracted reference                                          | ✅        | 2025-12-22 |

### Phase 4: Backend - Transaction Import Service

**GOAL-004**: Implement transaction import service with duplicate detection and database persistence

| Task     | Description                                                                                      | Completed | Date       |
| -------- | ------------------------------------------------------------------------------------------------ | --------- | ---------- |
| TASK-022 | Create IHsbcTransactionImportService.cs interface                                                | ✅        | 2025-12-22 |
| TASK-023 | Create HsbcTransactionImportService.cs injecting ChurchRegisterWebContext                        | ✅        | 2025-12-22 |
| TASK-024 | Implement ImportTransactionsAsync(List<HsbcTransaction>, string uploadedBy) method               | ✅        | 2025-12-22 |
| TASK-025 | Filter transactions: keep only those with MoneyIn > 0                                            | ✅        | 2025-12-22 |
| TASK-026 | Implement duplicate detection query: check Date + MoneyIn + Description against existing records | ✅        | 2025-12-22 |
| TASK-027 | Create HSBCBankCreditTransaction entities for new transactions                                   | ✅        | 2025-12-22 |
| TASK-028 | Set audit fields: CreatedBy = uploadedBy, CreatedDateTime = DateTime.UtcNow, Deleted = false     | ✅        | 2025-12-22 |
| TASK-029 | Call ExtractHsbcReference for each transaction to populate Reference field                       | ✅        | 2025-12-22 |
| TASK-030 | Wrap all database operations in a transaction (using BeginTransactionAsync)                      | ✅        | 2025-12-22 |
| TASK-031 | Return ImportResult with counts: total processed, new, duplicates, ignored                       | ✅        | 2025-12-22 |

### Phase 5: Backend - API Endpoint

**GOAL-005**: Create upload endpoint with file validation and authorization

| Task     | Description                                                                         | Completed | Date       |
| -------- | ----------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-032 | Create UploadHsbcStatementEndpoint.cs using FastEndpoints pattern                   | ✅        | 2025-12-22 |
| TASK-033 | Configure route: POST /api/financial/hsbc-transactions/upload                       | ✅        | 2025-12-22 |
| TASK-034 | Add authorization: require FinancialAdministrator OR FinancialContributor role      | ✅        | 2025-12-22 |
| TASK-035 | Accept IFormFile in request, validate .csv extension and file size (<= 10 MB)       | ✅        | 2025-12-22 |
| TASK-036 | Call IHsbcCsvParser.ParseAsync to parse uploaded file stream                        | ✅        | 2025-12-22 |
| TASK-037 | Validate required columns exist in parsed result                                    | ✅        | 2025-12-22 |
| TASK-038 | Get current user identifier from HttpContext for audit trail                        | ✅        | 2025-12-22 |
| TASK-039 | Call IHsbcTransactionImportService.ImportTransactionsAsync with parsed transactions | ✅        | 2025-12-22 |
| TASK-040 | Return UploadHsbcStatementResponse with success=true and summary                    | ✅        | 2025-12-22 |
| TASK-041 | Add error handling: return 400 for validation errors, 500 for server errors         | ✅        | 2025-12-22 |

### Phase 6: Backend - Service Registration

**GOAL-006**: Register services in dependency injection container

| Task     | Description                                                            | Completed | Date       |
| -------- | ---------------------------------------------------------------------- | --------- | ---------- |
| TASK-042 | Register IHsbcCsvParser as scoped service in Program.cs                | ✅        | 2025-12-22 |
| TASK-043 | Register IHsbcTransactionImportService as scoped service in Program.cs | ✅        | 2025-12-22 |
| TASK-044 | Verify ChurchRegisterWebContext is registered and available            | ✅        | 2025-12-22 |

### Phase 7: Database - Index Creation

**GOAL-007**: Add database index for efficient duplicate detection

| Task     | Description                                                                            | Completed | Date       |
| -------- | -------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-045 | Create migration for composite index on (Date, MoneyIn, Description) WHERE Deleted = 0 | ✅        | 2025-12-22 |
| TASK-046 | Name index: IX_HSBCBankCreditTransaction_DuplicateCheck                                | ✅        | 2025-12-22 |
| TASK-047 | Test migration in development environment                                              |           |            |
| TASK-048 | Verify index improves duplicate detection query performance                            |           |            |

### Phase 8: Frontend - TypeScript Types

**GOAL-008**: Create TypeScript interfaces for API integration

| Task     | Description                                                                                          | Completed | Date       |
| -------- | ---------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-049 | Create src/types/hsbcTransactions.ts file                                                            | ✅        | 2025-12-22 |
| TASK-050 | Define HsbcTransaction interface matching DTO                                                        | ✅        | 2025-12-22 |
| TASK-051 | Define UploadSummary interface: totalProcessed, newTransactions, duplicatesSkipped, ignoredNoMoneyIn | ✅        | 2025-12-22 |
| TASK-052 | Define UploadResponse interface: success, message, summary                                           | ✅        | 2025-12-22 |

### Phase 9: Frontend - API Client

**GOAL-009**: Implement API client for file upload with progress tracking

| Task     | Description                                                                              | Completed | Date       |
| -------- | ---------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-053 | Create src/services/api/hsbcTransactionsApi.ts file                                      | ✅        | 2025-12-22 |
| TASK-054 | Implement uploadHsbcStatement(file: File, onProgress?: (percent: number) => void) method | ✅        | 2025-12-22 |
| TASK-055 | Create FormData with file                                                                | ✅        | 2025-12-22 |
| TASK-056 | Configure axios request with onUploadProgress callback for progress tracking             | ✅        | 2025-12-22 |
| TASK-057 | Set Content-Type: multipart/form-data header                                             | ✅        | 2025-12-22 |
| TASK-058 | Handle response and return UploadResponse                                                | ✅        | 2025-12-22 |
| TASK-059 | Handle errors: network, validation, authorization                                        | ✅        | 2025-12-22 |

### Phase 10: Frontend - Dashboard Widget

**GOAL-010**: Create dashboard widget for bank statement import

| Task     | Description                                                                             | Completed | Date       |
| -------- | --------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-060 | Create src/components/Financial/BankStatementImportWidget.tsx component                 | ✅        | 2025-12-22 |
| TASK-061 | Use Material-UI Card component styled similar to existing dashboard widgets             | ✅        | 2025-12-22 |
| TASK-062 | Add icon (e.g., UploadFileIcon or AccountBalanceIcon) and title "Import Bank Statement" | ✅        | 2025-12-22 |
| TASK-063 | Add call-to-action button: "Upload HSBC Statement"                                      | ✅        | 2025-12-22 |
| TASK-064 | Implement click handler to open upload modal                                            | ✅        | 2025-12-22 |
| TASK-065 | Check user permissions: show only if FinancialAdministrator or FinancialContributor     | ✅        | 2025-12-22 |
| TASK-066 | Add widget to DashboardPage.tsx in appropriate grid position                            | ✅        | 2025-12-22 |

### Phase 11: Frontend - Upload Modal

**GOAL-011**: Create modal dialog for CSV file upload with progress indicator

| Task     | Description                                                              | Completed | Date       |
| -------- | ------------------------------------------------------------------------ | --------- | ---------- |
| TASK-067 | Create src/components/Financial/HsbcUploadModal.tsx component            | ✅        | 2025-12-22 |
| TASK-068 | Use Material-UI Dialog component with title "Upload HSBC Bank Statement" | ✅        | 2025-12-22 |
| TASK-069 | Add file input with accept=".csv" attribute                              | ✅        | 2025-12-22 |
| TASK-070 | Display instructions: "Select HSBC CSV export file"                      | ✅        | 2025-12-22 |
| TASK-071 | Add "Cancel" and "Upload" buttons (Upload disabled until file selected)  | ✅        | 2025-12-22 |
| TASK-072 | Implement file selection state (selectedFile)                            | ✅        | 2025-12-22 |
| TASK-073 | Add LinearProgress component (hidden initially, shown during upload)     | ✅        | 2025-12-22 |
| TASK-074 | Implement upload handler: call API with progress callback                | ✅        | 2025-12-22 |
| TASK-075 | Update progress bar during upload                                        | ✅        | 2025-12-22 |
| TASK-076 | Disable form controls during upload                                      | ✅        | 2025-12-22 |

### Phase 12: Frontend - Result Display

**GOAL-012**: Display upload results with summary information

| Task     | Description                                                                             | Completed | Date       |
| -------- | --------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-077 | Add success state to modal for displaying results                                       | ✅        | 2025-12-22 |
| TASK-078 | Display success Alert with summary: "X new transactions imported, Y duplicates skipped" | ✅        | 2025-12-22 |
| TASK-079 | Show breakdown: Total processed, New imports, Duplicates, Ignored (no MoneyIn)          | ✅        | 2025-12-22 |
| TASK-080 | Add error state for displaying validation/server errors                                 | ✅        | 2025-12-22 |
| TASK-081 | Display error Alert with clear message                                                  | ✅        | 2025-12-22 |
| TASK-082 | Add "Close" button to dismiss modal after viewing results                               | ✅        | 2025-12-22 |
| TASK-083 | Reset modal state when closed                                                           | ✅        | 2025-12-22 |

### Phase 13: Testing - Backend Unit Tests

**GOAL-013**: Comprehensive unit testing for parser and business logic

| Task     | Description                                                       | Completed | Date |
| -------- | ----------------------------------------------------------------- | --------- | ---- |
| TASK-084 | Create HsbcCsvParserTests.cs test class                           |           |      |
| TASK-085 | Test valid CSV parsing with all required columns                  |           |      |
| TASK-086 | Test alternative column names detection                           |           |      |
| TASK-087 | Test quoted fields with commas                                    |           |      |
| TASK-088 | Test missing required columns (should fail)                       |           |      |
| TASK-089 | Test empty file and single row file                               |           |      |
| TASK-090 | Create HsbcReferenceExtractorTests.cs test class                  |           |      |
| TASK-091 | Test standard reference extraction: "REF JOHN SMITH VIA ONLINE"   |           |      |
| TASK-092 | Test all trailing tokens: VIA, ONLINE BANKING, MOBILE APP, ON, AT |           |      |
| TASK-093 | Test no reference found (return empty string)                     |           |      |
| TASK-094 | Test edge cases: multiple REF markers, special characters         |           |      |

### Phase 14: Testing - Backend Integration Tests

**GOAL-014**: Integration testing for import service and API endpoint

| Task     | Description                                                          | Completed | Date |
| -------- | -------------------------------------------------------------------- | --------- | ---- |
| TASK-095 | Create HsbcTransactionImportServiceTests.cs using in-memory database |           |      |
| TASK-096 | Test importing new transactions                                      |           |      |
| TASK-097 | Test duplicate detection (same Date+Amount+Description)              |           |      |
| TASK-098 | Test filtering (ignore transactions with MoneyIn = 0 or null)        |           |      |
| TASK-099 | Test audit trail population (CreatedBy, CreatedDateTime)             |           |      |
| TASK-100 | Test transaction rollback on error                                   |           |      |
| TASK-101 | Create UploadHsbcStatementEndpointTests.cs                           |           |      |
| TASK-102 | Test successful upload with valid CSV file                           |           |      |
| TASK-103 | Test authorization: 403 for users without financial roles            |           |      |
| TASK-104 | Test file validation: reject non-CSV files, files > 10 MB            |           |      |
| TASK-105 | Test error responses for invalid CSV format                          |           |      |

### Phase 15: Testing - Frontend Component Tests

**GOAL-015**: Frontend component and integration testing

| Task     | Description                                           | Completed | Date |
| -------- | ----------------------------------------------------- | --------- | ---- |
| TASK-106 | Create BankStatementImportWidget.test.tsx with Vitest |           |      |
| TASK-107 | Test widget visibility based on user roles            |           |      |
| TASK-108 | Test modal opens when widget clicked                  |           |      |
| TASK-109 | Create HsbcUploadModal.test.tsx                       |           |      |
| TASK-110 | Test file selection and upload button state           |           |      |
| TASK-111 | Test upload process with mock API                     |           |      |
| TASK-112 | Test progress bar updates                             |           |      |
| TASK-113 | Test success message display with summary             |           |      |
| TASK-114 | Test error handling and error message display         |           |      |

### Phase 16: Testing - End-to-End Tests

**GOAL-016**: Complete user journey testing

| Task     | Description                                                    | Completed | Date |
| -------- | -------------------------------------------------------------- | --------- | ---- |
| TASK-115 | Create E2E test: User with financial role can access widget    |           |      |
| TASK-116 | Create E2E test: Upload valid HSBC CSV and verify results      |           |      |
| TASK-117 | Create E2E test: Upload file with duplicates, verify counts    |           |      |
| TASK-118 | Create E2E test: Verify transactions saved to database         |           |      |
| TASK-119 | Create E2E test: User without financial role cannot see widget |           |      |

### Phase 17: Documentation & Deployment

**GOAL-017**: Complete documentation and prepare for deployment

| Task     | Description                                                              | Completed | Date |
| -------- | ------------------------------------------------------------------------ | --------- | ---- |
| TASK-120 | Update API documentation/Swagger with new endpoint                       |           |      |
| TASK-121 | Create user guide: How to export CSV from HSBC online banking            |           |      |
| TASK-122 | Create user guide: How to upload bank statement                          |           |      |
| TASK-123 | Document error messages and troubleshooting                              |           |      |
| TASK-124 | Create admin guide: Understanding upload results and duplicate detection |           |      |
| TASK-125 | Update role permissions documentation                                    |           |      |
| TASK-126 | Verify database migration scripts for production deployment              |           |      |
| TASK-127 | Create sample HSBC CSV file for testing                                  |           |      |

## 3. Acceptance Criteria

### Feature Complete When:

1. ✅ Dashboard widget displays for FinancialAdministrator and FinancialContributor users only
2. ✅ Widget opens modal dialog with CSV file upload control
3. ✅ CSV parser correctly handles HSBC format with column auto-detection
4. ✅ Payment references extracted from descriptions using REF marker pattern
5. ✅ Duplicate transactions detected and skipped (Date+Amount+Description match)
6. ✅ Only credit transactions (MoneyIn > 0) are imported
7. ✅ Progress bar displays during file processing
8. ✅ Upload results show accurate summary: new, duplicates, ignored counts
9. ✅ Transactions saved with audit trail (CreatedBy, CreatedDateTime)
10. ✅ All unit tests pass with 80%+ coverage
11. ✅ All integration tests pass
12. ✅ E2E tests verify complete user journey
13. ✅ Documentation complete and accurate
14. ✅ Code review completed and approved

## 4. Technical Notes

### CSV Parser Implementation

```csharp
// Example of robust CSV line splitting with quote handling
private static string[] SplitCsvLine(string line)
{
    var result = new List<string>();
    bool inQuotes = false;
    var current = new StringBuilder();

    foreach (char c in line)
    {
        if (c == '"')
        {
            inQuotes = !inQuotes;
            continue;
        }

        if (c == ',' && !inQuotes)
        {
            result.Add(current.ToString());
            current.Clear();
        }
        else
        {
            current.Append(c);
        }
    }

    result.Add(current.ToString());
    return result.ToArray();
}
```

### Reference Extraction Pattern

```csharp
// Extract reference from: "FASTER PAYMENT REF JOHN SMITH VIA ONLINE BANKING"
// Result: "JOHN SMITH"
public static string ExtractHsbcReference(string description)
{
    if (string.IsNullOrWhiteSpace(description))
        return string.Empty;

    const string marker = " REF ";
    int index = description.IndexOf(marker, StringComparison.OrdinalIgnoreCase);
    if (index < 0)
        return string.Empty;

    string afterRef = description[(index + marker.Length)..].Trim();

    string[] trailingTokens = { " VIA ", " ONLINE BANKING", " MOBILE APP", " ON ", " AT " };
    foreach (var token in trailingTokens)
    {
        int tokenIndex = afterRef.IndexOf(token, StringComparison.OrdinalIgnoreCase);
        if (tokenIndex > 0)
        {
            afterRef = afterRef[..tokenIndex].Trim();
            break;
        }
    }

    return afterRef;
}
```

### Duplicate Detection Query

```csharp
// Efficient duplicate check using indexed query
var duplicateHashes = transactions
    .Select(t => new { t.Date, t.MoneyIn, t.Description })
    .ToHashSet();

var existingTransactions = await _context.HSBCBankCreditTransactions
    .Where(t => !t.Deleted)
    .Where(t => duplicateHashes.Contains(new { t.Date, t.MoneyIn, t.Description }))
    .ToListAsync();
```

## 5. Risk Assessment

| Risk                                 | Impact | Likelihood | Mitigation                                             |
| ------------------------------------ | ------ | ---------- | ------------------------------------------------------ |
| CSV format changes by HSBC           | High   | Low        | Flexible column detection, clear error messages        |
| Large file performance issues        | Medium | Medium     | Stream processing, batch operations, progress tracking |
| Duplicate detection too strict/loose | Medium | Low        | Comprehensive testing with real data samples           |
| Reference extraction misses patterns | Medium | Medium     | Extensive test coverage for edge cases                 |
| File encoding issues                 | Low    | Low        | Test with various file encodings                       |

## 6. Dependencies

- ✅ HSBCBankCreditTransaction table exists in database
- ✅ FinancialAdministrator and FinancialContributor roles exist
- ✅ Dashboard page structure in place
- ✅ Material-UI components available
- ⚠️ Need sample HSBC CSV files for testing
- ⚠️ Need confirmation of exact HSBC CSV format variations

## 7. Related Documentation

- [HSBC Bank Statement Import Specification](../spec/hsbc-transactions-spec.md)
- [Dashboard Page Implementation](../ChurchRegister.React/src/pages/DashboardPage.tsx)
- [Church Members Feature Plan](./feature-church-members.md)
