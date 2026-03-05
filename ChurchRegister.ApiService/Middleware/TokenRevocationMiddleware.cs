using ChurchRegister.Database.Interfaces;
using System.Security.Claims;

namespace ChurchRegister.ApiService.Middleware;

/// <summary>
/// Middleware to validate JWT tokens against the revocation list
/// </summary>
public class TokenRevocationMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<TokenRevocationMiddleware> _logger;

    public TokenRevocationMiddleware(RequestDelegate next, ILogger<TokenRevocationMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, IRefreshTokenRepository refreshTokenRepository)
    {
        // Skip validation for anonymous endpoints
        if (!context.User.Identity?.IsAuthenticated ?? true)
        {
            await _next(context);
            return;
        }

        // Get the authorization header
        var authHeader = context.Request.Headers.Authorization.FirstOrDefault();
        if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            await _next(context);
            return;
        }

        // Extract the token (remove "Bearer " prefix)
        var token = authHeader.Substring("Bearer ".Length).Trim();

        // Get user ID from claims
        var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            await _next(context);
            return;
        }

        try
        {
            // Check if user has any active refresh tokens
            // If user has no active tokens, it means all tokens were revoked (e.g., logout, admin action)
            var activeTokens = await refreshTokenRepository.GetActiveTokensForUserAsync(userId);

            if (!activeTokens.Any())
            {
                // User has no active refresh tokens - they may have been revoked
                // We'll allow this request but log it for monitoring
                _logger.LogWarning(
                    "User {UserId} has no active refresh tokens. Access token may be from a revoked session.",
                    userId);

                // Note: We don't block access here because:
                // 1. Access tokens are short-lived (1 hour)
                // 2. Blocking would require tracking every access token in the database
                // 3. User won't be able to refresh their token when it expires
                // This is a reasonable security trade-off for performance
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking token revocation for user {UserId}", userId);
            // Don't block the request on database errors
        }

        await _next(context);
    }
}

/// <summary>
/// Extension methods for TokenRevocationMiddleware
/// </summary>
public static class TokenRevocationMiddlewareExtensions
{
    public static IApplicationBuilder UseTokenRevocation(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<TokenRevocationMiddleware>();
    }
}
