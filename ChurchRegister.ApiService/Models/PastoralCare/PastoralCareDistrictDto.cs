namespace ChurchRegister.ApiService.Models.PastoralCare;

/// <summary>
/// Data transfer object for a district section in the pastoral care report
/// </summary>
public class PastoralCareDistrictDto
{
    /// <summary>
    /// District name (e.g., "District A", "Unassigned District")
    /// </summary>
    public string DistrictName { get; set; } = string.Empty;

    /// <summary>
    /// Full name of the deacon assigned to this district (null if no deacon assigned)
    /// </summary>
    public string? DeaconName { get; set; }

    /// <summary>
    /// Members in this district requiring pastoral care
    /// </summary>
    public PastoralCareMemberDto[] Members { get; set; } = Array.Empty<PastoralCareMemberDto>();
}
