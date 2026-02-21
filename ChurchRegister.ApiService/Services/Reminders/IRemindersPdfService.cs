using ChurchRegister.ApiService.Models.Reminders;

namespace ChurchRegister.ApiService.Services.Reminders;

/// <summary>
/// Service for generating PDF reports for reminders
/// </summary>
public interface IRemindersPdfService
{
    /// <summary>
    /// Generate a report of reminders due within specified days
    /// </summary>
    /// <param name="daysAhead">Number of days to look ahead for due reminders</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>PDF document as byte array</returns>
    Task<byte[]> GenerateDueReportAsync(int daysAhead, CancellationToken cancellationToken = default);
}
