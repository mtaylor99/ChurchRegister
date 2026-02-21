namespace ChurchRegister.ApiService.Models.Districts;

/// <summary>
/// Data transfer object for church district information
/// </summary>
public class DistrictDto
{
    /// <summary>
    /// Unique identifier for the district
    /// </summary>
    public int Id { get; set; }
    
    /// <summary>
    /// District name (A-L)
    /// </summary>
    public string Name { get; set; } = string.Empty;
    
    /// <summary>
    /// ID of assigned deacon (nullable)
    /// </summary>
    public int? DeaconId { get; set; }
    
    /// <summary>
    /// Full name of assigned deacon
    /// </summary>
    public string? DeaconName { get; set; }
    
    /// <summary>
    /// ID of assigned district officer (nullable)
    /// </summary>
    public int? DistrictOfficerId { get; set; }
    
    /// <summary>
    /// Full name of assigned district officer
    /// </summary>
    public string? DistrictOfficerName { get; set; }
    
    /// <summary>
    /// Count of active members in this district
    /// </summary>
    public int MemberCount { get; set; }
}
