using System.ComponentModel.DataAnnotations;

namespace ChurchRegister.ApiService.Models.Security;

public class LoginRequest
{
    [Required]
    [EmailAddress]
    [StringLength(256, ErrorMessage = "Email must not exceed 256 characters")]
    public string Email { get; set; } = string.Empty;

    [Required]
    [StringLength(100, ErrorMessage = "Password must not exceed 100 characters")]
    public string Password { get; set; } = string.Empty;

    public bool RememberMe { get; set; } = false;
}