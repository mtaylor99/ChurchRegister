namespace ChurchRegister.ApiService.Models.ChurchMembers;

/// <summary>
/// Data transfer object for church member status
/// </summary>
public class ChurchMemberStatusDto
{
    /// <summary>
    /// Unique status identifier
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Status name
    /// </summary>
    public string Name { get; set; } = string.Empty;
}
