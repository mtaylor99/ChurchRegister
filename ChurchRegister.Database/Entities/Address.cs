using ChurchRegister.Database.Interfaces;
using System.ComponentModel.DataAnnotations;

namespace ChurchRegister.Database.Entities;

public class Address : IAuditableEntity
{
    public int Id { get; set; }
    
    [MaxLength(50)]
    public string? NameNumber { get; set; }
    
    [MaxLength(100)]
    public string? AddressLineOne { get; set; }
    
    [MaxLength(100)]
    public string? AddressLineTwo { get; set; }
    
    [MaxLength(50)]
    public string? Town { get; set; }
    
    [MaxLength(50)]
    public string? County { get; set; }
    
    [MaxLength(20)]
    public string? Postcode { get; set; }
    
    // Navigation property
    public virtual ICollection<ChurchMember> ChurchMembers { get; set; } = new List<ChurchMember>();
    
    // Audit properties
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedDateTime { get; set; }
    public string? ModifiedBy { get; set; }
    public DateTime? ModifiedDateTime { get; set; }
}
