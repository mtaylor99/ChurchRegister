namespace ChurchRegister.ApiService.Models.ChurchMembers;

/// <summary>
/// Data transfer object for church member role
/// </summary>
public class ChurchMemberRoleDto
{
    /// <summary>
    /// Unique role type identifier
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Role type name
    /// </summary>
    public string Type { get; set; } = string.Empty;
}
