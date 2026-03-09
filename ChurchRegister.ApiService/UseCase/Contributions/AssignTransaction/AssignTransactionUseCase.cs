using ChurchRegister.ApiService.Models.Contributions;
using ChurchRegister.ApiService.Services.Contributions;

namespace ChurchRegister.ApiService.UseCase.Contributions.AssignTransaction;

public class AssignTransactionUseCase : IAssignTransactionUseCase
{
    private readonly IHsbcUnmatchedTransactionService _service;

    public AssignTransactionUseCase(IHsbcUnmatchedTransactionService service)
    {
        _service = service;
    }

    public Task<AssignTransactionResponse> ExecuteAsync(
        int transactionId,
        AssignTransactionRequest request,
        string assignedBy,
        CancellationToken ct)
        => _service.AssignTransactionToMemberAsync(transactionId, request.ChurchMemberId, assignedBy, ct);
}
