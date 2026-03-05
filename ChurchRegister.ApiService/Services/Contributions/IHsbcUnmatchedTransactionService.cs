using ChurchRegister.ApiService.Models.Contributions;

namespace ChurchRegister.ApiService.Services.Contributions;

public interface IHsbcUnmatchedTransactionService
{
    Task<GetUnmatchedTransactionsResponse> GetUnmatchedTransactionsAsync(CancellationToken ct);

    Task<AssignTransactionResponse> AssignTransactionToMemberAsync(
        int transactionId,
        int churchMemberId,
        string assignedBy,
        CancellationToken ct);

    Task<ExcludeReferenceResponse> ExcludeReferenceAsync(
        int transactionId,
        string excludedBy,
        CancellationToken ct);
}
