using ChurchRegister.ApiService.Models.MonthlyReportPack;

namespace ChurchRegister.ApiService.Services.Email;

/// <summary>
/// Service for email integration
/// </summary>
public interface IEmailService
{
    /// <summary>
    /// Check if Outlook is installed on the system
    /// </summary>
    /// <returns>True if Outlook is installed, false otherwise</returns>
    bool IsOutlookInstalled();

    /// <summary>
    /// Create an Outlook email draft with attachments
    /// </summary>
    /// <param name="template">Email template data including subject, body, and attachments</param>
    void CreateEmailWithAttachments(EmailTemplateData template);
}
