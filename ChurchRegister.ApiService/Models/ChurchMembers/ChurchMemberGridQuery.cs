using System.ComponentModel.DataAnnotations;

namespace ChurchRegister.ApiService.Models.ChurchMembers;

/// <summary>
/// Query parameters for church member grid filtering and pagination
/// </summary>
public class ChurchMemberGridQuery
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
    /// Search term for filtering by name, email, or phone
    /// </summary>
    public string? SearchTerm { get; set; }

    /// <summary>
    /// Filter by status ID
    /// </summary>
    public int? StatusFilter { get; set; }

    /// <summary>
    /// Filter by role type ID
    /// </summary>
    public int? RoleFilter { get; set; }

    /// <summary>
    /// Filter by district ID (null for unassigned)
    /// </summary>
    public int? DistrictFilter { get; set; }

    /// <summary>
    /// Filter by unassigned district (no district assigned)
    /// </summary>
    public bool? UnassignedDistrictFilter { get; set; }

    /// <summary>
    /// Filter by baptised status
    /// </summary>
    public bool? BaptisedFilter { get; set; }

    /// <summary>
    /// Filter by GiftAid participation
    /// </summary>
    public bool? GiftAidFilter { get; set; }

    /// <summary>
    /// Filter by pastoral care required status (null = show all, true = show only requiring care, false = show only not requiring care)
    /// </summary>
    public bool? PastoralCareRequired { get; set; }

    /// <summary>
    /// Optional year filter for contribution calculations (defaults to current year if not specified)
    /// </summary>
    public int? Year { get; set; }

    /// <summary>
    /// Field to sort by
    /// </summary>
    public string SortBy { get; set; } = "FirstName";

    /// <summary>
    /// Sort direction (asc or desc)
    /// </summary>
    public string SortDirection { get; set; } = "asc";

    /// <summary>
    /// Calculate skip count for pagination
    /// </summary>
    public int Skip => (Page - 1) * PageSize;

    /// <summary>
    /// Normalize search term for case-insensitive search
    /// </summary>
    public string? NormalizedSearchTerm =>
        string.IsNullOrWhiteSpace(SearchTerm) ? null : SearchTerm.Trim().ToLower();

    /// <summary>
    /// Whether sort direction is descending
    /// </summary>
    public bool IsDescending =>
        SortDirection.Equals("desc", StringComparison.OrdinalIgnoreCase);
}
