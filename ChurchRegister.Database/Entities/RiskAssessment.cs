using ChurchRegister.Database.Interfaces;
using System.ComponentModel.DataAnnotations;

namespace ChurchRegister.Database.Entities;

public class RiskAssessment : IAuditableEntity
{
    public int Id { get; set; }
    
    public int CategoryId { get; set; }
    
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;
    
    [MaxLength(1000)]
    public string? Description { get; set; }
    
    public int ReviewInterval { get; set; }
    
    public DateTime? LastReviewDate { get; set; }
    
    public DateTime NextReviewDate { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = string.Empty;
    
    [MaxLength(500)]
    public string? Scope { get; set; }
    
    public string? Notes { get; set; }
    
    // Navigation properties
    public RiskAssessmentCategory Category { get; set; } = null!;
    public ICollection<RiskAssessmentApproval> Approvals { get; set; } = new List<RiskAssessmentApproval>();
    
    // Audit Fields
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedDateTime { get; set; }
    public string? ModifiedBy { get; set; }
    public DateTime? ModifiedDateTime { get; set; }
}
