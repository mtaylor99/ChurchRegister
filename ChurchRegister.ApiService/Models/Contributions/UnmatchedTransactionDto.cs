namespace ChurchRegister.ApiService.Models.Contributions;

public record UnmatchedTransactionDto(
    int Id,
    DateTime Date,
    string Reference,
    string? Description,
    decimal Amount);
