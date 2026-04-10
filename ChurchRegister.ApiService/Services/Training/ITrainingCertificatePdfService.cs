using ChurchRegister.ApiService.Models.Training;

namespace ChurchRegister.ApiService.Services.Training;

/// <summary>
/// Service for generating PDF reports for training certificates
/// </summary>
public interface ITrainingCertificatePdfService
{
    /// <summary>
    /// Generate a report of training certificates expiring within specified days
    /// </summary>
    /// <param name="daysAhead">Number of days to look ahead for expiring certificates</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>PDF document as byte array</returns>
    Task<byte[]> GenerateExpiringReportAsync(int daysAhead, CancellationToken cancellationToken = default);
}
