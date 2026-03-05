using System.ComponentModel.DataAnnotations;

namespace ChurchRegister.ApiService.Models.Security;

/// <summary>
/// Request model for creating a new user
/// </summary>
public class CreateUserRequest
{
    /// <summary>
    /// User's email address (will be used as username)
    /// </summary>
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    [StringLength(256, ErrorMessage = "Email must not exceed 256 characters")]
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// User's first name
    /// </summary>
    [Required(ErrorMessage = "First name is required")]
    [StringLength(100, ErrorMessage = "First name must not exceed 100 characters")]
    [RegularExpression(@"^[a-zA-Z\s\-']+$", ErrorMessage = "First name can only contain letters, spaces, hyphens, and apostrophes")]
    public string FirstName { get; set; } = string.Empty;

    /// <summary>
    /// User's last name
    /// </summary>
    [Required(ErrorMessage = "Last name is required")]
    [StringLength(100, ErrorMessage = "Last name must not exceed 100 characters")]
    [RegularExpression(@"^[a-zA-Z\s\-']+$", ErrorMessage = "Last name can only contain letters, spaces, hyphens, and apostrophes")]
    public string LastName { get; set; } = string.Empty;

    /// <summary>
    /// User's job title (optional)
    /// </summary>
    [StringLength(200, ErrorMessage = "Job title must not exceed 200 characters")]
    public string? JobTitle { get; set; }

    /// <summary>
    /// User's phone number (optional)
    /// </summary>
    [Phone(ErrorMessage = "Invalid phone number format")]
    [StringLength(20, ErrorMessage = "Phone number must not exceed 20 characters")]
    public string? PhoneNumber { get; set; }

    /// <summary>
    /// Roles to assign to the user
    /// </summary>
    [Required(ErrorMessage = "At least one role must be assigned")]
    public string[] Roles { get; set; } = Array.Empty<string>();

    /// <summary>
    /// Whether to send an invitation email with setup link
    /// </summary>
    public bool SendInvitationEmail { get; set; } = true;
}