namespace ChurchRegister.ApiService.Models.Contributions;

public record AssignTransactionResponse(
    bool Success,
    string Message,
    int ReProcessedMatchedCount);
