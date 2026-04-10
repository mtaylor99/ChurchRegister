namespace ChurchRegister.ApiService.Models.Contributions;

/// <summary>
/// Response from assigning a transaction to member(s)
/// </summary>
public record AssignTransactionResponse(
    bool Success,
    string Message,
    int ReProcessedMatchedCount,
    bool IsSharedReference,
    int ContributionsCreated);
