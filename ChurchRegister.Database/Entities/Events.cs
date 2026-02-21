using ChurchRegister.Database.Interfaces;
using System.ComponentModel.DataAnnotations;

namespace ChurchRegister.Database.Entities;

public class Events : IAuditableEntity
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [MaxLength(500)]
    public string? Description { get; set; }
    
    public bool IsActive { get; set; } = true;
    
    public bool ShowInAnalysis { get; set; } = true;
    
    /// <summary>
    /// Day of week when this event typically occurs (0=Sunday, 6=Saturday).
    /// Null indicates no specific day restriction.
    /// </summary>
    [Range(0, 6)]
    public int? DayOfWeek { get; set; }
    
    // Navigation property
    public virtual ICollection<EventAttendance> EventAttendances { get; set; } = new List<EventAttendance>();
    
    // Audit properties
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedDateTime { get; set; }
    public string? ModifiedBy { get; set; }
    public DateTime? ModifiedDateTime { get; set; }
}
