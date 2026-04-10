using ChurchRegister.ApiService.Exceptions;
using ChurchRegister.ApiService.Models.Contributions;
using ChurchRegister.ApiService.Services.Contributions;
using Microsoft.Extensions.Logging;

namespace ChurchRegister.ApiService.UseCase.Contributions.AssignTransaction;

public class AssignTransactionUseCase : IAssignTransactionUseCase
{
    private readonly IHsbcUnmatchedTransactionService _service;
    private readonly ILogger<AssignTransactionUseCase> _logger;

    public AssignTransactionUseCase(
        IHsbcUnmatchedTransactionService service,
        ILogger<AssignTransactionUseCase> logger)
    {
        _service = service;
        _logger = logger;
    }

    public Task<AssignTransactionResponse> ExecuteAsync(
        int transactionId,
        AssignTransactionRequest request,
        string assignedBy,
        CancellationToken ct)
    {
        // Early validation: cannot assign same member twice
        if (request.SecondaryChurchMemberId.HasValue && 
            request.ChurchMemberId == request.SecondaryChurchMemberId.Value)
        {
            throw new ValidationException("Cannot assign the same member twice to a shared reference.");
        }

        _logger.LogInformation(
            "Assigning transaction {TransactionId} to primary member {PrimaryId} and secondary member {SecondaryId} by {User}",
            transactionId, request.ChurchMemberId, request.SecondaryChurchMemberId ?? 0, assignedBy);

        return _service.AssignTransactionToMemberAsync(
            transactionId,
            request.ChurchMemberId,
            request.SecondaryChurchMemberId,
            assignedBy,
            ct);
    }
}
