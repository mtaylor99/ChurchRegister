using FastEndpoints;
using ChurchRegister.ApiService.Helpers;
using ChurchRegister.ApiService.Models.Security;
using ChurchRegister.ApiService.UseCase.Authentication.RefreshToken;

namespace ChurchRegister.ApiService.Endpoints.Security;

public class RefreshTokenEndpoint : Endpoint<RefreshTokenRequest, RefreshTokenResponse>
{
    private readonly IRefreshTokenUseCase _refreshTokenUseCase;
    private readonly IHostEnvironment _environment;
    private readonly IConfiguration _configuration;

    public RefreshTokenEndpoint(IRefreshTokenUseCase refreshTokenUseCase, IHostEnvironment environment, IConfiguration configuration)
    {
        _refreshTokenUseCase = refreshTokenUseCase;
        _environment = environment;
        _configuration = configuration;
    }

    public override void Configure()
    {
        Post("/api/auth/refresh-token");
        AllowAnonymous(); // Refresh token endpoint should be accessible without authentication
        Options(x => x.RequireRateLimiting("auth"));
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
            // Fall back to httpOnly cookie if no refresh token in the request body
            if (string.IsNullOrEmpty(request.RefreshToken))
            {
                request.RefreshToken = HttpContext.Request.Cookies[AuthCookieHelper.RefreshTokenCookieName] ?? string.Empty;
            }

            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            var response = await _refreshTokenUseCase.ExecuteAsync(request, ipAddress, ct);

            // Set new httpOnly cookies
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
