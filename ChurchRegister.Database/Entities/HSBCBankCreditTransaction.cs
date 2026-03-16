using ChurchRegister.Database.Interfaces;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChurchRegister.Database.Entities;

public class HSBCBankCreditTransaction : IAuditableEntity
{
    public int Id { get; set; }
    
    public DateTime Date { get; set; }
    
    [MaxLength(500)]
    public string? Description { get; set; }
    
    [MaxLength(100)]
    public string? Reference { get; set; }
    
    [Column(TypeName = "decimal(10,2)")]
    public decimal MoneyIn { get; set; }
    
    public bool IsProcessed { get; set; }
    
    public bool Deleted { get; set; }
    
    // Navigation properties
    public virtual ICollection<ChurchMemberContributions> Contributions { get; set; } = new List<ChurchMemberContributions>();
    
    // Audit properties
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedDateTime { get; set; }
    public string? ModifiedBy { get; set; }
    public DateTime? ModifiedDateTime { get; set; }
}
