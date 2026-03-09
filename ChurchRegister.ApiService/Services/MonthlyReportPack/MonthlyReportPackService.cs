using ChurchRegister.ApiService.Models.MonthlyReportPack;
using ChurchRegister.ApiService.Services.Attendance;
using ChurchRegister.ApiService.Services.PastoralCare;
using ChurchRegister.ApiService.Services.RiskAssessments;
using ChurchRegister.ApiService.Services.Training;
using ChurchRegister.ApiService.Services.Reminders;

namespace ChurchRegister.ApiService.Services.MonthlyReportPack;

/// <summary>
/// Orchestrator service for generating monthly report pack
/// </summary>
public class MonthlyReportPackService : IMonthlyReportPackService
{
    private readonly IAttendancePdfService _attendancePdfService;
    private readonly IPastoralCarePdfService _pastoralCarePdfService;
    private readonly ITrainingCertificatePdfService _trainingPdfService;
    private readonly IRiskAssessmentPdfService _riskAssessmentPdfService;
    private readonly IRemindersPdfService _remindersPdfService;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<MonthlyReportPackService> _logger;

    public MonthlyReportPackService(
        IAttendancePdfService attendancePdfService,
        IPastoralCarePdfService pastoralCarePdfService,
        ITrainingCertificatePdfService trainingPdfService,
        IRiskAssessmentPdfService riskAssessmentPdfService,
        IRemindersPdfService remindersPdfService,
        IHttpContextAccessor httpContextAccessor,
        ILogger<MonthlyReportPackService> logger)
    {
        _attendancePdfService = attendancePdfService;
        _pastoralCarePdfService = pastoralCarePdfService;
        _trainingPdfService = trainingPdfService;
        _riskAssessmentPdfService = riskAssessmentPdfService;
        _remindersPdfService = remindersPdfService;
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    public async Task<MonthlyReportPackResult> GenerateReportPackAsync(CancellationToken cancellationToken)
    {
        var result = new MonthlyReportPackResult
        {
            GeneratedDate = DateTime.UtcNow,
            GeneratedBy = _httpContextAccessor.HttpContext?.User?.Identity?.Name ?? "Unknown"
        };

        _logger.LogInformation("Starting monthly report pack generation for user: {User}", result.GeneratedBy);

        // Create timeout cancellation token source (60 seconds)
        using var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(60));
        using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, timeoutCts.Token);

        // Generate all reports in parallel
        var tasks = new Dictionary<string, Task<byte[]>>
        {
            ["Attendance.pdf"] = GenerateReportSafe(_attendancePdfService.GenerateAttendanceReportAsync, "Attendance", linkedCts.Token),
            ["Pastoral Care.pdf"] = GenerateReportSafe(async ct =>
            {
                // For pastoral care, we need to get the report data first
                // This is a simplified version - you may need to inject the church member service
                return await _pastoralCarePdfService.GeneratePastoralCareReportAsync(
                    new Models.PastoralCare.PastoralCareReportDto
                    {
                        Districts = Array.Empty<Models.PastoralCare.PastoralCareDistrictDto>(),
                        TotalMembers = 0,
                        GeneratedDate = DateTime.UtcNow
                    }, ct);
            }, "Pastoral Care", linkedCts.Token),
            ["Training.pdf"] = GenerateReportSafe(ct => _trainingPdfService.GenerateExpiringReportAsync(60, ct), "Training", linkedCts.Token),
            ["Risk Assessments.pdf"] = GenerateReportSafe(_riskAssessmentPdfService.GenerateRiskAssessmentReportAsync, "Risk Assessments", linkedCts.Token),
            ["Reminders.pdf"] = GenerateReportSafe(ct => _remindersPdfService.GenerateDueReportAsync(60, ct), "Reminders", linkedCts.Token)
        };

        // Wait for all tasks to complete
        await Task.WhenAll(tasks.Values);

        // Collect results
        foreach (var (fileName, task) in tasks)
        {
            try
            {
                var pdfBytes = await task;
                result.SuccessfulReports.Add(new ReportFile
                {
                    FileName = fileName,
                    FileData = pdfBytes,
                    MimeType = "application/pdf"
                });

                _logger.LogInformation("Successfully generated {FileName} ({Size} bytes)", fileName, pdfBytes.Length);
            }
            catch (Exception ex)
            {
                var reportName = fileName.Replace(".pdf", "");
                result.FailedReports.Add(new ReportFailure
                {
                    ReportName = reportName,
                    ErrorMessage = ex.Message
                });

                _logger.LogError(ex, "Failed to generate {ReportName} report", reportName);
            }
        }

        _logger.LogInformation("Monthly report pack generation completed: {Success} of {Total} reports successful",
            result.SuccessfulReports.Count, tasks.Count);

        return result;
    }

    private async Task<byte[]> GenerateReportSafe(
        Func<CancellationToken, Task<byte[]>> reportGenerator,
        string reportName,
        CancellationToken cancellationToken)
    {
        try
        {
            return await reportGenerator(cancellationToken);
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("{ReportName} generation was cancelled", reportName);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating {ReportName} report", reportName);
            throw;
        }
    }
}
