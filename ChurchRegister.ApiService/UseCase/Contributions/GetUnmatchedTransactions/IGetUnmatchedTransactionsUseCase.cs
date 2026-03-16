using ChurchRegister.ApiService.Models.Contributions;

namespace ChurchRegister.ApiService.UseCase.Contributions.GetUnmatchedTransactions;

public interface IGetUnmatchedTransactionsUseCase
{
    Task<GetUnmatchedTransactionsResponse> ExecuteAsync(CancellationToken ct);
}
