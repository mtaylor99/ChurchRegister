using ChurchRegister.ApiService.Models.MonthlyReportPack;

namespace ChurchRegister.ApiService.Services.Email;

/// <summary>
/// Service for building email templates
/// </summary>
public class EmailTemplateBuilder
{
    private readonly IConfiguration _configuration;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public EmailTemplateBuilder(
        IConfiguration configuration,
        IHttpContextAccessor httpContextAccessor)
    {
        _configuration = configuration;
        _httpContextAccessor = httpContextAccessor;
    }

    /// <summary>
    /// Build email template for monthly report pack
    /// </summary>
    /// <param name="reportPackResult">Generated report pack result</param>
    /// <returns>Email template with subject, body, and attachments</returns>
    public EmailTemplateData BuildMonthlyReportPackTemplate(MonthlyReportPackResult reportPackResult)
    {
        var churchName = _configuration["ChurchName"] ?? "Church";
        var userName = _httpContextAccessor.HttpContext?.User?.Identity?.Name ?? "System";
        var currentMonth = DateTime.Now.ToString("MMMM yyyy");
        var generatedDate = reportPackResult.GeneratedDate.ToString("dd MMMM yyyy");

        var template = new EmailTemplateData
        {
            Subject = $"Monthly Report Pack - {currentMonth}",
            Body = BuildEmailBody(churchName, generatedDate, userName, reportPackResult),
            Attachments = reportPackResult.SuccessfulReports
                .Select(r => new EmailAttachment
                {
                    FileName = r.FileName,
                    FileData = r.FileData
                })
                .ToList()
        };

        return template;
    }

    private string BuildEmailBody(
        string churchName,
        string generatedDate,
        string userName,
        MonthlyReportPackResult reportPackResult)
    {
        var reportsList = string.Join(Environment.NewLine, reportPackResult.SuccessfulReports
            .Select((r, index) => $"{index + 1}. {r.FileName.Replace(".pdf", "")} Report"));

        var body = $@"Dear Recipient,

Please find attached the monthly report pack for {churchName}, generated on {generatedDate}.

This pack includes the following reports:

{reportsList}
";

        if (reportPackResult.FailedReports.Any())
        {
            var failedReports = string.Join(Environment.NewLine, reportPackResult.FailedReports
                .Select(f => $"- {f.ReportName}: {f.ErrorMessage}"));

            body += $@"

Note: The following reports could not be generated:

{failedReports}
";
        }

        body += $@"

If you have any questions regarding these reports, please contact the church office.

Best regards,
{userName}
";

        return body;
    }
}
