namespace ChurchRegister.ApiService.UseCase.ChurchMembers.ExportEnvelopeLabels;

/// <summary>
/// Generates an Avery L7163 Envelope Labels PDF for the given register year.
/// </summary>
public interface IExportEnvelopeLabelsUseCase
{
    Task<byte[]> ExecuteAsync(int year, CancellationToken ct);
}
