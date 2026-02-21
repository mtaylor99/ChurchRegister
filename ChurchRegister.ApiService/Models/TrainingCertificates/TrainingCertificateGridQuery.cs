using System.ComponentModel.DataAnnotations;

namespace ChurchRegister.ApiService.Models.TrainingCertificates;

/// <summary>
/// Query parameters for training certificate grid filtering and pagination
/// </summary>
public class TrainingCertificateGridQuery
{
    /// <summary>
    /// Page number (1-based)
    /// </summary>
    [Range(1, int.MaxValue, ErrorMessage = "Page must be 1 or greater")]
    public int Page { get; set; } = 1;

    /// <summary>
    /// Number of items per page
    /// </summary>
    [Range(1, 100, ErrorMessage = "PageSize must be between 1 and 100")]
    public int PageSize { get; set; } = 25;

    /// <summary>
    /// Search term for filtering by member name
    /// </summary>
    public string? Name { get; set; }

    /// <summary>
    /// Filter by certificate status
    /// </summary>
    public string? Status { get; set; }

    /// <summary>
    /// Filter by training certificate type ID
    /// </summary>
    public int? TypeId { get; set; }

    /// <summary>
    /// Filter items expiring within specified days (default 60)
    /// </summary>
    public int ExpiringWithinDays { get; set; } = 60;

    /// <summary>
    /// Field to sort by
    /// </summary>
    public string SortBy { get; set; } = "Expires";

    /// <summary>
    /// Sort direction (asc or desc)
    /// </summary>
    public string SortDirection { get; set; } = "asc";
}
