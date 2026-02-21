namespace ChurchRegister.ApiService.Models.Security;

/// <summary>
/// Data transfer object for system roles
/// </summary>
public class SystemRoleDto
{
    /// <summary>
    /// Role ID
    /// </summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// Role name
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Role display name (user-friendly)
    /// </summary>
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>
    /// Role description
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Role category (e.g., "Administration", "Financial", "Attendance")
    /// </summary>
    public string Category { get; set; } = string.Empty;

    /// <summary>
    /// Whether this is a high-privilege role
    /// </summary>
    public bool IsHighPrivilege { get; set; }
}