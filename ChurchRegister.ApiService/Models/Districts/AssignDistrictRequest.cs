namespace ChurchRegister.ApiService.Models.Districts;

/// <summary>
/// Request model for assigning a district to a church member
/// </summary>
public class AssignDistrictRequest
{
    /// <summary>
    /// District ID to assign to the member. Null to unassign.
    /// </summary>
    public int? DistrictId { get; set; }
}
