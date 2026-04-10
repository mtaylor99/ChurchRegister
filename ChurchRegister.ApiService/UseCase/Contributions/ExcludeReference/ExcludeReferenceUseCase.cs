using ChurchRegister.ApiService.Models.Contributions;
using ChurchRegister.ApiService.Services.Contributions;

namespace ChurchRegister.ApiService.UseCase.Contributions.ExcludeReference;

public class ExcludeReferenceUseCase : IExcludeReferenceUseCase
{
    private readonly IHsbcUnmatchedTransactionService _service;

    public ExcludeReferenceUseCase(IHsbcUnmatchedTransactionService service)
    {
        _service = service;
    }

    public Task<ExcludeReferenceResponse> ExecuteAsync(int transactionId, string excludedBy, CancellationToken ct)
        => _service.ExcludeReferenceAsync(transactionId, excludedBy, ct);
}
