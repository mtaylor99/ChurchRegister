using ChurchRegister.Database.Interfaces;

namespace ChurchRegister.Database.Entities;

public class ChurchMemberDataProtection : IAuditableEntity
{
    public int Id { get; set; }
    
    public int ChurchMemberId { get; set; }
    
    public bool AllowPhotographs { get; set; }
    
    public bool AllowNewsletter { get; set; }
    
    // Navigation Properties
    public virtual ChurchMember ChurchMember { get; set; } = null!;
    
    // Audit properties
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedDateTime { get; set; }
    public string? ModifiedBy { get; set; }
    public DateTime? ModifiedDateTime { get; set; }
}
