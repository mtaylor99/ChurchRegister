using ChurchRegister.Database.Enums;

namespace ChurchRegister.ApiService.Models.Security;

/// <summary>
/// Data transfer object for user profile information
/// </summary>
public class UserProfileDto
{
    /// <summary>
    /// Unique user identifier
    /// </summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// User's email address (immutable after creation)
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// User's first name
    /// </summary>
    public string FirstName { get; set; } = string.Empty;

    /// <summary>
    /// User's last name
    /// </summary>
    public string LastName { get; set; } = string.Empty;

    /// <summary>
    /// User's phone number (optional)
    /// </summary>
    public string? PhoneNumber { get; set; }

    /// <summary>
    /// User's job title (optional)
    /// </summary>
    public string? JobTitle { get; set; }

    /// <summary>
    /// Date when the user joined the system
    /// </summary>
    public DateTime DateJoined { get; set; }

    /// <summary>
    /// Current status of the user account
    /// </summary>
    public UserAccountStatus Status { get; set; }

    /// <summary>
    /// Roles assigned to the user
    /// </summary>
    public string[] Roles { get; set; } = Array.Empty<string>();

    /// <summary>
    /// Generated avatar using initials
    /// </summary>
    public string Avatar { get; set; } = string.Empty;

    /// <summary>
    /// When the user record was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When the user record was last modified
    /// </summary>
    public DateTime? LastModified { get; set; }

    /// <summary>
    /// Who last modified the user record
    /// </summary>
    public string? ModifiedBy { get; set; }

    /// <summary>
    /// Full display name (FirstName + LastName)
    /// </summary>
    public string FullName => $"{FirstName} {LastName}";

    /// <summary>
    /// Whether the user's email is confirmed
    /// </summary>
    public bool EmailConfirmed { get; set; }

    /// <summary>
    /// Last login date (if available)
    /// </summary>
    public DateTime? LastLogin { get; set; }
}