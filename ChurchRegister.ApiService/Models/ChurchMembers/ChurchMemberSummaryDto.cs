namespace ChurchRegister.ApiService.Models.ChurchMembers;

/// <summary>
/// Lightweight church member DTO for dropdowns and selections
/// </summary>
public class ChurchMemberSummaryDto
{
    /// <summary>
    /// Unique church member identifier
    /// </summary>
    public int Id { get; set; }
    
    /// <summary>
    /// Full display name (FirstName + LastName)
    /// </summary>
    public string FullName { get; set; } = string.Empty;
}
