using System.ComponentModel.DataAnnotations;

namespace ChurchRegister.ApiService.Models.Security;

public class RefreshTokenRequest
{
    [Required]
    [StringLength(500, ErrorMessage = "Refresh token must not exceed 500 characters")]
    public string RefreshToken { get; set; } = string.Empty;
}
