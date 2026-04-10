using ChurchRegister.Database.Entities;

namespace ChurchRegister.Database.Interfaces;

/// <summary>
/// Repository interface for managing refresh tokens
/// </summary>
public interface IRefreshTokenRepository
{
    /// <summary>
    /// Create a new refresh token
    /// </summary>
    Task<RefreshToken> CreateAsync(RefreshToken token, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get a refresh token by its value
    /// </summary>
    Task<RefreshToken?> GetByTokenAsync(string token, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get all active refresh tokens for a user
    /// </summary>
    Task<IEnumerable<RefreshToken>> GetActiveTokensForUserAsync(string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Revoke a specific refresh token
    /// </summary>
    Task RevokeAsync(string token, string? revokedByIp = null, string? replacedByToken = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Revoke all refresh tokens for a user
    /// </summary>
    Task RevokeAllForUserAsync(string userId, string? revokedByIp = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Remove expired tokens (cleanup)
    /// </summary>
    Task RemoveExpiredTokensAsync(CancellationToken cancellationToken = default);
}
