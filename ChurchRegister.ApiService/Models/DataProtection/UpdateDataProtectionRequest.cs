namespace ChurchRegister.ApiService.Models.DataProtection;

/// <summary>
/// Request model for updating data protection consent preferences
/// </summary>
public class UpdateDataProtectionRequest
{
    /// <summary>
    /// Permission for member's name to be included in church newsletter or other church communications
    /// </summary>
    public bool AllowNameInCommunications { get; set; }

    /// <summary>
    /// Permission for member's health status to be mentioned in church communications
    /// </summary>
    public bool AllowHealthStatusInCommunications { get; set; }

    /// <summary>
    /// Permission for member's photo to be included in church communications (newsletter, printed materials)
    /// </summary>
    public bool AllowPhotoInCommunications { get; set; }

    /// <summary>
    /// Permission for member's photo to be published on social media platforms
    /// </summary>
    public bool AllowPhotoInSocialMedia { get; set; }

    /// <summary>
    /// Permission for member to be included in group photos
    /// </summary>
    public bool GroupPhotos { get; set; }

    /// <summary>
    /// Permission for photos of member's children to be used in church communications or social media
    /// </summary>
    public bool PermissionForMyChildren { get; set; }
}
