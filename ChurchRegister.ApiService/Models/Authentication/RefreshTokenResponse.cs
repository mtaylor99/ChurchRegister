namespace ChurchRegister.ApiService.Models.Authentication;

public class RefreshTokenResponse
{
    public string Message { get; set; } = string.Empty;
    public TokenDto Tokens { get; set; } = new();
}
