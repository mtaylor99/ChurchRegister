namespace ChurchRegister.ApiService.Models.RiskAssessments;

public class RiskAssessmentApprovalDto
{
    public int Id { get; set; }
    public int RiskAssessmentId { get; set; }
    public int ApprovedByChurchMemberId { get; set; }
    public string ApprovedByMemberName { get; set; } = string.Empty;
    public DateTime ApprovedDate { get; set; }
    public string? Notes { get; set; }
}
