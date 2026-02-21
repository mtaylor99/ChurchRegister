using ChurchRegister.Database.Interfaces;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChurchRegister.Database.Entities;

public class EventAttendance : IAuditableEntity
{
    public int Id { get; set; }
    
    [Required]
    public int EventId { get; set; }
    
    [Required]
    public DateTime Date { get; set; }
    
    [Required]
    [Range(0, int.MaxValue)]
    public int Attendance { get; set; }
    
    // Navigation property
    [ForeignKey("EventId")]
    public virtual Events Event { get; set; } = null!;
    
    // Audit properties
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedDateTime { get; set; }
    public string? ModifiedBy { get; set; }
    public DateTime? ModifiedDateTime { get; set; }
}