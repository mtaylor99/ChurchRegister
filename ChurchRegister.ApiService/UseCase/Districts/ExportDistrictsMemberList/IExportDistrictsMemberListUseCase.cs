namespace ChurchRegister.ApiService.UseCase.Districts.ExportDistrictsMemberList;

/// <summary>
/// Use case for exporting a district members list as PDF
/// </summary>
public interface IExportDistrictsMemberListUseCase
{
    Task<byte[]> ExecuteAsync(CancellationToken cancellationToken = default);
}
