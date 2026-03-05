using ChurchRegister.Database.Entities;
using ChurchRegister.Database.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ChurchRegister.Database.Data;

/// <summary>
/// Repository implementation for managing refresh tokens
/// </summary>
public class RefreshTokenRepository : IRefreshTokenRepository
{
    private readonly ChurchRegisterWebContext _context;

    public RefreshTokenRepository(ChurchRegisterWebContext context)
    {
        _context = context;
    }

    public async Task<RefreshToken> CreateAsync(RefreshToken token, CancellationToken cancellationToken = default)
    {
        _context.RefreshTokens.Add(token);
        await _context.SaveChangesAsync(cancellationToken);
        return token;
    }

    public async Task<RefreshToken?> GetByTokenAsync(string token, CancellationToken cancellationToken = default)
    {
        return await _context.RefreshTokens
            .FirstOrDefaultAsync(t => t.Token == token, cancellationToken);
    }

    public async Task<IEnumerable<RefreshToken>> GetActiveTokensForUserAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await _context.RefreshTokens
            .Where(t => t.UserId == userId && !t.IsRevoked && t.ExpiryDate > DateTime.UtcNow)
            .ToListAsync(cancellationToken);
    }

    public async Task RevokeAsync(string token, string? revokedByIp = null, string? replacedByToken = null, CancellationToken cancellationToken = default)
    {
        var refreshToken = await GetByTokenAsync(token, cancellationToken);
        if (refreshToken == null || refreshToken.IsRevoked)
            return;

        refreshToken.IsRevoked = true;
        refreshToken.RevokedDate = DateTime.UtcNow;
        refreshToken.RevokedByIp = revokedByIp;
        refreshToken.ReplacedByToken = replacedByToken;

        _context.RefreshTokens.Update(refreshToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task RevokeAllForUserAsync(string userId, string? revokedByIp = null, CancellationToken cancellationToken = default)
    {
        var tokens = await _context.RefreshTokens
            .Where(t => t.UserId == userId && !t.IsRevoked)
            .ToListAsync(cancellationToken);

        foreach (var token in tokens)
        {
            token.IsRevoked = true;
            token.RevokedDate = DateTime.UtcNow;
            token.RevokedByIp = revokedByIp;
        }

        if (tokens.Any())
        {
            _context.RefreshTokens.UpdateRange(tokens);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task RemoveExpiredTokensAsync(CancellationToken cancellationToken = default)
    {
        var expiredTokens = await _context.RefreshTokens
            .Where(t => t.ExpiryDate < DateTime.UtcNow)
            .ToListAsync(cancellationToken);

        if (expiredTokens.Any())
        {
            _context.RefreshTokens.RemoveRange(expiredTokens);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}
