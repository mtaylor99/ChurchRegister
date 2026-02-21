using System.ComponentModel.DataAnnotations;

namespace ChurchRegister.ApiService.Models.Security;

/// <summary>
/// Request model for updating user information
/// </summary>
public class UpdateUserRequest
{
    /// <summary>
    /// User ID (from route parameter)
    /// </summary>
    [Required(ErrorMessage = "User ID is required")]
    public string UserId { get; set; } = string.Empty;

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
    /// Roles to assign to the user (will replace existing roles)
    /// </summary>
    [Required(ErrorMessage = "At least one role must be assigned")]
    public string[] Roles { get; set; } = Array.Empty<string>();
}