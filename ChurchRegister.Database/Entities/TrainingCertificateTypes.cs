using ChurchRegister.Database.Interfaces;
using System.ComponentModel.DataAnnotations;

namespace ChurchRegister.Database.Entities;

public class TrainingCertificateTypes : IAuditableEntity
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string Type { get; set; } = string.Empty;
    
    [MaxLength(500)]
    public string? Description { get; set; }
    
    [Required]
    [MaxLength(10)]
    public string Status { get; set; } = "Active";
    
    // Navigation property
    public virtual ICollection<ChurchMemberTrainingCertificates> ChurchMemberTrainingCertificates { get; set; } = new List<ChurchMemberTrainingCertificates>();
    
    // Audit properties
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedDateTime { get; set; }
    public string? ModifiedBy { get; set; }
    public DateTime? ModifiedDateTime { get; set; }
}
