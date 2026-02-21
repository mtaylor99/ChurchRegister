using ChurchRegister.Database.Enums;
using System.ComponentModel.DataAnnotations;

namespace ChurchRegister.ApiService.Models.Security;

/// <summary>
/// Query parameters for user grid filtering and pagination
/// </summary>
public class UserGridQuery
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
        /// Search term for filtering by name or email
        /// </summary>
        public string? SearchTerm { get; set; }

        /// <summary>
        /// Filter by account status
        /// </summary>
        public UserAccountStatus? StatusFilter { get; set; }

        /// <summary>
        /// Filter by role
        /// </summary>
        public string? RoleFilter { get; set; }

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