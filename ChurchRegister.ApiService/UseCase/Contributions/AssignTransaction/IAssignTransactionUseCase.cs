using ChurchRegister.ApiService.Models.Contributions;

namespace ChurchRegister.ApiService.UseCase.Contributions.AssignTransaction;

public interface IAssignTransactionUseCase
{
    Task<AssignTransactionResponse> ExecuteAsync(
        int transactionId,
        AssignTransactionRequest request,
        string assignedBy,
        CancellationToken ct);
}
