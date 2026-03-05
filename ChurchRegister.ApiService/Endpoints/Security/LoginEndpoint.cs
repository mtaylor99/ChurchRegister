using FastEndpoints;
using ChurchRegister.ApiService.Helpers;
using ChurchRegister.ApiService.Models.Security;
using ChurchRegister.ApiService.UseCase.Authentication.Login;
using System.Threading.RateLimiting;

namespace ChurchRegister.ApiService.Endpoints.Security;

public class LoginEndpoint : Endpoint<LoginRequest, LoginResponse>
{
    private readonly ILoginUseCase _loginUseCase;
    private readonly IHostEnvironment _environment;
    private readonly IConfiguration _configuration;

    public LoginEndpoint(ILoginUseCase loginUseCase, IHostEnvironment environment, IConfiguration configuration)
    {
        _loginUseCase = loginUseCase;
        _environment = environment;
        _configuration = configuration;
    }

    public override void Configure()
    {
        Post("/api/auth/login");
        AllowAnonymous();
        Options(x => x
            .WithTags("Security")
            .RequireRateLimiting("auth"));
        Summary(s =>
        {
            s.Summary = "User login";
            s.Description = "Authenticate user with email and password, returns JWT token";
            s.ResponseExamples[200] = new LoginResponse
            {
                Message = "Login successful",
                User = new UserDto
                {
                    Id = "user123",
                    Email = "user@example.com",
                    DisplayName = "John Doe"
                },
                Tokens = new TokenDto
                {
                    AccessToken = "jwt_token_here",
                    TokenType = "Bearer",
                    ExpiresIn = 43200
                }
            };
        });
    }

    public override async Task HandleAsync(LoginRequest request, CancellationToken ct)
    {
        try
        {
            var response = await _loginUseCase.ExecuteAsync(request, ct);

            // Set httpOnly cookies for secure token storage
            var accessMinutes = int.TryParse(_configuration["Jwt:AccessTokenExpirationMinutes"], out var m) ? m : 60;
            var refreshDays = int.TryParse(_configuration["Jwt:RefreshTokenExpirationDays"], out var d) ? d : 7;
            AuthCookieHelper.SetAuthCookies(
                HttpContext.Response, _environment,
                response.Tokens.AccessToken, response.Tokens.RefreshToken,
                accessMinutes, refreshDays);

            await Send.OkAsync(response, ct);
        }
        catch (UnauthorizedAccessException ex)
        {
            ThrowError(ex.Message, 401);
        }
    }
}
