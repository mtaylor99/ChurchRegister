using System.ComponentModel.DataAnnotations;

namespace ChurchRegister.ApiService.Models.RiskAssessments;

public class ApproveRiskAssessmentRequest
{
    /// <summary>
    /// List of deacon church member IDs who approved this risk assessment in the meeting
    /// </summary>
    [Required]
    [MinLength(2, ErrorMessage = "At least 2 deacons must be selected")]
    public List<int> DeaconMemberIds { get; set; } = new();

    /// <summary>
    /// Notes from the approval meeting
    /// </summary>
    [MaxLength(500)]
    public string? Notes { get; set; }
}
