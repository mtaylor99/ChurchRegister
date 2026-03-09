namespace ChurchRegister.ApiService.Models.Districts;

/// <summary>
/// Request to assign a deacon to a district
/// </summary>
public class AssignDeaconRequest
{
    /// <summary>
    /// ID of the deacon to assign (null to unassign)
    /// </summary>
    public int? DeaconId { get; set; }
}
