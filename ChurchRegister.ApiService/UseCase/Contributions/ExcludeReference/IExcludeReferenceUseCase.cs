using ChurchRegister.ApiService.Models.Contributions;

namespace ChurchRegister.ApiService.UseCase.Contributions.ExcludeReference;

public interface IExcludeReferenceUseCase
{
    Task<ExcludeReferenceResponse> ExecuteAsync(int transactionId, string excludedBy, CancellationToken ct);
}
