using FastEndpoints;
using ChurchRegister.ApiService.Models.Security;
using ChurchRegister.ApiService.UseCase.Authentication.Logout;

namespace ChurchRegister.ApiService.Endpoints.Security;

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
        await SendOkAsync(response, ct);
    }
}
