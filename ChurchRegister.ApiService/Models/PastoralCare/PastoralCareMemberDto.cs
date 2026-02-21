namespace ChurchRegister.ApiService.Models.PastoralCare;

/// <summary>
/// Data transfer object for a church member entry in the pastoral care report
/// </summary>
public class PastoralCareMemberDto
{
    /// <summary>
    /// Unique church member identifier
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Member's first name
    /// </summary>
    public string FirstName { get; set; } = string.Empty;

    /// <summary>
    /// Member's last name
    /// </summary>
    public string LastName { get; set; } = string.Empty;

    /// <summary>
    /// Full display name (FirstName LastName)
    /// </summary>
    public string FullName => $"{FirstName} {LastName}";
}
