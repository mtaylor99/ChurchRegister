namespace ChurchRegister.ApiService.Models.Contributions;

public record ExcludedReferenceDto(
    int Id,
    string Reference,
    string CreatedBy,
    DateTime CreatedDateTime);
