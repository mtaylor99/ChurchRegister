using System.ComponentModel.DataAnnotations;

namespace ChurchRegister.ApiService.Models.Attendance;

public record GetAttendanceResponse
{
    public int Id { get; init; }
    public int EventId { get; init; }
    public string EventName { get; init; } = string.Empty;
    public DateTime Date { get; init; }
    public int Attendance { get; init; }
    public string CreatedBy { get; init; } = string.Empty;
    public string RecordedByName { get; init; } = string.Empty;
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

public record GetAttendanceAnalyticsRequest
{
    public int EventId { get; init; }
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
/// <summary>
/// Response for attendance template upload operation.
/// </summary>
public record UploadAttendanceTemplateResponse
{
    /// <summary>
    /// Indicates whether the upload was successful.
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Summary statistics for the upload operation.
    /// </summary>
    public UploadSummary Summary { get; set; } = new();

    /// <summary>
    /// List of errors encountered during processing.
    /// </summary>
    public List<UploadError> Errors { get; set; } = new();

    /// <summary>
    /// Warning messages (e.g., unrecognized columns).
    /// </summary>
    public List<string> Warnings { get; set; } = new();
}

/// <summary>
/// Summary statistics for attendance template upload.
/// </summary>
public record UploadSummary
{
    /// <summary>
    /// Total number of data rows processed from template.
    /// </summary>
    public int TotalRows { get; set; }

    /// <summary>
    /// Number of new attendance records created.
    /// </summary>
    public int RecordsCreated { get; set; }

    /// <summary>
    /// Number of existing attendance records updated.
    /// </summary>
    public int RecordsUpdated { get; set; }

    /// <summary>
    /// Number of records skipped (no changes detected).
    /// </summary>
    public int RecordsSkipped { get; set; }

    /// <summary>
    /// Number of records that failed to process.
    /// </summary>
    public int RecordsFailed { get; set; }
}

/// <summary>
/// Details of an error encountered during upload processing.
/// </summary>
public record UploadError
{
    /// <summary>
    /// Row number in the Excel file (1-based).
    /// </summary>
    public int Row { get; set; }

    /// <summary>
    /// Event name associated with the error (if applicable).
    /// </summary>
    public string? Event { get; set; }

    /// <summary>
    /// Date value associated with the error (if applicable).
    /// </summary>
    public string? Date { get; set; }

    /// <summary>
    /// Error message describing what went wrong.
    /// </summary>
    public string Message { get; set; } = string.Empty;
}
