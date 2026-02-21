using ChurchRegister.Database.Interfaces;
using System.ComponentModel.DataAnnotations;

namespace ChurchRegister.Database.Entities;

public class Districts : IAuditableEntity
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(10)]
    public string Name { get; set; } = string.Empty;
    
    // Foreign Keys
    public int? DeaconId { get; set; }
    public int? DistrictOfficerId { get; set; }
    
    // Navigation properties
    public virtual ChurchMember? Deacon { get; set; }
    public virtual ChurchMember? DistrictOfficer { get; set; }
    public virtual ICollection<ChurchMember> ChurchMembers { get; set; } = new List<ChurchMember>();
    
    // Audit properties
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedDateTime { get; set; }
    public string? ModifiedBy { get; set; }
    public DateTime? ModifiedDateTime { get; set; }
}
