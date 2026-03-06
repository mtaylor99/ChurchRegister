namespace ChurchRegister.ApiService.UseCase.ChurchMembers.ExportAddressList;

public interface IExportAddressListUseCase
{
    Task<byte[]> ExecuteAsync(CancellationToken ct);
}
