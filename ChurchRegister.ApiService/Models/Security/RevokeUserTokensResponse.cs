namespace ChurchRegister.ApiService.Models.Security;

/// <summary>
/// Response for token revocation operation
/// </summary>
public class RevokeUserTokensResponse
{
    /// <summary>
    /// Indicates if the operation was successful
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Message describing the result
    /// </summary>
    public required string Message { get; set; }

    /// <summary>
    /// Number of tokens revoked
    /// </summary>
    public int TokensRevoked { get; set; }
}
