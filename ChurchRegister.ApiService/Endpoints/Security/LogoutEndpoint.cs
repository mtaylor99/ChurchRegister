using FastEndpoints;
using ChurchRegister.ApiService.Helpers;
using ChurchRegister.ApiService.Models.Security;
using ChurchRegister.ApiService.UseCase.Authentication.Logout;

namespace ChurchRegister.ApiService.Endpoints.Security;

public class LogoutEndpoint : EndpointWithoutRequest<LogoutResponse>
{
    private readonly ILogoutUseCase _logoutUseCase;
    private readonly IHostEnvironment _environment;

    public LogoutEndpoint(ILogoutUseCase logoutUseCase, IHostEnvironment environment)
    {
        _logoutUseCase = logoutUseCase;
        _environment = environment;
    }

    public override void Configure()
    {
        Post("/api/auth/logout");
        Policies("Bearer");
        Options(x => x.WithTags("Security"));
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

        // Clear httpOnly auth cookies
        AuthCookieHelper.ClearAuthCookies(HttpContext.Response, _environment);

        await Send.OkAsync(response, ct);
    }
}
