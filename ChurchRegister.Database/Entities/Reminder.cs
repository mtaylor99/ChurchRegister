using ChurchRegister.Database.Interfaces;
using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace ChurchRegister.Database.Entities;

public class Reminder : IAuditableEntity
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;
    
    [Required]
    public DateTime DueDate { get; set; }
    
    public string? AssignedToUserId { get; set; }
    
    public bool? Priority { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Pending";
    
    public string? CompletionNotes { get; set; }
    
    public string? CompletedBy { get; set; }
    
    public DateTime? CompletedDateTime { get; set; }
    
    public int? CategoryId { get; set; }
    
    // Navigation Properties
    public virtual ReminderCategory? Category { get; set; }
    
    // Audit Fields
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedDateTime { get; set; }
    public string? ModifiedBy { get; set; }
    public DateTime? ModifiedDateTime { get; set; }
}
