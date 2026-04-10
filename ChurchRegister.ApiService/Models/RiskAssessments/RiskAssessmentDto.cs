namespace ChurchRegister.ApiService.Models.RiskAssessments;

public class RiskAssessmentDto
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string CategoryDescription { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int ReviewInterval { get; set; }
    public DateTime? LastReviewDate { get; set; }
    public DateTime NextReviewDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Scope { get; set; }
    public string? Notes { get; set; }
    public int ApprovalCount { get; set; }
    public int MinimumApprovalsRequired { get; set; }

    // Calculated fields
    public bool IsOverdue { get; set; }
    public string AlertStatus { get; set; } = string.Empty;

    // Audit fields
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedDateTime { get; set; }
    public string? ModifiedBy { get; set; }
    public DateTime? ModifiedDateTime { get; set; }
}
