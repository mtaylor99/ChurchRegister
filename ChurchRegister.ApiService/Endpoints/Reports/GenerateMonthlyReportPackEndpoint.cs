using ChurchRegister.ApiService.Services.PastoralCare;
using ChurchRegister.ApiService.Services.RiskAssessments;
using ChurchRegister.ApiService.Services.Training;
using ChurchRegister.ApiService.Services.Reminders;
using ChurchRegister.ApiService.Services.ChurchMembers;
using ChurchRegister.Database.Constants;
using FastEndpoints;

namespace ChurchRegister.ApiService.Endpoints.Reports;

/// <summary>
/// Endpoints for monthly report pack - individual reports
/// Note: Attendance Analytics is generated client-side from rendered charts
/// </summary>

// 1. Pastoral Care Report
public class GetPastoralCareReportEndpoint : EndpointWithoutRequest
{
    private readonly IChurchMemberService _memberService;
    private readonly IPastoralCarePdfService _pdfService;

    public GetPastoralCareReportEndpoint(IChurchMemberService memberService, IPastoralCarePdfService pdfService)
    {
        _memberService = memberService;
        _pdfService = pdfService;
    }

    public override void Configure()
    {
        Get("/api/reports/monthly-pack/pastoral-care");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.MonthlyReportPack);
        Description(x => x
            .WithName("GetPastoralCareReport")
            .WithSummary("Get pastoral care report PDF")
            .Produces<byte[]>(200, "application/pdf")
            .WithTags("Reports", "MonthlyReportPack"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var reportData = await _memberService.GetPastoralCareReportDataAsync(ct);
        var pdfBytes = await _pdfService.GeneratePastoralCareReportAsync(reportData, ct);
        await SendBytesAsync(pdfBytes, "Pastoral-Care.pdf", "application/pdf", cancellation: ct);
    }
}

// 2. Training Certificates Report
public class GetTrainingReportEndpoint : EndpointWithoutRequest
{
    private readonly ITrainingCertificatePdfService _pdfService;

    public GetTrainingReportEndpoint(ITrainingCertificatePdfService pdfService)
    {
        _pdfService = pdfService;
    }

    public override void Configure()
    {
        Get("/api/reports/monthly-pack/training");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.MonthlyReportPack);
        Description(x => x
            .WithName("GetTrainingReport")
            .WithSummary("Get training certificates expiring report PDF")
            .Produces<byte[]>(200, "application/pdf")
            .WithTags("Reports", "MonthlyReportPack"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var pdfBytes = await _pdfService.GenerateExpiringReportAsync(60, ct);
        await SendBytesAsync(pdfBytes, "Training.pdf", "application/pdf", cancellation: ct);
    }
}

// 3. Risk Assessments Report
public class GetRiskAssessmentsReportEndpoint : EndpointWithoutRequest
{
    private readonly IRiskAssessmentPdfService _pdfService;

    public GetRiskAssessmentsReportEndpoint(IRiskAssessmentPdfService pdfService)
    {
        _pdfService = pdfService;
    }

    public override void Configure()
    {
        Get("/api/reports/monthly-pack/risk-assessments");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.MonthlyReportPack);
        Description(x => x
            .WithName("GetRiskAssessmentsReport")
            .WithSummary("Get risk assessments report PDF")
            .Produces<byte[]>(200, "application/pdf")
            .WithTags("Reports", "MonthlyReportPack"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var pdfBytes = await _pdfService.GenerateRiskAssessmentReportAsync(ct);
        await SendBytesAsync(pdfBytes, "Risk-Assessments.pdf", "application/pdf", cancellation: ct);
    }
}

// 4. Reminders Report
public class GetRemindersReportEndpoint : EndpointWithoutRequest
{
    private readonly IRemindersPdfService _pdfService;

    public GetRemindersReportEndpoint(IRemindersPdfService pdfService)
    {
        _pdfService = pdfService;
    }

    public override void Configure()
    {
        Get("/api/reports/monthly-pack/reminders");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.MonthlyReportPack);
        Description(x => x
            .WithName("GetRemindersReport")
            .WithSummary("Get reminders due report PDF")
            .Produces<byte[]>(200, "application/pdf")
            .WithTags("Reports", "MonthlyReportPack"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var pdfBytes = await _pdfService.GenerateDueReportAsync(60, ct);
        await SendBytesAsync(pdfBytes, "Reminders.pdf", "application/pdf", cancellation: ct);
    }
}
