namespace ChurchRegister.ApiService.UseCase.Districts.ExportDistricts;

/// <summary>
/// Use case interface for exporting districts as PDF
/// </summary>
public interface IExportDistrictsUseCase
{
    /// <summary>
    /// Export districts with assigned deacons and their members as PDF
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>PDF file as byte array</returns>
    Task<byte[]> ExecuteAsync(CancellationToken cancellationToken = default);
}
