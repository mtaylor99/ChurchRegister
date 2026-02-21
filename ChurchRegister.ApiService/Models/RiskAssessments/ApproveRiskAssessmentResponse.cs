namespace ChurchRegister.ApiService.Models.RiskAssessments;

public class ApproveRiskAssessmentResponse
{
    public bool ApprovalRecorded { get; set; }
    public int TotalApprovalsReceived { get; set; }
    public int MinimumApprovalsRequired { get; set; }
    public bool AssessmentApproved { get; set; }
    public DateTime? NextReviewDate { get; set; }
}
