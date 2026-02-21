using System.ComponentModel.DataAnnotations;

namespace ChurchRegister.ApiService.Models.Security;

public class ChangePasswordRequest
{
    [Required]
    [StringLength(100, ErrorMessage = "Password must not exceed 100 characters")]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required]
    [StringLength(100, MinimumLength = 12, ErrorMessage = "Password must be between 12 and 100 characters")]
    public string NewPassword { get; set; } = string.Empty;

    [Required]
    [StringLength(100, ErrorMessage = "Password must not exceed 100 characters")]
    [Compare(nameof(NewPassword), ErrorMessage = "Passwords do not match")]
    public string ConfirmPassword { get; set; } = string.Empty;
}
