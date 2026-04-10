namespace ChurchRegister.ApiService.Models.Dashboard;

/// <summary>
/// Dashboard statistics response model
/// </summary>
public record DashboardStatisticsResponse
{
    /// <summary>
    /// Total number of active church members
    /// </summary>
    public int TotalMembers { get; init; }

    /// <summary>
    /// Number of new members in the last 30 days
    /// </summary>
    public int NewMembersThisMonth { get; init; }

    /// <summary>
    /// Number of new members in the last 7 days
    /// </summary>
    public int NewMembersThisWeek { get; init; }

    /// <summary>
    /// Percentage change in members compared to last month
    /// </summary>
    public decimal MemberGrowthPercentage { get; init; }

    /// <summary>
    /// Average attendance for Sunday Morning Service (last 4 weeks)
    /// </summary>
    public decimal SundayMorningAverage { get; init; }

    /// <summary>
    /// Percentage change in Sunday Morning attendance vs previous 4 weeks
    /// </summary>
    public decimal SundayMorningChangePercentage { get; init; }

    /// <summary>
    /// Average attendance for Sunday Evening Service (last 4 weeks)
    /// </summary>
    public decimal SundayEveningAverage { get; init; }

    /// <summary>
    /// Percentage change in Sunday Evening attendance vs previous 4 weeks
    /// </summary>
    public decimal SundayEveningChangePercentage { get; init; }

    /// <summary>
    /// Average attendance for Bible Study (last 4 weeks)
    /// </summary>
    public decimal BibleStudyAverage { get; init; }

    /// <summary>
    /// Percentage change in Bible Study attendance vs previous 4 weeks
    /// </summary>
    public decimal BibleStudyChangePercentage { get; init; }

    /// <summary>
    /// Grouped training certificate alerts (5+ members with same type and expiry)
    /// </summary>
    public IEnumerable<TrainingCertificateGroupSummary> TrainingAlerts { get; init; } = new List<TrainingCertificateGroupSummary>();
}

/// <summary>
/// Training certificate group summary for dashboard alerts
/// </summary>
public record TrainingCertificateGroupSummary
{
    /// <summary>
    /// Training type name
    /// </summary>
    public string TrainingType { get; init; } = string.Empty;

    /// <summary>
    /// Number of members in this group
    /// </summary>
    public int MemberCount { get; init; }

    /// <summary>
    /// Expiry date (null for pending items)
    /// </summary>
    public DateTime? ExpiryDate { get; init; }

    /// <summary>
    /// Status (for pending items)
    /// </summary>
    public string? Status { get; init; }

    /// <summary>
    /// Alert message
    /// </summary>
    public string Message { get; init; } = string.Empty;
}
