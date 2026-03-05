namespace ChurchRegister.ApiService.Models.Districts;

/// <summary>
/// Request to assign a district officer to a district
/// </summary>
public class AssignDistrictOfficerRequest
{
    /// <summary>
    /// ID of the district officer to assign (null to unassign)
    /// </summary>
    public int? DistrictOfficerId { get; set; }
}
