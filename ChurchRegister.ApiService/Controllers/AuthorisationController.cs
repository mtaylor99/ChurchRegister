using FastEndpoints;
using ChurchRegister.ApiService.Models.Authentication;
using ChurchRegister.ApiService.UseCase.Authentication.Login;
using ChurchRegister.ApiService.UseCase.Authentication.Logout;
using ChurchRegister.ApiService.UseCase.Authentication.GetCurrentUser;

namespace ChurchRegister.ApiService.Controllers;

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

public class LogoutEndpoint : EndpointWithoutRequest<LogoutResponse>
{
    private readonly ILogoutUseCase _logoutUseCase;

    public LogoutEndpoint(ILogoutUseCase logoutUseCase)
    {
        _logoutUseCase = logoutUseCase;
    }

    public override void Configure()
    {
        Post("/api/auth/logout");
        Policies("Bearer"); // Changed from AllowAnonymous to require authentication
        Summary(s =>
        {
            s.Summary = "User logout";
            s.Description = "Sign out the current user and revoke all refresh tokens";
        });
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var response = await _logoutUseCase.ExecuteAsync(User, ipAddress, ct);
        await SendOkAsync(response, ct);
    }
}

public class GetCurrentUserEndpoint : EndpointWithoutRequest<UserDto>
{
    private readonly IGetCurrentUserUseCase _getCurrentUserUseCase;

    public GetCurrentUserEndpoint(IGetCurrentUserUseCase getCurrentUserUseCase)
    {
        _getCurrentUserUseCase = getCurrentUserUseCase;
    }

    public override void Configure()
    {
        Get("/api/auth/user");
        Policies("Bearer");
        Summary(s =>
        {
            s.Summary = "Get current user";
            s.Description = "Retrieve information about the currently authenticated user";
        });
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        try
        {
            var response = await _getCurrentUserUseCase.ExecuteAsync(User, ct);
            await SendOkAsync(response, ct);
        }
        catch (UnauthorizedAccessException)
        {
            await SendUnauthorizedAsync(ct);
        }
    }
}