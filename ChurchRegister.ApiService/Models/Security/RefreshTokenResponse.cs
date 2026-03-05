namespace ChurchRegister.ApiService.Models.Security;

public class RefreshTokenResponse
{
    public string Message { get; set; } = string.Empty;
    public TokenDto Tokens { get; set; } = new();
}
