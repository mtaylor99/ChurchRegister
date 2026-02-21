using ChurchRegister.Database.Interfaces;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChurchRegister.Database.Entities;

public class ChurchMemberContributions : IAuditableEntity
{
    public int Id { get; set; }
    
    public int ChurchMemberId { get; set; }
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }
    
    public DateTime Date { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string TransactionRef { get; set; } = string.Empty;
    
    [MaxLength(500)]
    public string? Description { get; set; }
    
    public int ContributionTypeId { get; set; }
    
    public int? HSBCBankCreditTransactionId { get; set; }
    
    public int? EnvelopeContributionBatchId { get; set; }
    
    public bool Deleted { get; set; }
    
    public bool ManualContribution { get; set; }
    
    // Navigation Properties
    public virtual ChurchMember ChurchMember { get; set; } = null!;
    public virtual ContributionType ContributionType { get; set; } = null!;
    public virtual HSBCBankCreditTransaction? HSBCBankCreditTransaction { get; set; }
    public virtual EnvelopeContributionBatch? EnvelopeContributionBatch { get; set; }
    
    // Audit properties
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedDateTime { get; set; }
    public string? ModifiedBy { get; set; }
    public DateTime? ModifiedDateTime { get; set; }
}
