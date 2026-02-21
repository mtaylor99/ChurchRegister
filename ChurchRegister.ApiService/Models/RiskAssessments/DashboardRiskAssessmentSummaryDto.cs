namespace ChurchRegister.ApiService.Models.RiskAssessments;

public class DashboardRiskAssessmentSummaryDto
{
    public int OverdueCount { get; set; }
    public int DueSoonCount { get; set; }
    public int TotalCount { get; set; }
}
