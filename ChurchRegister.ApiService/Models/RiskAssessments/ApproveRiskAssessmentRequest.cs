using System.ComponentModel.DataAnnotations;

namespace ChurchRegister.ApiService.Models.RiskAssessments;

public class ApproveRiskAssessmentRequest
{
    /// <summary>
    /// List of deacon church member IDs who approved this risk assessment in the meeting
    /// </summary>
    [Required]
    [MinLength(1, ErrorMessage = "At least 1 deacon must be selected")]
    public List<int> DeaconMemberIds { get; set; } = new();

    /// <summary>
    /// Date the approval was given; defaults to today when omitted
    /// </summary>
    public DateTime? ApprovalDate { get; set; }

    /// <summary>
    /// Notes from the approval meeting
    /// </summary>
    [MaxLength(500)]
    public string? Notes { get; set; }
}
