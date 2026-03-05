namespace ChurchRegister.ApiService.Models.Districts;

/// <summary>
/// Request to assign a description to a district
/// </summary>
public class AssignDescriptionRequest
{
    /// <summary>
    /// Description text for the district (null to clear)
    /// </summary>
    public string? Description { get; set; }
}
