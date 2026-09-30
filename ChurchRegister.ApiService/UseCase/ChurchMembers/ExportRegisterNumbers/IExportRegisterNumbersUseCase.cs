namespace ChurchRegister.ApiService.UseCase.ChurchMembers.ExportRegisterNumbers;

public interface IExportRegisterNumbersUseCase
{
    Task<byte[]> ExecuteAsync(int year, CancellationToken ct);
}
