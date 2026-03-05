using System.ComponentModel.DataAnnotations;

namespace ChurchRegister.Database.Entities;

public class HSBCExcludedReference
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Reference { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Notes { get; set; }

    // Create-only audit fields (not IAuditableEntity — exclusions are never updated)
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedDateTime { get; set; }
}
