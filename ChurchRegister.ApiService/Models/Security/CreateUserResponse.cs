namespace ChurchRegister.ApiService.Models.Security;

/// <summary>
/// Response model for user creation
/// </summary>
public class CreateUserResponse
{
    /// <summary>
    /// ID of the newly created user
    /// </summary>
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// Success message
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Whether email verification was sent
    /// </summary>
    public bool EmailVerificationSent { get; set; }

    /// <summary>
    /// The created user's profile information
    /// </summary>
    public UserProfileDto User { get; set; } = new();
}