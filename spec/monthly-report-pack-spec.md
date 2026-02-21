---
title: Monthly Report Pack Export Feature
version: 1.0
date_created: 2026-02-20
last_updated: 2026-02-20
owner: Church Register Development Team
tags: [feature, reporting, export, email, dashboard, pdf]
---

# Introduction

This specification defines the Monthly Report Pack feature, which enables authorized users to generate a comprehensive collection of PDF reports and automatically attach them to an Outlook email template. The feature provides church administrators with a streamlined workflow to compile and distribute monthly operational reports.

## 1. Purpose & Scope

**Purpose**: Provide a one-click solution for church administrators to generate and email a standardized monthly report pack containing critical operational data across attendance, pastoral care, training, risk assessments, and reminders.

**Scope**: This specification covers:
- Dashboard widget UI component
- Report generation orchestration
- PDF generation for all required reports
- Outlook email integration
- Authorization and role-based access control
- Error handling and user feedback

**Out of Scope**:
- Scheduled automatic report generation
- Custom date range selection
- Report pack history tracking in database
- ZIP download alternative
- Email template customization UI
- Non-Outlook email clients

**Assumptions**:
- Microsoft Outlook is installed on user's machine
- User has appropriate permissions for all included reports
- Existing PDF export implementations can be reused for Attendance, Pastoral Care, and Risk Assessments

## 2. Definitions

- **Report Pack**: Collection of five PDF reports generated together as a cohesive package
- **Dashboard Widget**: UI component displayed on the administrative dashboard
- **Email Template**: Pre-populated Outlook email draft with subject, body, and attachments
- **Expiring Training**: Training certificates that expire within the next 60 days
- **Due Reminders**: Reminders with due dates within the next 60 days
- **Generation Progress**: Visual feedback showing which report is currently being generated
- **Partial Success**: Scenario where some reports generate successfully while others fail

## 3. Requirements, Constraints & Guidelines

### Functional Requirements

- **REQ-001**: System shall provide a dashboard widget for generating monthly report pack
- **REQ-002**: Widget shall be positioned directly above the "Add New Member" widget on admin dashboard
- **REQ-003**: Widget shall display an envelope icon to indicate email functionality
- **REQ-004**: Widget button shall be disabled during report generation
- **REQ-005**: System shall generate five PDF reports: Attendance, Pastoral Care, Training, Risk Assessments, and Reminders
- **REQ-006**: All five reports are mandatory (no user selection of subset)
- **REQ-007**: Training report shall include certificates expiring in the next 60 days (fixed timeframe)
- **REQ-008**: Reminders report shall include reminders due in the next 60 days (fixed timeframe)
- **REQ-009**: All reports shall use default parameters (no filtering by user)
- **REQ-010**: System shall reuse existing PDF implementations for Attendance, Pastoral Care, and Risk Assessments
- **REQ-011**: System shall create new PDF implementations for Training and Reminders reports
- **REQ-012**: PDF files shall be named: "Attendance.pdf", "Pastoral Care.pdf", "Training.pdf", "Risk Assessments.pdf", "Reminders.pdf"
- **REQ-013**: System shall open Outlook with a new email draft upon successful generation
- **REQ-014**: Email subject shall follow format: "Monthly Report Pack - [Month] [Year]" (e.g., "Monthly Report Pack - February 2026")
- **REQ-015**: Email body shall be pre-populated with editable template content
- **REQ-016**: All generated PDF files shall be automatically attached to the email
- **REQ-017**: Email recipient field (To:) shall be empty for user to populate
- **REQ-018**: User shall be able to edit email body before sending
- **REQ-019**: System shall display progress modal during generation showing current report (e.g., "Generating Attendance... 1/5")
- **REQ-020**: User shall be able to cancel generation operation
- **REQ-021**: If report generation takes longer than expected, system shall display estimated time warning
- **REQ-022**: If a report has no data, system shall generate PDF with "No records found" message
- **REQ-023**: If one report fails, system shall continue generating remaining reports
- **REQ-024**: After generation, system shall display summary: "X of 5 reports generated successfully"
- **REQ-025**: System shall log audit trail: username, timestamp, and list of successfully generated reports

### Security Requirements

- **SEC-001**: Only users with SystemAdministration or MonthlyReportPack roles shall access the feature
- **SEC-002**: MonthlyReportPack role shall be created as new ASP.NET Identity role
- **SEC-003**: All report generation operations shall be audited with user identity
- **SEC-004**: System shall validate user authorization before initiating generation
- **SEC-005**: Generated PDF files shall respect data protection constraints of individual reports

### UI/UX Requirements

- **UIX-001**: Dashboard widget shall match visual design of "Add New Member" widget
- **UIX-002**: Widget shall use envelope icon (Material-UI MailOutlineIcon or similar)
- **UIX-003**: Button shall be disabled (grayed out) during generation process
- **UIX-004**: Progress modal shall be centered on screen with semi-transparent backdrop
- **UIX-005**: Progress modal shall show: current report name, step count (X/5), and cancel button
- **UIX-006**: Generation completion shall show success/failure summary before opening email
- **UIX-007**: Error messages shall be specific and actionable

### Performance Requirements

- **PER-001**: Reports shall be generated in parallel where technically feasible
- **PER-002**: Total generation time shall not exceed 60 seconds (timeout limit)
- **PER-003**: Progress indicator shall update within 500ms of each report completion
- **PER-004**: UI shall remain responsive during generation (non-blocking)

### Constraints

- **CON-001**: Microsoft Outlook must be installed on user's workstation
- **CON-002**: User's Outlook must be configured with email account
- **CON-003**: No alternative email clients shall be supported
- **CON-004**: No ZIP download fallback shall be provided
- **CON-005**: Report date ranges are fixed (not user-configurable)
- **CON-006**: All five reports are mandatory (no optional reports)
- **CON-007**: Training and Reminders 60-day timeframe is hardcoded

### Guidelines

- **GUD-001**: Use existing PDF generation patterns from Attendance, Pastoral Care, and Risk Assessment features
- **GUD-002**: Follow established audit logging patterns used elsewhere in application
- **GUD-003**: Implement progress modal using consistent Material-UI dialog patterns
- **GUD-004**: Use existing email template patterns if available in codebase
- **GUD-005**: Leverage parallel task execution (Task.WhenAll) for report generation
- **GUD-006**: Implement graceful degradation if individual reports fail

### Design Patterns

- **PAT-001**: Use Orchestrator pattern for coordinating multiple report generators
- **PAT-002**: Use Strategy pattern for individual report PDF generators
- **PAT-003**: Use Observer pattern for progress updates during generation
- **PAT-004**: Use Command pattern for cancellable generation operation

## 4. Interfaces & Data Contracts

### Dashboard Widget Component Interface

```typescript
interface MonthlyReportPackWidget {
  // Props
  onGenerateClick: () => Promise<void>;
  isGenerating: boolean;
  
  // State
  currentReport: string | null;
  reportsCompleted: number;
  totalReports: 5;
}
```

### Report Generation Service Interface

```csharp
public interface IMonthlyReportPackService
{
    /// <summary>
    /// Generates all reports in the monthly pack and returns file data
    /// </summary>
    /// <param name="cancellationToken">Cancellation token for stopping generation</param>
    /// <returns>Collection of generated report files with metadata</returns>
    Task<MonthlyReportPackResult> GenerateReportPackAsync(CancellationToken cancellationToken);
}

public class MonthlyReportPackResult
{
    public List<ReportFile> SuccessfulReports { get; set; }
    public List<ReportFailure> FailedReports { get; set; }
    public DateTime GeneratedDate { get; set; }
    public string GeneratedBy { get; set; }
}

public class ReportFile
{
    public string FileName { get; set; }
    public byte[] FileData { get; set; }
    public string MimeType { get; set; } = "application/pdf";
}

public class ReportFailure
{
    public string ReportName { get; set; }
    public string ErrorMessage { get; set; }
}
```

### Email Template Data Contract

```csharp
public class EmailTemplateData
{
    public string Subject { get; set; }
    public string Body { get; set; }
    public List<EmailAttachment> Attachments { get; set; }
}

public class EmailAttachment
{
    public string FileName { get; set; }
    public byte[] FileData { get; set; }
}
```

### Email Body Template

```
Dear [Recipient],

Please find attached the monthly report pack for [Church Name], generated on [DD MMMM YYYY].

This pack includes the following reports:

1. Attendance Report - Summary of attendance across all events
2. Pastoral Care Report - Members requiring pastoral care attention
3. Training Report - Certificates expiring in the next 60 days
4. Risk Assessments Report - Current risk assessment status
5. Reminders Report - Outstanding reminders due in the next 60 days

If you have any questions regarding these reports, please contact the church office.

Best regards,
[Generated by User Name]
```

### API Endpoint

```
POST /api/reports/monthly-pack
Authorization: Bearer {token}
Roles: SystemAdministration, MonthlyReportPack

Response: 200 OK
{
  "successfulReports": ["Attendance.pdf", "Pastoral Care.pdf", ...],
  "failedReports": [],
  "generatedDate": "2026-02-20T15:30:00Z",
  "generatedBy": "user@example.com"
}
```

### Progress Update Interface

```typescript
interface GenerationProgress {
  reportName: string;
  step: number;
  totalSteps: 5;
  status: 'generating' | 'completed' | 'failed';
  estimatedTimeRemaining?: number; // seconds
}
```

## 5. Acceptance Criteria

### Widget Display & Behavior

- **AC-001**: Given user has SystemAdministration or MonthlyReportPack role, When user navigates to dashboard, Then Monthly Report Pack widget is displayed above Add New Member widget
- **AC-002**: Given user lacks required roles, When user navigates to dashboard, Then Monthly Report Pack widget is not displayed
- **AC-003**: Given widget is displayed, When user views widget, Then envelope icon is visible on the button
- **AC-004**: Given user clicks generate button, When generation starts, Then button becomes disabled and grayed out
- **AC-005**: Given generation is complete, When email opens in Outlook, Then button returns to enabled state

### Report Generation

- **AC-006**: Given user initiates generation, When process starts, Then progress modal displays "Generating Attendance... 1/5"
- **AC-007**: Given all reports generate successfully, When generation completes, Then summary shows "5 of 5 reports generated successfully"
- **AC-008**: Given one report fails, When generation continues, Then remaining reports are generated and summary shows "4 of 5 reports generated successfully"
- **AC-009**: Given Training report has no expiring certificates, When Training report generates, Then PDF contains "No records found" message
- **AC-010**: Given generation exceeds 30 seconds, When timeout threshold reached, Then estimated time warning is displayed
- **AC-011**: Given user clicks cancel during generation, When cancellation confirmed, Then generation stops and modal closes
- **AC-012**: Given reports are generating in parallel, When all complete, Then total time is less than sequential generation

### Email Integration

- **AC-013**: Given all reports generated successfully, When generation completes, Then Outlook opens with new email draft
- **AC-014**: Given email opens, When user views email, Then subject is "Monthly Report Pack - [Current Month] [Current Year]"
- **AC-015**: Given email opens, When user views email, Then body contains pre-populated template with generation date
- **AC-016**: Given email opens, When user views email, Then all 5 PDF files are attached
- **AC-017**: Given email opens, When user views email, Then To field is empty for user to populate
- **AC-018**: Given email opens, When user edits body text, Then changes are preserved
- **AC-019**: Given email is ready, When user clicks Send in Outlook, Then email sends normally through Outlook

### PDF File Naming

- **AC-020**: Given Attendance report generates, When file is created, Then filename is "Attendance.pdf"
- **AC-021**: Given Pastoral Care report generates, When file is created, Then filename is "Pastoral Care.pdf"
- **AC-022**: Given Training report generates, When file is created, Then filename is "Training.pdf"
- **AC-023**: Given Risk Assessments report generates, When file is created, Then filename is "Risk Assessments.pdf"
- **AC-024**: Given Reminders report generates, When file is created, Then filename is "Reminders.pdf"

### Report Content

- **AC-025**: Given Attendance report generates, When report is opened, Then it matches existing attendance export format
- **AC-026**: Given Pastoral Care report generates, When report is opened, Then it matches existing pastoral care export format
- **AC-027**: Given Risk Assessments report generates, When report is opened, Then it matches existing risk assessment export format
- **AC-028**: Given Training report generates, When report is opened, Then it includes only certificates expiring within 60 days from generation date
- **AC-029**: Given Reminders report generates, When report is opened, Then it includes only reminders due within 60 days from generation date

### Audit & Logging

- **AC-030**: Given user generates report pack, When generation completes, Then audit log records username, timestamp, and successful report list
- **AC-031**: Given report fails to generate, When error occurs, Then error is logged with details
- **AC-032**: Given user cancels generation, When cancellation occurs, Then cancellation is logged in audit trail

### Error Handling

- **AC-033**: Given Outlook is not installed, When user clicks generate, Then error message states "Microsoft Outlook is required"
- **AC-034**: Given timeout occurs (>60 seconds), When timeout reached, Then generation stops and error message displays
- **AC-035**: Given one report fails, When error occurs, Then specific error message identifies failed report
- **AC-036**: Given all reports fail, When errors occur, Then summary shows "0 of 5 reports generated successfully" and email does not open

## 6. Test Automation Strategy

### Test Levels

**Unit Tests**:
- Individual report PDF generators (Training, Reminders)
- Report orchestration service
- Email template population
- File naming logic
- Date range calculations (60-day windows)

**Integration Tests**:
- End-to-end report generation flow
- Parallel report generation
- Error handling and recovery
- Cancellation token handling
- Audit logging integration

**End-to-End Tests**:
- Full user workflow from widget click to email opening
- Role-based access control
- Progress modal interactions
- Partial failure scenarios

### Frameworks

- **Backend**: MSTest, FluentAssertions, Moq
- **Frontend**: Vitest, React Testing Library
- **E2E**: Playwright

### Test Data Management

- Use builder pattern for test report data
- Mock DateTime for consistent 60-day calculations
- Create fixtures for "no data" scenarios
- Use in-memory file system for PDF generation tests

### Coverage Requirements

- Minimum 80% code coverage for new service classes
- 100% coverage for critical paths (security, audit logging)
- All error scenarios must have tests

### Performance Testing

- Load test: 10 concurrent report pack generations
- Verify parallel generation faster than sequential
- Ensure UI remains responsive during generation
- Test timeout enforcement at 60 seconds

## 7. Rationale & Context

### Why This Feature?

Church administrators currently must navigate to multiple pages, generate individual reports, save them locally, and manually compile them into an email. This creates friction in the monthly reporting workflow and increases risk of forgetting reports or using inconsistent date ranges. Consolidating this into a single-click operation significantly improves efficiency and ensures consistency.

### Design Decisions

**Why Outlook-only?**
- Majority of church offices use Microsoft Office suite
- Reduces complexity of supporting multiple email clients
- Leverages existing user familiarity with Outlook

**Why mandatory 5 reports?**
- Ensures complete monthly reporting coverage
- Prevents accidental omission of critical reports
- Simplifies UI (no checkboxes/selections needed)

**Why fixed 60-day timeframe?**
- Provides forward-looking view for proactive management
- Consistent with industry standards for certificate tracking
- Balances between too much and too little data

**Why no ZIP download?**
- Requirement is email-centric workflow
- Reduces development complexity
- Outlook integration is primary value proposition

**Why parallel generation?**
- Improves user experience through faster completion
- Reports are independent and can be safely parallelized
- Modern servers have sufficient resources for parallel PDF generation

**Why continue on individual failures?**
- Partial data is better than no data
- Allows administrator to send available reports
- Specific error messages guide troubleshooting

### Alternative Approaches Considered

1. **Scheduled Email Delivery**: Automatically email report pack monthly → Rejected due to complexity and less flexibility
2. **Custom Date Ranges**: Allow user to select date ranges → Rejected to maintain simplicity and consistency
3. **Report Selection**: Allow user to choose subset of reports → Rejected to ensure complete reporting
4. **Browser Download**: Download ZIP file instead of email → Rejected as it doesn't solve email compilation workflow

## 8. Dependencies & External Integrations

### External Systems

- **EXT-001**: Microsoft Outlook - Desktop email client for creating email drafts with attachments
- **EXT-002**: Windows Registry/COM - For detecting Outlook installation and version

### Third-Party Services

- **SVC-001**: QuestPDF - PDF generation library (already in use for existing reports)
- **SVC-002**: Windows MAPI - For programmatically opening Outlook with attachments

### Infrastructure Dependencies

- **INF-001**: Windows Operating System - Required for Outlook COM interop
- **INF-002**: File System - Temporary storage for PDF files before attachment

### Data Dependencies

- **DAT-001**: Attendance Data - From EventAttendance and Events tables
- **DAT-002**: Pastoral Care Data - From ChurchMember table with PastoralCareRequired flag
- **DAT-003**: Training Data - From ChurchMemberTrainingCertificates and TrainingCertificateTypes tables
- **DAT-004**: Risk Assessment Data - From RiskAssessments table
- **DAT-005**: Reminders Data - From Reminders table

### Technology Platform Dependencies

- **PLT-001**: .NET 9.0 - Runtime platform
- **PLT-002**: ASP.NET Core 9.0 - Web framework
- **PLT-003**: React 18+ - Frontend framework
- **PLT-004**: Material-UI v5+ - UI component library

### Compliance Dependencies

- **COM-001**: GDPR - Must respect data protection settings when including member information in reports
- **COM-002**: Audit Requirements - Must log all report generation activities for compliance tracking

## 9. Examples & Edge Cases

### Example: Successful Generation Flow

```csharp
// User clicks "Generate Monthly Report Pack" button
// Progress modal opens
// System generates reports in parallel

var cancellationTokenSource = new CancellationTokenSource(TimeSpan.FromSeconds(60));

var attendanceTask = _attendancePdfService.GenerateAsync(cancellationTokenSource.Token);
var pastoralCareTask = _pastoralCarePdfService.GenerateAsync(cancellationTokenSource.Token);
var trainingTask = _trainingPdfService.GenerateExpiringReportAsync(60, cancellationTokenSource.Token);
var riskAssessmentTask = _riskAssessmentPdfService.GenerateAsync(cancellationTokenSource.Token);
var remindersTask = _remindersPdfService.GenerateDueReportAsync(60, cancellationTokenSource.Token);

var results = await Task.WhenAll(
    attendanceTask,
    pastoralCareTask,
    trainingTask,
    riskAssessmentTask,
    remindersTask
);

// All succeed: 5 of 5 reports generated successfully
// Outlook opens with 5 PDFs attached
```

### Example: Email Template Population

```csharp
var emailTemplate = new EmailTemplateData
{
    Subject = $"Monthly Report Pack - {DateTime.Now:MMMM yyyy}",
    Body = $@"Dear [Recipient],

Please find attached the monthly report pack for Bethel Baptist Church, generated on {DateTime.Now:dd MMMM yyyy}.

This pack includes the following reports:

1. Attendance Report - Summary of attendance across all events
2. Pastoral Care Report - Members requiring pastoral care attention
3. Training Report - Certificates expiring in the next 60 days
4. Risk Assessments Report - Current risk assessment status
5. Reminders Report - Outstanding reminders due in the next 60 days

If you have any questions regarding these reports, please contact the church office.

Best regards,
{User.Identity.Name}",
    Attachments = reportFiles.Select(rf => new EmailAttachment
    {
        FileName = rf.FileName,
        FileData = rf.FileData
    }).ToList()
};
```

### Edge Case: No Training Certificates Expiring

```csharp
public async Task<byte[]> GenerateExpiringReportAsync(int daysAhead, CancellationToken ct)
{
    var expiringDate = DateTime.UtcNow.AddDays(daysAhead);
    var certificates = await _context.ChurchMemberTrainingCertificates
        .Where(c => c.Expires <= expiringDate && c.Expires >= DateTime.UtcNow)
        .ToListAsync(ct);
    
    if (!certificates.Any())
    {
        // Generate PDF with "No records found" message
        return GenerateEmptyReportPdf("Training Report", 
            "No training certificates are expiring in the next 60 days.");
    }
    
    return GenerateTrainingReportPdf(certificates);
}
```

### Edge Case: Partial Failure Scenario

```csharp
// Attendance and Pastoral Care succeed
// Training fails due to database timeout
// Risk Assessments and Reminders succeed

var result = new MonthlyReportPackResult
{
    SuccessfulReports = new List<ReportFile>
    {
        new ReportFile { FileName = "Attendance.pdf", FileData = attendanceData },
        new ReportFile { FileName = "Pastoral Care.pdf", FileData = pastoralCareData },
        new ReportFile { FileName = "Risk Assessments.pdf", FileData = riskAssessmentData },
        new ReportFile { FileName = "Reminders.pdf", FileData = remindersData }
    },
    FailedReports = new List<ReportFailure>
    {
        new ReportFailure 
        { 
            ReportName = "Training", 
            ErrorMessage = "Database timeout while retrieving training certificate data" 
        }
    }
};

// Show summary: "4 of 5 reports generated successfully"
// Outlook still opens with 4 PDFs attached
// Error message displayed identifying Training report failure
```

### Edge Case: User Cancels During Generation

```typescript
const handleCancel = () => {
  if (confirm('Are you sure you want to cancel report generation?')) {
    cancellationTokenSource.cancel();
    setIsGenerating(false);
    closeProgressModal();
    showNotification('Report generation cancelled', 'info');
  }
};

// In backend
public async Task<MonthlyReportPackResult> GenerateReportPackAsync(CancellationToken ct)
{
    try
    {
        // Generation code with ct passed to all async operations
    }
    catch (OperationCanceledException)
    {
        _logger.LogInformation("Report pack generation cancelled by user {User}", userName);
        throw; // Propagate to frontend
    }
}
```

### Edge Case: Outlook Not Installed

```csharp
public class OutlookEmailService : IEmailService
{
    public bool IsOutlookInstalled()
    {
        try
        {
            var outlookApp = new Outlook.Application();
            outlookApp.Quit();
            return true;
        }
        catch (COMException)
        {
            return false;
        }
    }
    
    public void CreateEmailWithAttachments(EmailTemplateData template)
    {
        if (!IsOutlookInstalled())
        {
            throw new OutlookNotInstalledException(
                "Microsoft Outlook is required to use the Monthly Report Pack feature. " +
                "Please ensure Outlook is installed and configured on your machine."
            );
        }
        
        // Create email draft
    }
}
```

## 10. Validation Criteria

### Functional Validation

- [ ] Widget displays correctly on dashboard for authorized users
- [ ] Widget does not display for unauthorized users
- [ ] All 5 reports generate successfully with valid data
- [ ] Each report uses correct date range parameters
- [ ] PDF files are named correctly
- [ ] Email opens in Outlook with correct subject
- [ ] Email body contains complete template
- [ ] All 5 PDFs are attached to email
- [ ] Email is editable before sending
- [ ] Progress modal displays accurately during generation
- [ ] Cancel button stops generation

### Security Validation

- [ ] Only SystemAdministration and MonthlyReportPack roles can access feature
- [ ] UnauthorizedAccessException thrown for non-authorized users
- [ ] Audit log records all generation attempts
- [ ] Report content respects data protection settings

### Performance Validation

- [ ] Reports generate in parallel
- [ ] Total generation time < 60 seconds for typical dataset
- [ ] UI remains responsive during generation
- [ ] Timeout enforced at 60 seconds
- [ ] Memory usage reasonable (< 500MB for generation)

### Error Handling Validation

- [ ] Graceful handling of individual report failures
- [ ] Accurate failure summary displayed
- [ ] Partial report pack creation works correctly
- [ ] Outlook not installed error displays clearly
- [ ] Timeout error displays clearly
- [ ] Database errors logged with sufficient detail

### User Experience Validation

- [ ] Widget visual design matches Add New Member widget
- [ ] Envelope icon is clear and recognizable
- [ ] Button disabled state is visually distinct
- [ ] Progress modal is centered and readable
- [ ] Success summary is clear and accurate
- [ ] Error messages are specific and actionable
- [ ] Email template is professional and complete

## 11. Related Specifications / Further Reading

### Internal Documentation

- [Attendance Export Specification](../spec/feature-attendance-export.md) (if exists)
- [Pastoral Care Report Specification](../spec/feature-pastoral-care.md) (if exists)
- [Risk Assessment Export Specification](../spec/feature-risk-assessment-export.md) (if exists)
- [Security & Authorization Patterns](../docs/security-configuration.md)
- [Architecture Overview](../docs/ARCHITECTURE.md)

### External References

- [QuestPDF Documentation](https://www.questpdf.com/documentation/)
- [Outlook Object Model Reference](https://learn.microsoft.com/en-us/office/vba/api/overview/outlook/object-model)
- [MAPI Email Integration](https://learn.microsoft.com/en-us/office/client-developer/outlook/mapi/mapi-programming-overview)
- [ASP.NET Core Authorization](https://learn.microsoft.com/en-us/aspnet/core/security/authorization/)
- [React Progress Indicators](https://mui.com/material-ui/react-progress/)

---

**Specification Status**: Draft  
**Review Status**: Pending Review  
**Implementation Status**: Not Started
