using System.ComponentModel.DataAnnotations;
using ChurchRegister.Database.Enums;

namespace ChurchRegister.ApiService.Models.Security;

/// <summary>
/// Request model for updating user status
/// </summary>
public class UpdateUserStatusRequest
{
    /// <summary>
    /// User ID (from route parameter)
    /// </summary>
    [Required(ErrorMessage = "User ID is required")]
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// The action to perform on the user account
    /// </summary>
    [Required(ErrorMessage = "Action is required")]
    public UserStatusAction Action { get; set; }

    /// <summary>
    /// Optional reason for the status change (for audit purposes)
    /// </summary>
    [StringLength(500, ErrorMessage = "Reason must not exceed 500 characters")]
    public string? Reason { get; set; }
}

/// <summary>
/// Available user status actions
/// </summary>
public enum UserStatusAction
{
    /// <summary>
    /// Activate the user account
    /// </summary>
    Activate,
    
    /// <summary>
    /// Deactivate the user account
    /// </summary>
    Deactivate,
    
    /// <summary>
    /// Lock the user account
    /// </summary>
    Lock,
    
    /// <summary>
    /// Unlock the user account
    /// </summary>
    Unlock,
    
    /// <summary>
    /// Resend invitation email to user
    /// </summary>
    ResendInvitation
}