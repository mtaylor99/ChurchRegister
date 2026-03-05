namespace ChurchRegister.ApiService.UseCase.ChurchMembers.ExportPastoralCareReport;

/// <summary>
/// Use case for exporting pastoral care report as PDF
/// </summary>
public interface IExportPastoralCareReportUseCase
{
    /// <summary>
    /// Generate a pastoral care report PDF
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>PDF document as byte array</returns>
    Task<byte[]> ExecuteAsync(CancellationToken cancellationToken = default);
}
