namespace ChurchRegister.ApiService.Models.Security;

/// <summary>
/// Standardized error response structure returned from API endpoints.
/// </summary>
public class ErrorResponse
{
    /// <summary>
    /// The main error message describing what went wrong.
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// List of detailed validation errors or additional error information.
    /// </summary>
    public List<string> Errors { get; set; } = new List<string>();

    /// <summary>
    /// Correlation ID for tracing the request through logs.
    /// </summary>
    public string? CorrelationId { get; set; }
}