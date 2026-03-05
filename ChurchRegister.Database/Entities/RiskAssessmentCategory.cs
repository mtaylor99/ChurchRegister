using ChurchRegister.Database.Interfaces;
using System.ComponentModel.DataAnnotations;

namespace ChurchRegister.Database.Entities;

public class RiskAssessmentCategory : IAuditableEntity
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;
    
    // Navigation properties
    public ICollection<RiskAssessment> RiskAssessments { get; set; } = new List<RiskAssessment>();
    
    // Audit Fields
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedDateTime { get; set; }
    public string? ModifiedBy { get; set; }
    public DateTime? ModifiedDateTime { get; set; }
}
