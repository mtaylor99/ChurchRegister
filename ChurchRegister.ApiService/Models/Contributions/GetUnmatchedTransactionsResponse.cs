namespace ChurchRegister.ApiService.Models.Contributions;

public record GetUnmatchedTransactionsResponse(
    int TotalCount,
    List<UnmatchedTransactionDto> Items);
