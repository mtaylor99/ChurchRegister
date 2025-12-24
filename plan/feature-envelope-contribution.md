---
goal: Implement Envelope Contribution System with Weekly Cash Entry, Register Number Management, and Batch Processing
version: 1.0
date_created: 2024-12-24
last_updated: 2024-12-24
owner: ChurchRegister Development Team
status: "Planned"
tags:
  [
    feature,
    financial,
    contributions,
    envelope-system,
    cash-donations,
    member-register,
  ]
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

Implement a complete envelope contribution system that enables church administrators to record weekly cash donations collected in envelopes. Each active member receives a sequential register number at the start of each year, which they write on envelopes along with their donation amount. The system provides:

- **Register Number Generation**: Annual process to assign sequential numbers (1, 2, 3...) to active members based on membership seniority
- **Batch Entry Interface**: Streamlined UI for rapid data entry of multiple envelopes collected on a given Sunday
- **Real-time Validation**: Instant validation of register numbers with member name display
- **Duplicate Prevention**: Ensures only one batch per Sunday can be submitted
- **Contribution Tracking**: Automatic integration with existing contribution reporting and member history
- **Immutable Audit Trail**: Complete historical record of all batches with no editing or deletion allowed
- **Role-Based Access**: FinancialViewer (view only), FinancialContributor (enter batches), FinancialAdministrator (enter batches + generate numbers), SystemAdministrator (all access)

**Key Deliverables**: EnvelopeContributionBatch table, register number generation API, batch entry UI, validation services, role-based access controls, and comprehensive testing.

## 1. Requirements & Constraints

### Core Requirements from Specification

- **REQ-001**: Generate sequential register numbers (1, 2, 3...) for all active members ordered by MemberSince ASC
- **REQ-002**: Register number generation triggered manually via dashboard button
- **REQ-003**: Generate numbers for next calendar year (e.g., 2026 numbers in December 2025)
- **REQ-004**: Store register numbers in ChurchMemberRegisterNumbers with Year column
- **REQ-005**: Prevent duplicate register number generation for same year
- **REQ-006**: Only Active members (ChurchMemberStatusId = 1) receive register numbers
- **REQ-007**: Batch entry UI with two columns: Member Register Number and Amount
- **REQ-008**: Collection Date must be Sunday only (day-of-week validation)
- **REQ-009**: Prevent duplicate batches for same Sunday (unique constraint on BatchDate)
- **REQ-010**: Real-time validation of register numbers against current year
- **REQ-011**: Display member name for valid register numbers
- **REQ-012**: Show validation errors in red text within form
- **REQ-013**: Prevent batch submission when validation errors exist
- **REQ-014**: Create EnvelopeContributionBatch record with TotalAmount, EnvelopeCount, Status
- **REQ-015**: Create ChurchMemberContributions records for each envelope (ContributionTypeId = 1 for Cash)
- **REQ-016**: TransactionRef format: "ENV-[BatchId]-[RegisterNumber]"
- **REQ-017**: All batch operations within database transaction (atomic, rollback on error)
- **REQ-018**: Batch records are immutable after submission (no editing or deletion)
- **REQ-019**: Envelope contributions included in member's ThisYearsContribution total
- **REQ-020**: Envelope contributions appear in member contribution history

### Security & Permission Requirements

- **SEC-001**: Only users with "FinancialContributor" or "FinancialAdministrator" or "SystemAdministrator" roles can enter envelope contributions
- **SEC-002**: Only users with "FinancialAdministrator" or "SystemAdministrator" roles can generate register numbers
- **SEC-003**: Users with "FinancialViewer" role can view envelope batches and history (read-only access)
- **SEC-004**: All batch submissions must log user identity in audit fields
- **SEC-005**: Register number generation must log admin user identity
- **SEC-006**: All data transmission over HTTPS only

### Technical Constraints

- **CON-001**: ChurchMemberRegisterNumbers table already exists - no schema changes needed to entity
- **CON-002**: ChurchMemberContributions table exists - add EnvelopeContributionBatchId column
- **CON-003**: ContributionTypeId = 1 must exist in ContributionTypes lookup for "Cash"
- **CON-004**: Use EF Core migrations for database schema changes
- **CON-005**: Register numbers stored as string in Number column (e.g., "1", "2", "3")
- **CON-006**: Amount precision: decimal(18,2) - up to £10,000 per envelope
- **CON-007**: Batch submission must complete within 5 seconds for up to 100 envelopes
- **CON-008**: Register number generation must complete within 10 seconds for up to 500 members
- **CON-009**: Real-time validation must respond within 500ms

### Implementation Guidelines

- **GUD-001**: Follow existing FastEndpoints pattern for API endpoints
- **GUD-002**: Follow existing Entity Framework Core patterns for data access
- **GUD-003**: Use existing audit interceptor for CreatedBy/CreatedDateTime
- **GUD-004**: Follow existing React patterns for UI components
- **GUD-005**: Use indexed queries for register number validation performance
- **GUD-006**: Provide clear, actionable error messages with specific context
- **GUD-007**: UI should support keyboard navigation for rapid data entry (Tab, Enter)
- **GUD-008**: Display running totals during entry for user confidence

## 2. Implementation Steps

### Phase 1: Database Schema - EnvelopeContributionBatch Table

**GOAL-001**: Create EnvelopeContributionBatch table with proper constraints and indexes

| Task     | Description                                                                                                                                                      | Completed | Date       |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-001 | Create EnvelopeContributionBatch.cs entity in ChurchRegister.Database/Entities/ with properties: Id, BatchDate, TotalAmount, EnvelopeCount, Status, audit fields | ✅        | 2024-12-24 |
| TASK-002 | Implement IAuditableEntity interface on EnvelopeContributionBatch                                                                                                | ✅        | 2024-12-24 |
| TASK-003 | Configure entity in ChurchRegisterWebContext.cs: unique constraint on BatchDate, check constraints for TotalAmount >= 0 and EnvelopeCount > 0                    | ✅        | 2024-12-24 |
| TASK-004 | Add DbSet<EnvelopeContributionBatch> property to ChurchRegisterWebContext.cs                                                                                     | ✅        | 2024-12-24 |
| TASK-005 | Add EnvelopeContributionBatchId (int, nullable) column to ChurchMemberContributions entity                                                                       | ✅        | 2024-12-24 |
| TASK-006 | Configure foreign key relationship from ChurchMemberContributions to EnvelopeContributionBatch in OnModelCreating                                                | ✅        | 2024-12-24 |
| TASK-007 | Create EF Core migration: "dotnet ef migrations add AddEnvelopeContributionBatch --project ChurchRegister.Database --startup-project ChurchRegister.ApiService"  |           |            |
| TASK-008 | Review generated migration SQL for correctness (indexes, constraints)                                                                                            |           |            |
| TASK-009 | Apply migration to development database: "dotnet ef database update"                                                                                             |           |            |

### Phase 2: Backend Models & DTOs

**GOAL-002**: Create all request/response DTOs for register number generation and envelope batch submission

| Task     | Description                                                                                                                                   | Completed | Date       |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-010 | Create GenerateRegisterNumbersRequest.cs in ChurchRegister.ApiService/Models/Administration/ with: TargetYear (int), ConfirmGeneration (bool) | ✅        | 2024-12-24 |
| TASK-011 | Create GenerateRegisterNumbersResponse.cs with: Year, TotalMembersAssigned, GeneratedDateTime, GeneratedBy, Preview (list of assignments)     | ✅        | 2024-12-24 |
| TASK-012 | Create RegisterNumberAssignment.cs with: RegisterNumber, MemberId, MemberName, MemberSince                                                    | ✅        | 2024-12-24 |
| TASK-013 | Create PreviewRegisterNumbersResponse.cs with: Year, TotalActiveMembers, PreviewGenerated, Assignments[]                                      | ✅        | 2024-12-24 |
| TASK-014 | Create SubmitEnvelopeBatchRequest.cs in ChurchRegister.ApiService/Models/Financial/ with: CollectionDate (DateOnly), Envelopes[]              | ✅        | 2024-12-24 |
| TASK-015 | Create EnvelopeEntry.cs with: RegisterNumber (int), Amount (decimal)                                                                          | ✅        | 2024-12-24 |
| TASK-016 | Create SubmitEnvelopeBatchResponse.cs with: BatchId, BatchDate, TotalAmount, EnvelopeCount, ProcessedContributions[]                          | ✅        | 2024-12-24 |
| TASK-017 | Create ProcessedEnvelope.cs with: RegisterNumber, MemberName, Amount, ContributionId                                                          | ✅        | 2024-12-24 |
| TASK-018 | Create BatchValidationError.cs with: RegisterNumber, Error (string)                                                                           | ✅        | 2024-12-24 |
| TASK-019 | Create GetBatchListResponse.cs with: Batches[] (BatchSummary), TotalCount, PageNumber, PageSize                                               | ✅        | 2024-12-24 |
| TASK-020 | Create BatchSummary.cs with: BatchId, BatchDate, TotalAmount, EnvelopeCount, SubmittedBy, SubmittedDateTime                                   | ✅        | 2024-12-24 |
| TASK-021 | Create GetBatchDetailsResponse.cs extending BatchSummary with: Status, Envelopes[] (EnvelopeDetail)                                           | ✅        | 2024-12-24 |
| TASK-022 | Create EnvelopeDetail.cs with: ContributionId, RegisterNumber, MemberId, MemberName, Amount                                                   | ✅        | 2024-12-24 |
| TASK-023 | Create ValidateRegisterNumberResponse.cs with: Valid (bool), RegisterNumber, Year, MemberId, MemberName, IsActive, Error (string)             | ✅        | 2024-12-24 |

### Phase 3: Backend Services - Register Number Generation

**GOAL-003**: Implement service for generating annual register numbers with validation and preview

| Task     | Description                                                                                                                                                             | Completed | Date       |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-024 | Create IRegisterNumberService.cs interface in ChurchRegister.ApiService/Services/ with methods: GenerateForYearAsync, PreviewForYearAsync, HasBeenGeneratedForYearAsync | ✅        | 2024-12-24 |
| TASK-025 | Create RegisterNumberService.cs implementing IRegisterNumberService                                                                                                     | ✅        | 2024-12-24 |
| TASK-026 | Inject ChurchRegisterWebContext and ILogger<RegisterNumberService> into constructor                                                                                     | ✅        | 2024-12-24 |
| TASK-027 | Implement HasBeenGeneratedForYearAsync: query ChurchMemberRegisterNumbers WHERE Year = targetYear, return Any()                                                         | ✅        | 2024-12-24 |
| TASK-028 | Implement PreviewForYearAsync: query active members (StatusId=1), order by MemberSince ASC, return numbered preview list without saving                                 | ✅        | 2024-12-24 |
| TASK-029 | Implement GenerateForYearAsync: check if already generated (throw if yes), query active members ordered by MemberSince ASC                                              | ✅        | 2024-12-24 |
| TASK-030 | In GenerateForYearAsync: iterate members with index, create ChurchMemberRegisterNumber entities with Number = (index+1).ToString() and Year = targetYear                | ✅        | 2024-12-24 |
| TASK-031 | In GenerateForYearAsync: use AddRangeAsync to bulk insert all register numbers within transaction                                                                       | ✅        | 2024-12-24 |
| TASK-032 | In GenerateForYearAsync: call SaveChangesAsync and return generation summary                                                                                            | ✅        | 2024-12-24 |
| TASK-033 | Add comprehensive error handling with specific exception types (AlreadyGeneratedException, NoActiveMembersException)                                                    | ✅        | 2024-12-24 |
| TASK-034 | Register RegisterNumberService as scoped service in Program.cs dependency injection                                                                                     | ✅        | 2024-12-24 |

### Phase 4: Backend Services - Envelope Batch Processing

**GOAL-004**: Implement service for validating and processing envelope contribution batches

| Task     | Description                                                                                                                                              | Completed | Date       |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-035 | Create IEnvelopeContributionService.cs interface with methods: ValidateRegisterNumberAsync, SubmitBatchAsync, GetBatchListAsync, GetBatchDetailsAsync    | ✅        | 2024-12-24 |
| TASK-036 | Create EnvelopeContributionService.cs implementing IEnvelopeContributionService                                                                          | ✅        | 2024-12-24 |
| TASK-037 | Inject ChurchRegisterWebContext, ILogger, IHttpContextAccessor (for current user) into constructor                                                       | ✅        | 2024-12-24 |
| TASK-038 | Implement ValidateRegisterNumberAsync: query ChurchMemberRegisterNumbers WHERE Year = currentYear AND Number = registerNumber, join to ChurchMembers     | ✅        | 2024-12-24 |
| TASK-039 | In ValidateRegisterNumberAsync: check if member is Active (StatusId=1), return validation response with member details or error                          | ✅        | 2024-12-24 |
| TASK-040 | Implement SubmitBatchAsync: validate collection date is Sunday (DayOfWeek == Sunday)                                                                     | ✅        | 2024-12-24 |
| TASK-041 | In SubmitBatchAsync: check for existing batch on same date (query EnvelopeContributionBatch WHERE BatchDate = collectionDate), throw if exists           | ✅        | 2024-12-24 |
| TASK-042 | In SubmitBatchAsync: validate all register numbers (call ValidateRegisterNumberAsync for each), collect validation errors                                | ✅        | 2024-12-24 |
| TASK-043 | In SubmitBatchAsync: if validation errors exist, throw ValidationException with error list                                                               | ✅        | 2024-12-24 |
| TASK-044 | In SubmitBatchAsync: start database transaction using IDbContextTransaction                                                                              | ✅        | 2024-12-24 |
| TASK-045 | In SubmitBatchAsync: create EnvelopeContributionBatch entity with calculated TotalAmount and EnvelopeCount, add to context                               | ✅        | 2024-12-24 |
| TASK-046 | In SubmitBatchAsync: save batch to get BatchId, then create ChurchMemberContributions entities for each envelope                                         | ✅        | 2024-12-24 |
| TASK-047 | In SubmitBatchAsync: set TransactionRef = $"ENV-{batchId}-{registerNumber}", Description = $"Envelope contribution - Sunday {collectionDate:dd/MM/yyyy}" | ✅        | 2024-12-24 |
| TASK-048 | In SubmitBatchAsync: set ContributionTypeId = 1 (Cash), Date = collectionDate, EnvelopeContributionBatchId = batchId                                     | ✅        | 2024-12-24 |
| TASK-049 | In SubmitBatchAsync: use AddRangeAsync for bulk insert, SaveChangesAsync, commit transaction                                                             | ✅        | 2024-12-24 |
| TASK-050 | In SubmitBatchAsync: on exception, rollback transaction and rethrow with context                                                                         | ✅        | 2024-12-24 |
| TASK-051 | Implement GetBatchListAsync: query EnvelopeContributionBatch with pagination, order by BatchDate DESC                                                    | ✅        | 2024-12-24 |
| TASK-052 | Implement GetBatchDetailsAsync: query batch by ID with Include of related ChurchMemberContributions and ChurchMembers                                    | ✅        | 2024-12-24 |
| TASK-053 | Register EnvelopeContributionService as scoped service in Program.cs dependency injection                                                                | ✅        | 2024-12-24 |

### Phase 5: API Endpoints - Register Number Generation

**GOAL-005**: Create FastEndpoints for register number generation and preview

| Task     | Description                                                                                                                                       | Completed | Date       |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-054 | Create GenerateRegisterNumbers.cs endpoint in ChurchRegister.ApiService/Endpoints/Administration/                                                 | ✅        | 2024-12-24 |
| TASK-055 | Configure endpoint: POST /api/administration/church-members/generate-register-numbers, require FinancialAdministrator or SystemAdministrator role | ✅        | 2024-12-24 |
| TASK-056 | Inject IRegisterNumberService into endpoint                                                                                                       | ✅        | 2024-12-24 |
| TASK-057 | In HandleAsync: validate targetYear is future year (> current year), return 400 if not                                                            | ✅        | 2024-12-24 |
| TASK-058 | In HandleAsync: call HasBeenGeneratedForYearAsync, if true return 409 Conflict with error message                                                 | ✅        | 2024-12-24 |
| TASK-059 | In HandleAsync: if confirmGeneration is false, call PreviewForYearAsync and return preview without generating                                     | ✅        | 2024-12-24 |
| TASK-060 | In HandleAsync: if confirmGeneration is true, call GenerateForYearAsync and return generation summary                                             | ✅        | 2024-12-24 |
| TASK-061 | Add comprehensive error handling with appropriate HTTP status codes (400, 409, 500)                                                               | ✅        | 2024-12-24 |
| TASK-062 | Create PreviewRegisterNumbers.cs endpoint: GET /api/administration/church-members/register-numbers/preview/{year}                                 | ✅        | 2024-12-24 |
| TASK-063 | In PreviewRegisterNumbers endpoint: call PreviewForYearAsync and return preview list                                                              | ✅        | 2024-12-24 |
| TASK-064 | Configure both endpoints with proper authorization and rate limiting                                                                              | ✅        | 2024-12-24 |

### Phase 6: API Endpoints - Envelope Batch Management

**GOAL-006**: Create FastEndpoints for envelope batch submission, listing, and details

| Task      | Description                                                                                                                                                | Completed | Date       |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-065  | Create SubmitEnvelopeBatch.cs endpoint in ChurchRegister.ApiService/Endpoints/Financial/                                                                   | ✅        | 2024-12-24 |
| TASK-066  | Configure endpoint: POST /api/financial/envelope-contributions/batches, require FinancialContributor or FinancialAdministrator or SystemAdministrator role | ✅        | 2024-12-24 |
| TASK-067  | Inject IEnvelopeContributionService into endpoint                                                                                                          | ✅        | 2024-12-24 |
| TASK-068  | In HandleAsync: validate request (collectionDate not in future, envelopes not empty, amounts > 0)                                                          | ✅        | 2024-12-24 |
| TASK-069  | In HandleAsync: call SubmitBatchAsync and return success response with batch details                                                                       | ✅        | 2024-12-24 |
| TASK-070  | Add exception handling for DuplicateBatchException (return 409), ValidationException (return 400), general exceptions (return 500)                         | ✅        | 2024-12-24 |
| TASK-071  | Create GetEnvelopeBatchList.cs endpoint: GET /api/financial/envelope-contributions/batches with query params (startDate, endDate, pageNumber, pageSize)    | ✅        | 2024-12-24 |
| TASK-071a | Configure GetEnvelopeBatchList endpoint to allow all financial roles: FinancialViewer, FinancialContributor, FinancialAdministrator, SystemAdministrator   | ✅        | 2024-12-24 |
| TASK-072  | In GetEnvelopeBatchList: call GetBatchListAsync with pagination parameters, return batch list                                                              | ✅        | 2024-12-24 |
| TASK-073  | Create GetEnvelopeBatchDetails.cs endpoint: GET /api/financial/envelope-contributions/batches/{batchId}                                                    | ✅        | 2024-12-24 |
| TASK-073a | Configure GetEnvelopeBatchDetails endpoint to allow all financial roles for read-only access                                                               | ✅        | 2024-12-24 |
| TASK-074  | In GetEnvelopeBatchDetails: call GetBatchDetailsAsync, return full batch details including individual envelopes                                            | ✅        | 2024-12-24 |
| TASK-075  | Create ValidateRegisterNumber.cs endpoint: GET /api/financial/envelope-contributions/validate-register-number/{number}/{year}                              | ✅        | 2024-12-24 |
| TASK-076  | In ValidateRegisterNumber: call ValidateRegisterNumberAsync, return validation response (200 if valid, 404 if invalid)                                     | ✅        | 2024-12-24 |
| TASK-077  | Configure all endpoints with proper authorization, rate limiting, and request validation                                                                   | ✅        | 2024-12-24 |

### Phase 7: Frontend Services - API Integration

**GOAL-007**: Create TypeScript services for calling backend APIs from React frontend

| Task     | Description                                                                                                                   | Completed | Date       |
| -------- | ----------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-078 | Create types/envelopeContribution.types.ts in ChurchRegister.React/src/types/ with all DTO interfaces matching backend models | ✅        | 2024-12-24 |
| TASK-079 | Define EnvelopeEntry, SubmitEnvelopeBatchRequest, SubmitEnvelopeBatchResponse, ProcessedEnvelope, BatchValidationError types  | ✅        | 2024-12-24 |
| TASK-080 | Define BatchSummary, BatchDetails, EnvelopeDetail, ValidateRegisterNumberResponse types                                       | ✅        | 2024-12-24 |
| TASK-081 | Define GenerateRegisterNumbersRequest, GenerateRegisterNumbersResponse, RegisterNumberAssignment types                        | ✅        | 2024-12-24 |
| TASK-082 | Create services/envelopeContributionService.ts in ChurchRegister.React/src/services/                                          | ✅        | 2024-12-24 |
| TASK-083 | Implement submitEnvelopeBatch(request: SubmitEnvelopeBatchRequest): Promise<SubmitEnvelopeBatchResponse> using fetch API      | ✅        | 2024-12-24 |
| TASK-084 | Implement getBatchList(startDate?, endDate?, pageNumber?, pageSize?): Promise<GetBatchListResponse>                           | ✅        | 2024-12-24 |
| TASK-085 | Implement getBatchDetails(batchId: number): Promise<BatchDetails>                                                             | ✅        | 2024-12-24 |
| TASK-086 | Implement validateRegisterNumber(number: number, year: number): Promise<ValidateRegisterNumberResponse>                       | ✅        | 2024-12-24 |
| TASK-087 | Create services/registerNumberService.ts for admin functions                                                                  | ✅        | 2024-12-24 |
| TASK-088 | Implement generateRegisterNumbers(request: GenerateRegisterNumbersRequest): Promise<GenerateRegisterNumbersResponse>          | ✅        | 2024-12-24 |
| TASK-089 | Implement previewRegisterNumbers(year: number): Promise<PreviewRegisterNumbersResponse>                                       | ✅        | 2024-12-24 |
| TASK-090 | Add error handling with typed exceptions, authentication token handling, and retry logic                                      | ✅        | 2024-12-24 |
| TASK-091 | Add request/response logging for debugging                                                                                    | ✅        | 2024-12-24 |

### Phase 8: Frontend Components - Envelope Batch Entry UI

**GOAL-008**: Create React component for rapid envelope data entry with real-time validation

| Task     | Description                                                                                                                                    | Completed | Date       |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-092 | Create EnvelopeBatchEntry.tsx component in ChurchRegister.React/src/components/financial/                                                      | ✅        | 2024-12-24 |
| TASK-093 | Create component state: collectionDate (DateOnly), envelopes (array of {registerNumber, amount, memberName, error}), totalAmount, isSubmitting | ✅        | 2024-12-24 |
| TASK-094 | Implement date picker for collectionDate with Sunday-only validation (filter to show only Sundays)                                             | ✅        | 2024-12-24 |
| TASK-095 | Create data grid with columns: Register Number (input), Member Name (readonly), Amount (input), Actions (delete row)                           | ✅        | 2024-12-24 |
| TASK-096 | Implement handleRegisterNumberChange: on blur or enter, call validateRegisterNumber API                                                        | ✅        | 2024-12-24 |
| TASK-097 | On successful validation: populate memberName, clear error, focus amount field                                                                 | ✅        | 2024-12-24 |
| TASK-098 | On validation failure: set error message in red text, keep focus on register number field                                                      | ✅        | 2024-12-24 |
| TASK-099 | Implement handleAmountChange: validate amount > 0, update running total                                                                        | ✅        | 2024-12-24 |
| TASK-100 | On amount entry complete (blur or enter): move focus to next row's register number field                                                       | ✅        | 2024-12-24 |
| TASK-101 | Add "Add Row" button to append new empty envelope entry                                                                                        | ✅        | 2024-12-24 |
| TASK-102 | Display running totals at bottom: Total Envelopes count, Total Amount (formatted with £)                                                       | ✅        | 2024-12-24 |
| TASK-103 | Implement handleSubmit: validate all entries have no errors, call submitEnvelopeBatch API                                                      | ✅        | 2024-12-24 |
| TASK-104 | Disable Submit button when: collectionDate not selected, no envelopes entered, any validation errors exist, or isSubmitting                    | ✅        | 2024-12-24 |
| TASK-105 | Show validation errors in red text directly in the grid row                                                                                    | ✅        | 2024-12-24 |
| TASK-106 | On successful submission: show success toast with batch reference, clear form, offer "Print Receipt" option                                    | ✅        | 2024-12-24 |
| TASK-107 | On submission error: display error toast with specific message (duplicate batch, validation errors, etc.)                                      | ✅        | 2024-12-24 |
| TASK-108 | Add keyboard shortcuts: Tab for navigation, Enter to move to next field, Ctrl+N for new row                                                    | ✅        | 2024-12-24 |
| TASK-109 | Implement auto-focus management for smooth data entry flow                                                                                     | ✅        | 2024-12-24 |
| TASK-110 | Add loading spinner during validation and submission                                                                                           | ✅        | 2024-12-24 |

### Phase 9: Frontend Components - Batch History & Details

**GOAL-009**: Create React components for viewing batch history and individual batch details

| Task     | Description                                                                                                 | Completed | Date       |
| -------- | ----------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-111 | Create EnvelopeBatchHistory.tsx component in ChurchRegister.React/src/components/financial/                 | ✅        | 2024-12-24 |
| TASK-112 | Implement data grid displaying: Batch Date, Total Amount, Envelope Count, Submitted By, Submitted Date/Time | ✅        | 2024-12-24 |
| TASK-113 | Add date range filters (startDate, endDate) with default to current year                                    | ✅        | 2024-12-24 |
| TASK-114 | Implement pagination controls with page size selector (25, 50, 100)                                         | ✅        | 2024-12-24 |
| TASK-115 | Add "View Details" action button on each row to open batch details modal                                    | ✅        | 2024-12-24 |
| TASK-116 | Implement sorting on all columns (especially by date descending)                                            | ✅        | 2024-12-24 |
| TASK-117 | Display total count of batches at top of grid                                                               | ✅        | 2024-12-24 |
| TASK-118 | Create EnvelopeBatchDetailsModal.tsx component                                                              | ✅        | 2024-12-24 |
| TASK-119 | Display batch summary: Date, Total Amount, Envelope Count, Status, Submitted By, Submitted DateTime         | ✅        | 2024-12-24 |
| TASK-120 | Display detailed grid of all envelopes: Register Number, Member Name, Amount                                | ✅        | 2024-12-24 |
| TASK-121 | Add "Export to CSV" button to export batch details                                                          | ✅        | 2024-12-24 |
| TASK-122 | Add "Print Receipt" button for printable batch summary                                                      | ✅        | 2024-12-24 |
| TASK-123 | Display read-only warning: "Batches cannot be edited or deleted after submission"                           | ✅        | 2024-12-24 |

### Phase 10: Frontend Components - Dashboard Integration

**GOAL-010**: Add dashboard widgets for quick access to envelope features

| Task     | Description                                                                                                                                         | Completed | Date       |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-124 | Create EnvelopeContributionWidget.tsx for dashboard in ChurchRegister.React/src/components/dashboard/                                               | ✅        | 2024-12-24 |
| TASK-125 | Show quick stats: Last batch date, Total envelopes this year, Total amount this year                                                                | ✅        | 2024-12-24 |
| TASK-126 | Add "Enter New Batch" button that navigates to EnvelopeBatchEntry page                                                                              | ✅        | 2024-12-24 |
| TASK-127 | Add "View Batch History" button that navigates to EnvelopeBatchHistory page                                                                         | ✅        | 2024-12-24 |
| TASK-128 | Show recent 5 batches in compact list                                                                                                               | ✅        | 2024-12-24 |
| TASK-129 | Show warning if no batch submitted in last 14 days                                                                                                  | ✅        | 2024-12-24 |
| TASK-130 | Display widget only to users with FinancialViewer, FinancialContributor, FinancialAdministrator, or SystemAdministrator roles (all financial roles) | ✅        | 2024-12-24 |

### Phase 11: Frontend Components - Register Number Generation (Admin)

**GOAL-011**: Create admin interface for generating annual register numbers

| Task     | Description                                                                                                                      | Completed | Date       |
| -------- | -------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-131 | Create GenerateRegisterNumbers.tsx component in ChurchRegister.React/src/components/administration/                              | ✅        | 2024-12-24 |
| TASK-132 | Add "Generate Register Numbers" button to admin dashboard                                                                        | ✅        | 2024-12-24 |
| TASK-133 | On button click: open confirmation dialog showing target year (next year) and count of active members                            | ✅        | 2024-12-24 |
| TASK-134 | Add warning text: "This action cannot be undone. Register numbers will be generated for [Year] based on current active members." | ✅        | 2024-12-24 |
| TASK-135 | Implement "Preview" button that calls previewRegisterNumbers API and displays list in modal                                      | ✅        | 2024-12-24 |
| TASK-136 | Preview modal shows table: Register Number, Member Name, Member Since (ordered by Member Since)                                  | ✅        | 2024-12-24 |
| TASK-137 | Add "Export Preview" button to download preview as PDF or CSV                                                                    | ✅        | 2024-12-24 |
| TASK-138 | Implement "Confirm Generation" button that calls generateRegisterNumbers API with confirmGeneration=true                         | ✅        | 2024-12-24 |
| TASK-139 | On successful generation: show success toast with count of members assigned, offer to export member cards                        | ✅        | 2024-12-24 |
| TASK-140 | On error (already generated): show error toast with specific message and date of previous generation                             | ✅        | 2024-12-24 |
| TASK-141 | Disable button if already generated for next year (check on component mount)                                                     | ✅        | 2024-12-24 |
| TASK-142 | Display component only to users with FinancialAdministrator or SystemAdministrator role                                          | ✅        | 2024-12-24 |

### Phase 12: Frontend - Routing & Navigation

**GOAL-012**: Configure routing and navigation for envelope contribution features

| Task     | Description                                                                                                                                 | Completed | Date       |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-143 | Add route /financial/envelope-contributions/entry for EnvelopeBatchEntry component                                                          | ✅        | 2024-12-24 |
| TASK-144 | Add route /financial/envelope-contributions/history for EnvelopeBatchHistory component                                                      | ✅        | 2024-12-24 |
| TASK-145 | Add route /administration/register-numbers for GenerateRegisterNumbers component                                                            | ✅        | 2024-12-24 |
| TASK-146 | Configure protected routes requiring FinancialContributor, FinancialAdministrator, or SystemAdministrator roles for envelope entry features | ✅        | 2024-12-24 |
| TASK-147 | Configure protected routes requiring FinancialAdministrator or SystemAdministrator role for register number generation                      | ✅        | 2024-12-24 |
| TASK-148 | Add navigation menu items under Financial section: "Envelope Contributions" with submenu "Enter Batch", "Batch History"                     | ✅        | 2024-12-24 |
| TASK-149 | Add navigation menu item under Administration section: "Generate Register Numbers"                                                          | ✅        | 2024-12-24 |
| TASK-150 | Update breadcrumb navigation for all envelope contribution pages                                                                            | ✅        | 2024-12-24 |

### Phase 13: Testing - Backend Unit Tests

**GOAL-013**: Create comprehensive unit tests for all backend services

| Task     | Description                                                                                                             | Completed | Date |
| -------- | ----------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-151 | Create RegisterNumberServiceTests.cs in ChurchRegister.Tests/Services/                                                  |           |      |
| TASK-152 | Test GenerateForYearAsync with 0 active members (should throw or return empty)                                          |           |      |
| TASK-153 | Test GenerateForYearAsync with multiple active members (verify sequential numbering, correct ordering by MemberSince)   |           |      |
| TASK-154 | Test GenerateForYearAsync when already generated for year (should throw AlreadyGeneratedException)                      |           |      |
| TASK-155 | Test GenerateForYearAsync excludes inactive members (StatusId != 1)                                                     |           |      |
| TASK-156 | Test PreviewForYearAsync returns correct preview without saving to database                                             |           |      |
| TASK-157 | Test HasBeenGeneratedForYearAsync returns true/false correctly                                                          |           |      |
| TASK-158 | Create EnvelopeContributionServiceTests.cs in ChurchRegister.Tests/Services/                                            |           |      |
| TASK-159 | Test ValidateRegisterNumberAsync with valid register number for current year (should return valid with member details)  |           |      |
| TASK-160 | Test ValidateRegisterNumberAsync with invalid register number (should return invalid with error)                        |           |      |
| TASK-161 | Test ValidateRegisterNumberAsync with register number from previous year (should return invalid)                        |           |      |
| TASK-162 | Test ValidateRegisterNumberAsync with inactive member (should return invalid with "Member is not active" error)         |           |      |
| TASK-163 | Test SubmitBatchAsync with valid envelopes (verify batch created, contributions created, correct TransactionRef format) |           |      |
| TASK-164 | Test SubmitBatchAsync with duplicate batch date (should throw DuplicateBatchException)                                  |           |      |
| TASK-165 | Test SubmitBatchAsync with invalid register numbers (should throw ValidationException with error list)                  |           |      |
| TASK-166 | Test SubmitBatchAsync with non-Sunday date (should throw ValidationException)                                           |           |      |
| TASK-167 | Test SubmitBatchAsync transaction rollback on error (verify no records saved)                                           |           |      |
| TASK-168 | Test GetBatchListAsync with pagination (verify correct page returned)                                                   |           |      |
| TASK-169 | Test GetBatchDetailsAsync returns full batch with envelope details                                                      |           |      |

### Phase 14: Testing - Backend Integration Tests

**GOAL-014**: Create integration tests for API endpoints with real database

| Task     | Description                                                                                                                   | Completed | Date |
| -------- | ----------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-170 | Create GenerateRegisterNumbersEndpointTests.cs in ChurchRegister.Tests/Endpoints/                                             |           |      |
| TASK-171 | Test POST /generate-register-numbers with valid request returns 200 and correct response                                      |           |      |
| TASK-172 | Test POST /generate-register-numbers with already generated year returns 409 Conflict                                         |           |      |
| TASK-173 | Test POST /generate-register-numbers without Admin role returns 401 Unauthorized                                              |           |      |
| TASK-174 | Test GET /preview/{year} returns correct preview list                                                                         |           |      |
| TASK-175 | Create SubmitEnvelopeBatchEndpointTests.cs in ChurchRegister.Tests/Endpoints/                                                 |           |      |
| TASK-176 | Test POST /batches with valid request returns 201 Created with batch details                                                  |           |      |
| TASK-177 | Test POST /batches with duplicate date returns 409 Conflict                                                                   |           |      |
| TASK-178 | Test POST /batches with invalid register numbers returns 400 Bad Request with validation errors                               |           |      |
| TASK-179 | Test POST /batches with non-Sunday date returns 400 Bad Request                                                               |           |      |
| TASK-180 | Test POST /batches without FinancialContributor, FinancialAdministrator, or SystemAdministrator role returns 401 Unauthorized |           |      |
| TASK-181 | Test GET /batches returns paginated batch list                                                                                |           |      |
| TASK-182 | Test GET /batches/{id} returns full batch details                                                                             |           |      |
| TASK-183 | Test GET /validate-register-number/{number}/{year} returns validation response                                                |           |      |

### Phase 15: Testing - Frontend Component Tests

**GOAL-015**: Create React component tests with user interaction scenarios

| Task     | Description                                                                          | Completed | Date |
| -------- | ------------------------------------------------------------------------------------ | --------- | ---- |
| TASK-184 | Create EnvelopeBatchEntry.test.tsx in ChurchRegister.React/src/**tests**/components/ |           |      |
| TASK-185 | Test component renders with date picker and empty grid                               |           |      |
| TASK-186 | Test entering valid register number displays member name                             |           |      |
| TASK-187 | Test entering invalid register number displays error in red                          |           |      |
| TASK-188 | Test entering amount updates running total                                           |           |      |
| TASK-189 | Test submit button disabled when validation errors exist                             |           |      |
| TASK-190 | Test submit button disabled when no envelopes entered                                |           |      |
| TASK-191 | Test successful submission shows success toast and clears form                       |           |      |
| TASK-192 | Test submission error shows error toast with message                                 |           |      |
| TASK-193 | Test Add Row button adds new envelope entry                                          |           |      |
| TASK-194 | Test keyboard navigation (Tab, Enter) moves focus correctly                          |           |      |
| TASK-195 | Create EnvelopeBatchHistory.test.tsx                                                 |           |      |
| TASK-196 | Test component renders batch list with pagination                                    |           |      |
| TASK-197 | Test View Details button opens batch details modal                                   |           |      |
| TASK-198 | Test date range filters update batch list                                            |           |      |
| TASK-199 | Test pagination controls work correctly                                              |           |      |
| TASK-200 | Create GenerateRegisterNumbers.test.tsx                                              |           |      |
| TASK-201 | Test Preview button displays preview modal with member list                          |           |      |
| TASK-202 | Test Confirm Generation button calls API and shows success                           |           |      |
| TASK-203 | Test button disabled when already generated for year                                 |           |      |
| TASK-204 | Test component only visible to Admin users                                           |           |      |

### Phase 16: Testing - End-to-End Tests

**GOAL-016**: Create end-to-end tests for complete user workflows

| Task     | Description                                                                                                                   | Completed | Date |
| -------- | ----------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-205 | Create E2E test: Admin generates register numbers for next year, verifies preview, confirms generation                        |           |      |
| TASK-206 | Create E2E test: Financial user enters envelope batch for Sunday, validates multiple register numbers, submits successfully   |           |      |
| TASK-207 | Create E2E test: Financial user attempts duplicate batch submission, receives error                                           |           |      |
| TASK-208 | Create E2E test: Financial user views batch history, opens batch details, verifies envelope list                              |           |      |
| TASK-209 | Create E2E test: User views member contribution history, verifies envelope contribution appears with correct amount and date  |           |      |
| TASK-210 | Create E2E test: User views Church Members grid, verifies ThisYearsContribution includes envelope amounts                     |           |      |
| TASK-211 | Create E2E test: Financial user enters batch with invalid register number, sees red error, corrects, and submits successfully |           |      |

### Phase 17: Documentation & User Guide

**GOAL-017**: Create user documentation and admin guides

| Task     | Description                                                                                    | Completed | Date |
| -------- | ---------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-212 | Create user guide: "How to Enter Weekly Envelope Contributions" with screenshots               |           |      |
| TASK-213 | Create admin guide: "Annual Register Number Generation Process" with step-by-step instructions |           |      |
| TASK-214 | Document keyboard shortcuts and data entry tips for efficient envelope entry                   |           |      |
| TASK-215 | Create troubleshooting guide for common errors (invalid numbers, duplicate batches, etc.)      |           |      |
| TASK-216 | Update API documentation with all new endpoints and examples                                   |           |      |
| TASK-217 | Create database schema documentation for EnvelopeContributionBatch table                       |           |      |
| TASK-218 | Document member card printing process for distributing register numbers                        |           |      |

### Phase 18: Deployment & Production Readiness

**GOAL-018**: Prepare for production deployment with monitoring and rollback plan

| Task     | Description                                                                                                                      | Completed | Date |
| -------- | -------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-219 | Run all database migrations in staging environment, verify success                                                               |           |      |
| TASK-220 | Verify ContributionTypeId = 1 exists in ContributionTypes table with value "Cash"                                                |           |      |
| TASK-221 | Create database indexes for performance: ChurchMemberRegisterNumbers(Year, Number), EnvelopeContributionBatch(BatchDate)         |           |      |
| TASK-222 | Configure application settings for envelope feature (max batch size, validation timeouts, etc.)                                  |           |      |
| TASK-223 | Set up application logging for envelope batch operations (info, warning, error levels)                                           |           |      |
| TASK-224 | Configure monitoring alerts for: batch submission failures, validation errors exceeding threshold, database transaction timeouts |           |      |
| TASK-225 | Create rollback plan: document how to revert migration if issues occur                                                           |           |      |
| TASK-226 | Perform load testing: 100 envelopes per batch, 50 concurrent users, verify < 5 second response time                              |           |      |
| TASK-227 | Perform security testing: verify permission checks, SQL injection protection, XSS protection                                     |           |      |
| TASK-228 | Create production deployment checklist with pre-flight and post-deployment verification steps                                    |           |      |
| TASK-229 | Schedule production deployment during low-usage window (e.g., weekday evening)                                                   |           |      |
| TASK-230 | Execute production deployment, run smoke tests, verify all endpoints responding                                                  |           |      |

## 3. Alternatives

### Alternative Approaches Considered

- **ALT-001**: **Auto-generate register numbers on Jan 1st via scheduled job** - Rejected because manual generation gives admin control over timing and allows verification before activation. Scheduled jobs can fail silently.

- **ALT-002**: **Allow batch editing after submission** - Rejected to maintain financial integrity and clear audit trail. Corrections should be made through adjustment entries, not by modifying historical records.

- **ALT-003**: **Use GUID or alphanumeric register numbers** - Rejected because simple sequential numbers (1, 2, 3) are easier for members to write on envelopes and less error-prone than complex identifiers.

- **ALT-004**: **Store register numbers as integers** - Rejected because ChurchMemberRegisterNumbers.Number column is already defined as VARCHAR(20), allowing future flexibility (e.g., prefixes, suffixes) without schema changes.

- **ALT-005**: **Allow any day of week for collection date** - Rejected because church collections happen on Sundays. Restricting to Sundays prevents data entry errors and aligns with actual church operations.

- **ALT-006**: **Store envelopes in separate table linked to batch** - Rejected because ChurchMemberContributions already serves this purpose. Adding EnvelopeContributionBatchId foreign key provides the link without duplicating data.

- **ALT-007**: **Real-time validation via WebSocket** - Rejected as unnecessary complexity. REST API with 500ms response time is sufficient for the data entry workflow.

- **ALT-008**: **Offline-first PWA with sync** - Considered for future enhancement but not included in MVP. Current online-only approach is simpler and meets immediate needs.

- **ALT-009**: **Barcode/QR code scanning for envelope entry** - Interesting future enhancement but requires printed barcodes on envelopes. Manual entry is simpler for MVP.

- **ALT-010**: **Bulk import from Excel/CSV** - Considered but rejected for MVP. Grid-based UI with validation provides better user experience and data quality than batch import.

## 4. Dependencies

### Internal Dependencies

- **DEP-001**: ChurchMember entity with fields: Id, FirstName, LastName, MemberSince, ChurchMemberStatusId (required for register number generation)
- **DEP-002**: ChurchMemberRegisterNumber entity with fields: Id, ChurchMemberId, Number, Year, audit fields (already exists)
- **DEP-003**: ChurchMemberContributions entity with fields: Id, ChurchMemberId, Amount, Date, TransactionRef, Description, ContributionTypeId (already exists)
- **DEP-004**: ContributionType lookup table with Id=1 for "Cash" type (must exist before deployment)
- **DEP-005**: User authentication and authorization system with roles: FinancialViewer, FinancialContributor, FinancialAdministrator, SystemAdministrator
- **DEP-006**: Audit interceptor for automatic population of CreatedBy, CreatedDateTime fields
- **DEP-007**: Church Members Management grid displaying ThisYearsContribution (must be updated to include envelope contributions)
- **DEP-008**: Member contribution history view (must include envelope contributions in display)

### External Dependencies

- **DEP-009**: .NET 8.0 SDK for backend development
- **DEP-010**: Entity Framework Core 8.0+ for database access and migrations
- **DEP-011**: FastEndpoints library for API endpoint implementation
- **DEP-012**: Microsoft SQL Server 2019+ or Azure SQL Database for data storage
- **DEP-013**: React 18+ for frontend UI components
- **DEP-014**: TypeScript 5+ for type-safe frontend development
- **DEP-015**: Material-UI or similar component library for consistent UI (if used in existing codebase)
- **DEP-016**: MSTest framework for backend testing
- **DEP-017**: Vitest and React Testing Library for frontend testing
- **DEP-018**: Date handling library (e.g., date-fns or day.js) for date validation and formatting
- **DEP-019**: Form validation library (e.g., React Hook Form or Formik) for robust form handling

### Data Dependencies

- **DEP-020**: Existing ChurchMembers records with MemberSince dates populated (required for ordering during register number generation)
- **DEP-021**: ChurchMemberStatusId = 1 must represent "Active" status in ChurchMemberStatus lookup table
- **DEP-022**: At least one Active member must exist to generate register numbers

## 5. Files

### Backend - Database Entities

- **FILE-001**: ChurchRegister.Database/Entities/EnvelopeContributionBatch.cs - New entity for batch records
- **FILE-002**: ChurchRegister.Database/Entities/ChurchMemberContributions.cs - Modified to add EnvelopeContributionBatchId property
- **FILE-003**: ChurchRegister.Database/Entities/ChurchMemberRegisterNumber.cs - Existing entity (no changes needed)
- **FILE-004**: ChurchRegister.Database/Data/ChurchRegisterWebContext.cs - Modified to add DbSet and configure relationships

### Backend - Services

- **FILE-005**: ChurchRegister.ApiService/Services/IRegisterNumberService.cs - New interface for register number generation
- **FILE-006**: ChurchRegister.ApiService/Services/RegisterNumberService.cs - New service implementation
- **FILE-007**: ChurchRegister.ApiService/Services/IEnvelopeContributionService.cs - New interface for envelope batch processing
- **FILE-008**: ChurchRegister.ApiService/Services/EnvelopeContributionService.cs - New service implementation

### Backend - Models & DTOs

- **FILE-009**: ChurchRegister.ApiService/Models/Administration/GenerateRegisterNumbersRequest.cs - New DTO
- **FILE-010**: ChurchRegister.ApiService/Models/Administration/GenerateRegisterNumbersResponse.cs - New DTO
- **FILE-011**: ChurchRegister.ApiService/Models/Administration/RegisterNumberAssignment.cs - New DTO
- **FILE-012**: ChurchRegister.ApiService/Models/Administration/PreviewRegisterNumbersResponse.cs - New DTO
- **FILE-013**: ChurchRegister.ApiService/Models/Financial/SubmitEnvelopeBatchRequest.cs - New DTO
- **FILE-014**: ChurchRegister.ApiService/Models/Financial/EnvelopeEntry.cs - New DTO
- **FILE-015**: ChurchRegister.ApiService/Models/Financial/SubmitEnvelopeBatchResponse.cs - New DTO
- **FILE-016**: ChurchRegister.ApiService/Models/Financial/ProcessedEnvelope.cs - New DTO
- **FILE-017**: ChurchRegister.ApiService/Models/Financial/BatchValidationError.cs - New DTO
- **FILE-018**: ChurchRegister.ApiService/Models/Financial/GetBatchListResponse.cs - New DTO
- **FILE-019**: ChurchRegister.ApiService/Models/Financial/BatchSummary.cs - New DTO
- **FILE-020**: ChurchRegister.ApiService/Models/Financial/GetBatchDetailsResponse.cs - New DTO
- **FILE-021**: ChurchRegister.ApiService/Models/Financial/EnvelopeDetail.cs - New DTO
- **FILE-022**: ChurchRegister.ApiService/Models/Financial/ValidateRegisterNumberResponse.cs - New DTO

### Backend - API Endpoints

- **FILE-023**: ChurchRegister.ApiService/Endpoints/Administration/GenerateRegisterNumbers.cs - New endpoint
- **FILE-024**: ChurchRegister.ApiService/Endpoints/Administration/PreviewRegisterNumbers.cs - New endpoint
- **FILE-025**: ChurchRegister.ApiService/Endpoints/Financial/SubmitEnvelopeBatch.cs - New endpoint
- **FILE-026**: ChurchRegister.ApiService/Endpoints/Financial/GetEnvelopeBatchList.cs - New endpoint
- **FILE-027**: ChurchRegister.ApiService/Endpoints/Financial/GetEnvelopeBatchDetails.cs - New endpoint
- **FILE-028**: ChurchRegister.ApiService/Endpoints/Financial/ValidateRegisterNumber.cs - New endpoint

### Backend - Configuration

- **FILE-029**: ChurchRegister.ApiService/Program.cs - Modified to register new services in DI container

### Frontend - TypeScript Types

- **FILE-030**: ChurchRegister.React/src/types/envelopeContribution.types.ts - New type definitions

### Frontend - API Services

- **FILE-031**: ChurchRegister.React/src/services/envelopeContributionService.ts - New service for batch operations
- **FILE-032**: ChurchRegister.React/src/services/registerNumberService.ts - New service for admin operations

### Frontend - React Components

- **FILE-033**: ChurchRegister.React/src/components/financial/EnvelopeBatchEntry.tsx - New component for batch entry
- **FILE-034**: ChurchRegister.React/src/components/financial/EnvelopeBatchHistory.tsx - New component for batch list
- **FILE-035**: ChurchRegister.React/src/components/financial/EnvelopeBatchDetailsModal.tsx - New component for batch details
- **FILE-036**: ChurchRegister.React/src/components/dashboard/EnvelopeContributionWidget.tsx - New dashboard widget
- **FILE-037**: ChurchRegister.React/src/components/administration/GenerateRegisterNumbers.tsx - New admin component

### Frontend - Routing

- **FILE-038**: ChurchRegister.React/src/App.tsx or routing configuration file - Modified to add new routes

### Testing - Backend Unit Tests

- **FILE-039**: ChurchRegister.Tests/Services/RegisterNumberServiceTests.cs - New test suite
- **FILE-040**: ChurchRegister.Tests/Services/EnvelopeContributionServiceTests.cs - New test suite

### Testing - Backend Integration Tests

- **FILE-041**: ChurchRegister.Tests/Endpoints/GenerateRegisterNumbersEndpointTests.cs - New test suite
- **FILE-042**: ChurchRegister.Tests/Endpoints/SubmitEnvelopeBatchEndpointTests.cs - New test suite

### Testing - Frontend Component Tests

- **FILE-043**: ChurchRegister.React/src/**tests**/components/EnvelopeBatchEntry.test.tsx - New test suite
- **FILE-044**: ChurchRegister.React/src/**tests**/components/EnvelopeBatchHistory.test.tsx - New test suite
- **FILE-045**: ChurchRegister.React/src/**tests**/components/GenerateRegisterNumbers.test.tsx - New test suite

### Database Migrations

- **FILE-046**: ChurchRegister.Database/Migrations/[Timestamp]\_AddEnvelopeContributionBatch.cs - New migration file (auto-generated)

## 6. Testing

### Unit Tests

- **TEST-001**: RegisterNumberService.GenerateForYearAsync generates sequential numbers for active members ordered by MemberSince
- **TEST-002**: RegisterNumberService.GenerateForYearAsync throws exception when already generated for year
- **TEST-003**: RegisterNumberService.GenerateForYearAsync excludes inactive members
- **TEST-004**: RegisterNumberService.PreviewForYearAsync returns preview without saving to database
- **TEST-005**: EnvelopeContributionService.ValidateRegisterNumberAsync returns valid response for current year register number with active member
- **TEST-006**: EnvelopeContributionService.ValidateRegisterNumberAsync returns invalid response for non-existent register number
- **TEST-007**: EnvelopeContributionService.ValidateRegisterNumberAsync returns invalid response for previous year register number
- **TEST-008**: EnvelopeContributionService.ValidateRegisterNumberAsync returns invalid response for inactive member
- **TEST-009**: EnvelopeContributionService.SubmitBatchAsync creates batch and contributions with correct data
- **TEST-010**: EnvelopeContributionService.SubmitBatchAsync throws DuplicateBatchException for duplicate Sunday
- **TEST-011**: EnvelopeContributionService.SubmitBatchAsync throws ValidationException for invalid register numbers
- **TEST-012**: EnvelopeContributionService.SubmitBatchAsync throws ValidationException for non-Sunday date
- **TEST-013**: EnvelopeContributionService.SubmitBatchAsync rolls back transaction on error

### Integration Tests

- **TEST-014**: POST /generate-register-numbers with valid request creates register numbers in database
- **TEST-015**: POST /generate-register-numbers with already generated year returns 409 Conflict
- **TEST-016**: POST /generate-register-numbers without FinancialAdministrator or SystemAdministrator role returns 401 Unauthorized
- **TEST-017**: POST /batches with valid request creates batch and contributions in database
- **TEST-018**: POST /batches with duplicate date returns 409 Conflict with existing batch info
- **TEST-019**: POST /batches with invalid register numbers returns 400 Bad Request with validation errors
- **TEST-020**: POST /batches with non-Sunday date returns 400 Bad Request
- **TEST-021**: POST /batches without FinancialContributor, FinancialAdministrator, or SystemAdministrator role returns 401 Unauthorized
- **TEST-022**: GET /batches returns paginated list of batches ordered by date descending
- **TEST-023**: GET /batches/{id} returns full batch details with envelope list
- **TEST-024**: GET /validate-register-number/{number}/{year} returns correct validation response

### Component Tests

- **TEST-025**: EnvelopeBatchEntry renders with date picker and empty grid
- **TEST-026**: EnvelopeBatchEntry displays member name when valid register number entered
- **TEST-027**: EnvelopeBatchEntry displays error in red when invalid register number entered
- **TEST-028**: EnvelopeBatchEntry updates running total when amounts changed
- **TEST-029**: EnvelopeBatchEntry disables submit button when validation errors exist
- **TEST-030**: EnvelopeBatchEntry shows success toast and clears form on successful submission
- **TEST-031**: EnvelopeBatchEntry shows error toast on submission failure
- **TEST-032**: EnvelopeBatchHistory displays batch list with pagination
- **TEST-033**: EnvelopeBatchHistory opens batch details modal when View Details clicked
- **TEST-034**: GenerateRegisterNumbers displays preview modal with member list
- **TEST-035**: GenerateRegisterNumbers calls API and shows success on confirmation
- **TEST-036**: GenerateRegisterNumbers is disabled when already generated for year

### End-to-End Tests

- **TEST-037**: Complete workflow: Admin generates register numbers, verifies preview, confirms generation successfully
- **TEST-038**: Complete workflow: Financial user enters envelope batch, validates numbers, submits, verifies in batch history
- **TEST-039**: Complete workflow: Financial user attempts duplicate batch, receives error, corrects date, submits successfully
- **TEST-040**: Complete workflow: User views member contribution history, sees envelope contribution with correct details
- **TEST-041**: Complete workflow: User views Church Members grid, verifies ThisYearsContribution includes envelope amounts

### Performance Tests

- **TEST-042**: Register number generation completes in < 10 seconds for 500 active members
- **TEST-043**: Batch submission completes in < 5 seconds for 100 envelopes
- **TEST-044**: Register number validation responds in < 500ms
- **TEST-045**: Batch list query with pagination returns in < 2 seconds for 1000+ batches

### Security Tests

- **TEST-046**: Verify FinancialContributor, FinancialAdministrator, or SystemAdministrator role required for envelope batch operations
- **TEST-047**: Verify FinancialAdministrator or SystemAdministrator role required for register number generation
- **TEST-048**: Verify SQL injection protection in all queries (register number validation, batch retrieval)
- **TEST-049**: Verify XSS protection in UI when displaying member names and descriptions
- **TEST-050**: Verify CSRF token validation on all POST endpoints

## 7. Risks & Assumptions

### Risks

- **RISK-001**: **Year Transition Gap** - If register numbers for new year are not generated before Jan 1st, no valid numbers exist for envelope entry. Mitigation: Send reminder to admin in December, add prominent UI warning when approaching year-end without next year's numbers.

- **RISK-002**: **Member Status Changes** - If member becomes inactive after receiving register number but before envelope entry, validation will fail. Mitigation: Clear error message guides user to skip envelope or reassign to correct member.

- **RISK-003**: **Concurrent Batch Submission** - Two users attempting to submit batches for same Sunday simultaneously could cause race condition. Mitigation: Database unique constraint on BatchDate will prevent duplicates, second request will receive 409 Conflict error.

- **RISK-004**: **Large Batch Performance** - Submitting 100+ envelopes could exceed 5-second timeout if database is slow. Mitigation: Use bulk insert (AddRangeAsync), proper indexing, and load testing to verify performance. Consider chunking if needed.

- **RISK-005**: **Data Entry Errors** - User might enter wrong register number or amount. Mitigation: Real-time validation shows member name for verification. Immutable batches prevent casual changes, forcing careful entry.

- **RISK-006**: **Number Exhaustion** - If membership grows beyond 999, single-digit format might be insufficient. Mitigation: VARCHAR(20) column allows up to 20-character numbers, supporting future growth without schema changes.

- **RISK-007**: **Migration Failure** - Adding EnvelopeContributionBatchId column could fail on large ChurchMemberContributions table. Mitigation: Test migration on copy of production database, plan maintenance window, have rollback script ready.

- **RISK-008**: **User Adoption** - Users accustomed to paper records might resist digital envelope entry. Mitigation: Provide training, user guide with screenshots, emphasize time savings and accuracy improvements.

### Assumptions

- **ASSUMPTION-001**: Church envelope collections occur weekly on Sundays. No mid-week or special event collections require envelope tracking.

- **ASSUMPTION-002**: Active members receive register numbers once per year and retain them for the entire year. No mid-year number assignments needed.

- **ASSUMPTION-003**: ContributionTypeId = 1 exists in ContributionTypes table representing "Cash" type before feature deployment.

- **ASSUMPTION-004**: User roles (FinancialViewer, FinancialContributor, FinancialAdministrator, SystemAdministrator) are already configured and assigned to appropriate users.

- **ASSUMPTION-005**: Church Members Management grid and contribution history view already exist and can be updated to include envelope contributions.

- **ASSUMPTION-006**: Users have reliable internet connection during envelope entry. No offline-first requirement for MVP.

- **ASSUMPTION-007**: Envelopes are collected in batches (not individual entries throughout the week), justifying batch-based entry approach.

- **ASSUMPTION-008**: Maximum 100 envelopes per Sunday is sufficient for initial release. Larger churches can be accommodated in future if needed.

- **ASSUMPTION-009**: Member names are unique enough for visual verification during data entry. If duplicate names exist, additional identifiers (member ID) can be added later.

- **ASSUMPTION-010**: Users enter envelope data same day or within a few days of collection. No requirement for backdating months of historical envelopes.

- **ASSUMPTION-011**: Register numbers are written legibly on envelopes. No OCR or handwriting recognition needed for MVP.

- **ASSUMPTION-012**: Member Since date is accurately populated for all active members, ensuring consistent ordering across years.

## 8. Related Specifications / Further Reading

- [envelope-contribution-spec.md](../spec/envelope-contribution-spec.md) - Complete specification for envelope contribution system
- [church-members-spec.md](../spec/church-members-spec.md) - Church members management specification
- [member-contributions-spec.md](../spec/member-contributions-spec.md) - HSBC bank transaction processing and contribution tracking
- [hsbc-transactions-spec.md](../spec/hsbc-transactions-spec.md) - HSBC bank statement CSV import specification

### External References

- [FastEndpoints Documentation](https://fast-endpoints.com/) - API endpoint framework used in project
- [Entity Framework Core Documentation](https://docs.microsoft.com/en-us/ef/core/) - ORM for database access
- [React Documentation](https://react.dev/) - Frontend framework
- [TypeScript Documentation](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Material-UI Grid Component](https://mui.com/x/react-data-grid/) - Data grid component (if used)
- [React Hook Form](https://react-hook-form.com/) - Form validation library
- [MSTest Documentation](https://docs.microsoft.com/en-us/dotnet/core/testing/unit-testing-with-mstest) - Backend testing framework
- [Vitest Documentation](https://vitest.dev/) - Frontend testing framework
