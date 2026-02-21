using FastEndpoints;
using ChurchRegister.ApiService.Models.Security;
using ChurchRegister.ApiService.UseCase.Authentication.Login;

namespace ChurchRegister.ApiService.Endpoints.Security;

public class LoginEndpoint : Endpoint<LoginRequest, LoginResponse>
{
    private readonly ILoginUseCase _loginUseCase;

    public LoginEndpoint(ILoginUseCase loginUseCase)
    {
        _loginUseCase = loginUseCase;
    }

    public override void Configure()
    {
        Post("/api/auth/login");
        AllowAnonymous();
        Options(x => x.WithTags("Security"));
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
            await SendOkAsync(response, ct);
        }
        catch (UnauthorizedAccessException ex)
        {
            ThrowError(ex.Message, 401);
        }
    }
}
