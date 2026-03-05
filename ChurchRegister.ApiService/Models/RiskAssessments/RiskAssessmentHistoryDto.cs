namespace ChurchRegister.ApiService.Models.RiskAssessments;

public class RiskAssessmentHistoryDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public List<ReviewCycleDto> ReviewCycles { get; set; } = new();
}

public class ReviewCycleDto
{
    public DateTime? ReviewDate { get; set; }
    public List<RiskAssessmentApprovalDto> Approvals { get; set; } = new();
}
