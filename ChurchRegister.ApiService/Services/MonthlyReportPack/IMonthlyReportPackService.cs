using ChurchRegister.ApiService.Models.MonthlyReportPack;

namespace ChurchRegister.ApiService.Services.MonthlyReportPack;

/// <summary>
/// Service for orchestrating monthly report pack generation
/// </summary>
public interface IMonthlyReportPackService
{
    /// <summary>
    /// Generates all reports in the monthly pack and returns file data
    /// </summary>
    /// <param name="cancellationToken">Cancellation token for stopping generation</param>
    /// <returns>Collection of generated report files with metadata</returns>
    Task<MonthlyReportPackResult> GenerateReportPackAsync(CancellationToken cancellationToken);
}
