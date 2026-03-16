using ChurchRegister.ApiService.Models.MonthlyReportPack;
using ChurchRegister.ApiService.Services.Email;
using ChurchRegister.ApiService.Services.MonthlyReportPack;

namespace ChurchRegister.ApiService.UseCase.MonthlyReportPack.GenerateMonthlyReportPack;

/// <summary>
/// Use case for generating monthly report pack and opening in Outlook
/// </summary>
public class GenerateMonthlyReportPackUseCase : IGenerateMonthlyReportPackUseCase
{
    private readonly IMonthlyReportPackService _monthlyReportPackService;
    private readonly IEmailService _emailService;
    private readonly EmailTemplateBuilder _emailTemplateBuilder;
    private readonly ILogger<GenerateMonthlyReportPackUseCase> _logger;

    public GenerateMonthlyReportPackUseCase(
        IMonthlyReportPackService monthlyReportPackService,
        IEmailService emailService,
        EmailTemplateBuilder emailTemplateBuilder,
        ILogger<GenerateMonthlyReportPackUseCase> logger)
    {
        _monthlyReportPackService = monthlyReportPackService;
        _emailService = emailService;
        _emailTemplateBuilder = emailTemplateBuilder;
        _logger = logger;
    }

    public async Task<MonthlyReportPackResult> ExecuteAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Starting monthly report pack generation");

        // Generate all reports
        var reportPackResult = await _monthlyReportPackService.GenerateReportPackAsync(cancellationToken);

        _logger.LogInformation("Report pack generated: {Success} of {Total} reports successful",
            reportPackResult.SuccessfulReports.Count,
            reportPackResult.SuccessfulReports.Count + reportPackResult.FailedReports.Count);

        // Build email template
        var emailTemplate = _emailTemplateBuilder.BuildMonthlyReportPackTemplate(reportPackResult);

        // Open Outlook with email
        _emailService.CreateEmailWithAttachments(emailTemplate);

        _logger.LogInformation("Monthly report pack email opened in Outlook");

        return reportPackResult;
    }
}
