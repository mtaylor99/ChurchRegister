namespace ChurchRegister.ApiService.Models.Administration;

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
}
