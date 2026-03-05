using ChurchRegister.ApiService.Models.Contributions;
using ChurchRegister.ApiService.Services.Contributions;

namespace ChurchRegister.ApiService.UseCase.Contributions.GetUnmatchedTransactions;

public class GetUnmatchedTransactionsUseCase : IGetUnmatchedTransactionsUseCase
{
    private readonly IHsbcUnmatchedTransactionService _service;

    public GetUnmatchedTransactionsUseCase(IHsbcUnmatchedTransactionService service)
    {
        _service = service;
    }

    public Task<GetUnmatchedTransactionsResponse> ExecuteAsync(CancellationToken ct)
        => _service.GetUnmatchedTransactionsAsync(ct);
}
