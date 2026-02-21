using ChurchRegister.Database.Interfaces;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChurchRegister.Database.Entities;

public class ContributionType : IAuditableEntity
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string Type { get; set; } = string.Empty;
    
    // Navigation property
    public virtual ICollection<ChurchMemberContributions> ChurchMemberContributions { get; set; } = new List<ChurchMemberContributions>();
    
    // Audit properties
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedDateTime { get; set; }
    public string? ModifiedBy { get; set; }
    public DateTime? ModifiedDateTime { get; set; }
}

// EnvelopeContributionBatch entity (TASK-001, TASK-002)
public class EnvelopeContributionBatch : IAuditableEntity
{
    public int Id { get; set; }
    
    [Required]
    public DateOnly BatchDate { get; set; }
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalAmount { get; set; }
    
    public int EnvelopeCount { get; set; }
    
    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "Submitted";
    
    // Navigation Properties
    public virtual ICollection<ChurchMemberContributions> ChurchMemberContributions { get; set; } = new List<ChurchMemberContributions>();
    
    // Audit properties
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedDateTime { get; set; }
    public string? ModifiedBy { get; set; }
    public DateTime? ModifiedDateTime { get; set; }
}

// ChurchMemberTrainingCertificates entity (TASK-014)
public class ChurchMemberTrainingCertificates : IAuditableEntity
{
    public int Id { get; set; }
    
    public int ChurchMemberId { get; set; }
    
    [MaxLength(30)]
    public string Status { get; set; } = string.Empty;
    
    public DateTime? Expires { get; set; }
    
    public int TrainingCertificateTypeId { get; set; }
    
    [MaxLength(500)]
    public string? Notes { get; set; }
    
    // Navigation Properties
    public virtual ChurchMember ChurchMember { get; set; } = null!;
    public virtual TrainingCertificateTypes TrainingCertificateType { get; set; } = null!;
    
    // Audit properties
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedDateTime { get; set; }
    public string? ModifiedBy { get; set; }
    public DateTime? ModifiedDateTime { get; set; }
}
