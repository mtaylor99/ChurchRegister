using System.ComponentModel.DataAnnotations;

namespace ChurchRegister.ApiService.Models.Administration;

public record GetAttendanceResponse
{
    public int Id { get; init; }
    public int EventId { get; init; }
    public string EventName { get; init; } = string.Empty;
    public DateTime Date { get; init; }
    public int Attendance { get; init; }
    public string CreatedBy { get; init; } = string.Empty;
    public DateTime CreatedDateTime { get; init; }
    public string? ModifiedBy { get; init; }
    public DateTime? ModifiedDateTime { get; init; }
}

public record CreateAttendanceRequest
{
    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "Event ID must be a positive number")]
    public int EventId { get; init; }
    
    [Required]
    public DateTime Date { get; init; }
    
    [Required]
    [Range(0, int.MaxValue, ErrorMessage = "Attendance must be zero or positive")]
    public int Attendance { get; init; }
}

public record UpdateAttendanceRequest
{
    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "ID must be a positive number")]
    public int Id { get; init; }
    
    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "Event ID must be a positive number")]
    public int EventId { get; init; }
    
    [Required]
    public DateTime Date { get; init; }
    
    [Required]
    [Range(0, int.MaxValue, ErrorMessage = "Attendance must be zero or positive")]
    public int Attendance { get; init; }
}

public record AttendanceAnalyticsResponse
{
    public int EventId { get; init; }
    public string EventName { get; init; } = string.Empty;
    public List<AttendanceDataPoint> DataPoints { get; init; } = new();
    public AttendanceStatistics Statistics { get; init; } = new();
}

public record AttendanceDataPoint
{
    public DateTime Date { get; init; }
    public int Attendance { get; init; }
    public string MonthYear { get; init; } = string.Empty;
}

public record AttendanceStatistics
{
    public double Average { get; init; }
    public int Maximum { get; init; }
    public int Minimum { get; init; }
    public double TrendPercentage { get; init; }
    public string TrendDirection { get; init; } = string.Empty; // "up", "down", "stable"
    public int TotalRecords { get; init; }
}