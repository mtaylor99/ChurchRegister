using ChurchRegister.Database.Interfaces;
using System.ComponentModel.DataAnnotations;

namespace ChurchRegister.Database.Entities;

public class ChurchMember : IAuditableEntity
{
    public int Id { get; set; }
    
    [MaxLength(20)]
    public string? Title { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string FirstName { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(50)]
    public string LastName { get; set; } = string.Empty;
    
    [MaxLength(20)]
    public string? PhoneNumber { get; set; }
    
    [MaxLength(100)]
    public string? EmailAddress { get; set; }
    
    [MaxLength(100)]
    public string? BankReference { get; set; }
    
    // Foreign Keys
    public int? AddressId { get; set; }
    public int? ChurchMemberStatusId { get; set; }
    public int? DistrictId { get; set; }
    public int? DataProtectionId { get; set; }
    
    public DateTime? MemberSince { get; set; }
    public bool Baptised { get; set; }
    public bool GiftAid { get; set; }
    public bool PastoralCareRequired { get; set; } = false;
    
    // Navigation Properties
    public virtual Address? Address { get; set; }
    public virtual ChurchMemberStatus? ChurchMemberStatus { get; set; }
    public virtual Districts? District { get; set; }
    public virtual ChurchMemberDataProtection? DataProtection { get; set; }
    
    // Collections
    public virtual ICollection<ChurchMemberRegisterNumber> RegisterNumbers { get; set; } = new List<ChurchMemberRegisterNumber>();
    public virtual ICollection<ChurchMemberContributions> Contributions { get; set; } = new List<ChurchMemberContributions>();
    public virtual ICollection<ChurchMemberRoles> Roles { get; set; } = new List<ChurchMemberRoles>();
    public virtual ICollection<ChurchMemberTrainingCertificates> TrainingCertificates { get; set; } = new List<ChurchMemberTrainingCertificates>();
    
    // Audit properties
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedDateTime { get; set; }
    public string? ModifiedBy { get; set; }
    public DateTime? ModifiedDateTime { get; set; }
}
