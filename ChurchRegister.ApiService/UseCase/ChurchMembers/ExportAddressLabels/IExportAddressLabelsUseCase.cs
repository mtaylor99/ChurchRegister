namespace ChurchRegister.ApiService.UseCase.ChurchMembers.ExportAddressLabels;

/// <summary>
/// Generates an Avery L7163 Address Labels PDF — one label per unique address.
/// </summary>
public interface IExportAddressLabelsUseCase
{
    Task<byte[]> ExecuteAsync(CancellationToken ct);
}
