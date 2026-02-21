namespace ChurchRegister.ApiService.Models;

/// <summary>
/// Represents a paginated result set
/// </summary>
/// <typeparam name="T">Type of items in the result</typeparam>
public class PagedResult<T>
    {
        /// <summary>
        /// Items in the current page
        /// </summary>
        public IEnumerable<T> Items { get; set; } = Enumerable.Empty<T>();

        /// <summary>
        /// Current page number (1-based)
        /// </summary>
        public int CurrentPage { get; set; }

        /// <summary>
        /// Number of items per page
        /// </summary>
        public int PageSize { get; set; }

        /// <summary>
        /// Total number of items across all pages
        /// </summary>
        public int TotalCount { get; set; }

        /// <summary>
        /// Total number of pages
        /// </summary>
        public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);

        /// <summary>
        /// Whether there is a previous page
        /// </summary>
        public bool HasPreviousPage => CurrentPage > 1;

        /// <summary>
        /// Whether there is a next page
        /// </summary>
        public bool HasNextPage => CurrentPage < TotalPages;

        /// <summary>
        /// Number of items in the current page
        /// </summary>
        public int CurrentPageCount => Items?.Count() ?? 0;

        /// <summary>
        /// Starting item number for the current page
        /// </summary>
        public int StartItem => TotalCount == 0 ? 0 : ((CurrentPage - 1) * PageSize) + 1;

        /// <summary>
        /// Ending item number for the current page
        /// </summary>
        public int EndItem => Math.Min(StartItem + PageSize - 1, TotalCount);

        /// <summary>
        /// Create a new paged result
        /// </summary>
        /// <param name="items">Items for this page</param>
        /// <param name="totalCount">Total count of all items</param>
        /// <param name="currentPage">Current page number</param>
        /// <param name="pageSize">Items per page</param>
        /// <returns>Paged result instance</returns>
        public static PagedResult<T> Create(IEnumerable<T> items, int totalCount, int currentPage, int pageSize)
        {
            return new PagedResult<T>
        {
            Items = items,
            TotalCount = totalCount,
            CurrentPage = currentPage,
            PageSize = pageSize
        };
    }
}