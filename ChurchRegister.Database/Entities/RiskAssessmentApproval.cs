using System.ComponentModel.DataAnnotations;

namespace ChurchRegister.Database.Entities;

public class RiskAssessmentApproval
{
    public int Id { get; set; }
    
    public int RiskAssessmentId { get; set; }
    
    [Required]
    public int ApprovedByChurchMemberId { get; set; }
    
    public DateTime ApprovedDate { get; set; }
    
    [MaxLength(500)]
    public string? Notes { get; set; }
    
    // Navigation properties
    public RiskAssessment RiskAssessment { get; set; } = null!;
    public ChurchMember ApprovedByChurchMember { get; set; } = null!;
}
