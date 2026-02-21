namespace ChurchRegister.ApiService.Models.Districts;

/// <summary>
/// Data transfer object for district export information
/// </summary>
public class DistrictExportDto
{
    /// <summary>
    /// District name (A-L)
    /// </summary>
    public string DistrictName { get; set; } = string.Empty;
    
    /// <summary>
    /// Full name of assigned deacon
    /// </summary>
    public string DeaconName { get; set; } = string.Empty;
    
    /// <summary>
    /// Full name of assigned district officer
    /// </summary>
    public string DistrictOfficerName { get; set; } = string.Empty;
    
    /// <summary>
    /// List of active members in this district
    /// </summary>
    public List<DistrictExportMemberDto> Members { get; set; } = new();
}
