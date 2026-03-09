using System.ComponentModel.DataAnnotations;
using ChurchRegister.Database.Interfaces;

namespace ChurchRegister.Database.Entities;

/// <summary>
/// Represents a refresh token for JWT authentication
/// </summary>
public class RefreshToken : IAuditableEntity
{
    /// <summary>
    /// Unique identifier for the refresh token
    /// </summary>
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// The refresh token value (cryptographically secure random string)
    /// </summary>
    [Required]
    [MaxLength(256)]
    public string Token { get; set; } = string.Empty;

    /// <summary>
    /// User ID this token belongs to
    /// </summary>
    [Required]
    [MaxLength(450)]
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// When the token expires
    /// </summary>
    [Required]
    public DateTime ExpiryDate { get; set; }

    /// <summary>
    /// Whether the token has been revoked
    /// </summary>
    public bool IsRevoked { get; set; } = false;

    /// <summary>
    /// When the token was revoked (if applicable)
    /// </summary>
    public DateTime? RevokedDate { get; set; }

    /// <summary>
    /// IP address that created this token
    /// </summary>
    [MaxLength(45)] // IPv6 max length
    public string? CreatedByIp { get; set; }

    /// <summary>
    /// IP address that revoked this token (if applicable)
    /// </summary>
    [MaxLength(45)]
    public string? RevokedByIp { get; set; }

    /// <summary>
    /// Token that replaced this one (if rotated)
    /// </summary>
    [MaxLength(256)]
    public string? ReplacedByToken { get; set; }

    // IAuditableEntity implementation
    public DateTime CreatedDateTime { get; set; }
    public DateTime? ModifiedDateTime { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public string? ModifiedBy { get; set; }

    /// <summary>
    /// Check if token is active (not expired and not revoked)
    /// </summary>
    public bool IsActive => !IsRevoked && DateTime.UtcNow < ExpiryDate;
}
