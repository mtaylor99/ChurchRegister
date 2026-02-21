using System.ComponentModel.DataAnnotations;

namespace ChurchRegister.ApiService.Models.Attendance;

public record GetEventsResponse
{
    public int Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public bool IsActive { get; init; }
    public bool ShowInAnalysis { get; init; }
    public int? DayOfWeek { get; init; }
    public DateTime CreatedAt { get; init; }
    public string CreatedBy { get; init; } = string.Empty;
    public DateTime? LastModifiedAt { get; init; }
    public string? LastModifiedBy { get; init; }
}

public record CreateEventRequest
{
    [Required]
    [StringLength(100, MinimumLength = 1, ErrorMessage = "Event name must be between 1 and 100 characters")]
    public string Name { get; init; } = string.Empty;
    
    [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
    public string? Description { get; init; }
    
    public bool IsActive { get; init; } = true;
    
    public bool ShowInAnalysis { get; init; } = true;
    
    [Range(0, 6, ErrorMessage = "DayOfWeek must be between 0 (Sunday) and 6 (Saturday)")]
    public int? DayOfWeek { get; init; }
}

public record UpdateEventRequest
{
    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "ID must be a positive number")]
    public int Id { get; init; }
    
    [Required]
    [StringLength(100, MinimumLength = 1, ErrorMessage = "Event name must be between 1 and 100 characters")]
    public string Name { get; init; } = string.Empty;
    
    [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
    public string? Description { get; init; }
    
    public bool IsActive { get; init; }
    
    public bool ShowInAnalysis { get; init; }
    
    [Range(0, 6, ErrorMessage = "DayOfWeek must be between 0 (Sunday) and 6 (Saturday)")]
    public int? DayOfWeek { get; init; }
}