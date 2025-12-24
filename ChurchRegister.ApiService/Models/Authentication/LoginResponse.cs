namespace ChurchRegister.ApiService.Models.Authentication;

public class LoginResponse
{
    public string Message { get; set; } = string.Empty;
    public UserDto User { get; set; } = new();
    public TokenDto Tokens { get; set; } = new();
    public bool RequirePasswordChange { get; set; } = false;
}