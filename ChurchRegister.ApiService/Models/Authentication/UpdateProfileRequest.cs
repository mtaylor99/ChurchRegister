namespace ChurchRegister.ApiService.Models.Authentication;

public class UpdateProfileRequest
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? DisplayName { get; set; }
    public string? Avatar { get; set; }
}
