namespace ChurchRegister.ApiService.UseCase.ChurchMembers.ExportEnvelopeNumbers;

/// <summary>
/// Generates an Envelope Number Review Excel workbook for the given year.
/// </summary>
public interface IExportEnvelopeNumbersUseCase
{
    Task<byte[]> ExecuteAsync(int year, CancellationToken ct);
}
