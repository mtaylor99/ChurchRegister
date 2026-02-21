namespace ChurchRegister.ApiService.Models.PastoralCare;

/// <summary>
/// Data transfer object for pastoral care report
/// </summary>
public class PastoralCareReportDto
{
    /// <summary>
    /// Districts with members requiring pastoral care
    /// </summary>
    public PastoralCareDistrictDto[] Districts { get; set; } = Array.Empty<PastoralCareDistrictDto>();

    /// <summary>
    /// Total number of members requiring pastoral care
    /// </summary>
    public int TotalMembers { get; set; }

    /// <summary>
    /// Date when the report was generated
    /// </summary>
    public DateTime GeneratedDate { get; set; }
}
