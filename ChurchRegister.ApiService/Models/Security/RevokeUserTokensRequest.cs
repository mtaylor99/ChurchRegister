using System.ComponentModel.DataAnnotations;

namespace ChurchRegister.ApiService.Models.Security;

/// <summary>
/// Request to revoke all tokens for a specific user
/// </summary>
public class RevokeUserTokensRequest
{
    /// <summary>
    /// The ID of the user whose tokens should be revoked
    /// </summary>
    [Required(ErrorMessage = "User ID is required")]
    [StringLength(450, ErrorMessage = "User ID must not exceed 450 characters")]
    public required string UserId { get; set; }

    /// <summary>
    /// Reason for revoking tokens (for audit purposes)
    /// </summary>
    [StringLength(500, ErrorMessage = "Reason must not exceed 500 characters")]
    public string? Reason { get; set; }
}
