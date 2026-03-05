using ChurchRegister.ApiService.Models.PastoralCare;

namespace ChurchRegister.ApiService.Services.PastoralCare;

/// <summary>
/// Service for generating PDF reports for pastoral care
/// </summary>
public interface IPastoralCarePdfService
{
    /// <summary>
    /// Generate a pastoral care report PDF
    /// </summary>
    /// <param name="reportData">The pastoral care report data</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>PDF document as byte array</returns>
    Task<byte[]> GeneratePastoralCareReportAsync(PastoralCareReportDto reportData, CancellationToken cancellationToken = default);
}
