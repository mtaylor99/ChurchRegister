namespace ChurchRegister.ApiService.Helpers;

/// <summary>
/// Centralised cookie configuration for authentication tokens.
/// Tokens are issued as httpOnly cookies to protect against XSS token theft.
/// </summary>
public static class AuthCookieHelper
{
    public const string AccessTokenCookieName = "access_token";
    public const string RefreshTokenCookieName = "refresh_token";

    /// <summary>
    /// Creates cookie options for the access token.
    /// Short-lived, httpOnly, not accessible via JavaScript.
    /// </summary>
    public static CookieOptions GetAccessTokenCookieOptions(IHostEnvironment environment, int expirationMinutes)
    {
        return new CookieOptions
        {
            HttpOnly = true,
            Secure = !environment.IsDevelopment(),
            SameSite = SameSiteMode.Strict,
            Path = "/",
            Expires = DateTimeOffset.UtcNow.AddMinutes(expirationMinutes),
            IsEssential = true
        };
    }

    /// <summary>
    /// Creates cookie options for the refresh token.
    /// Longer-lived, httpOnly, scoped to the auth refresh path.
    /// </summary>
    public static CookieOptions GetRefreshTokenCookieOptions(IHostEnvironment environment, int expirationDays)
    {
        return new CookieOptions
        {
            HttpOnly = true,
            Secure = !environment.IsDevelopment(),
            SameSite = SameSiteMode.Strict,
            Path = "/",
            Expires = DateTimeOffset.UtcNow.AddDays(expirationDays),
            IsEssential = true
        };
    }

    /// <summary>
    /// Creates cookie options that expire immediately (for clearing cookies on logout).
    /// </summary>
    public static CookieOptions GetExpiredCookieOptions(IHostEnvironment environment)
    {
        return new CookieOptions
        {
            HttpOnly = true,
            Secure = !environment.IsDevelopment(),
            SameSite = SameSiteMode.Strict,
            Path = "/",
            Expires = DateTimeOffset.UtcNow.AddDays(-1),
            IsEssential = true
        };
    }

    /// <summary>
    /// Sets both access and refresh token cookies on the response.
    /// </summary>
    public static void SetAuthCookies(
        HttpResponse response,
        IHostEnvironment environment,
        string accessToken,
        string refreshToken,
        int accessTokenExpirationMinutes,
        int refreshTokenExpirationDays)
    {
        response.Cookies.Append(
            AccessTokenCookieName,
            accessToken,
            GetAccessTokenCookieOptions(environment, accessTokenExpirationMinutes));

        response.Cookies.Append(
            RefreshTokenCookieName,
            refreshToken,
            GetRefreshTokenCookieOptions(environment, refreshTokenExpirationDays));
    }

    /// <summary>
    /// Clears both authentication cookies from the response.
    /// </summary>
    public static void ClearAuthCookies(HttpResponse response, IHostEnvironment environment)
    {
        var expiredOptions = GetExpiredCookieOptions(environment);
        response.Cookies.Append(AccessTokenCookieName, string.Empty, expiredOptions);
        response.Cookies.Append(RefreshTokenCookieName, string.Empty, expiredOptions);
    }
}
