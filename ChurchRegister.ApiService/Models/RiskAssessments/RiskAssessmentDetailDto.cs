namespace ChurchRegister.ApiService.Models.RiskAssessments;

public class RiskAssessmentDetailDto : RiskAssessmentDto
{
    public List<RiskAssessmentApprovalDto> Approvals { get; set; } = new();
}
