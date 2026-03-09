namespace ChurchRegister.ApiService.Models.Contributions;

public record ExcludeReferenceResponse(
    bool Success,
    string Reference,
    string Message);
