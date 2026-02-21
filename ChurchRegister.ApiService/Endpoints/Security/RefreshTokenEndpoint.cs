using FastEndpoints;
using ChurchRegister.ApiService.Models.Security;
using ChurchRegister.ApiService.UseCase.Authentication.RefreshToken;

namespace ChurchRegister.ApiService.Endpoints.Security;

public class RefreshTokenEndpoint : Endpoint<RefreshTokenRequest, RefreshTokenResponse>
{
    private readonly IRefreshTokenUseCase _refreshTokenUseCase;

    public RefreshTokenEndpoint(IRefreshTokenUseCase refreshTokenUseCase)
    {
        _refreshTokenUseCase = refreshTokenUseCase;
    }

    public override void Configure()
    {
        Post("/api/auth/refresh-token");
        AllowAnonymous(); // Refresh token endpoint should be accessible without authentication
        Summary(s =>
        {
            s.Summary = "Refresh access token";
            s.Description = "Exchange a refresh token for a new access token and refresh token pair";
        });
    }

    public override async Task HandleAsync(RefreshTokenRequest request, CancellationToken ct)
    {
        try
        {
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            var response = await _refreshTokenUseCase.ExecuteAsync(request, ipAddress, ct);
            await SendOkAsync(response, ct);
        }
        catch (UnauthorizedAccessException ex)
        {
            ThrowError(ex.Message, 401);
        }
    }
}
