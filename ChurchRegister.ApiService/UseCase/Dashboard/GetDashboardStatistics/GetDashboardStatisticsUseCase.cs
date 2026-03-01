using ChurchRegister.ApiService.Models.Dashboard;
using ChurchRegister.ApiService.Services.TrainingCertificates;
using ChurchRegister.Database.Data;
using Microsoft.EntityFrameworkCore;

namespace ChurchRegister.ApiService.UseCase.Dashboard.GetDashboardStatistics;

public class GetDashboardStatisticsUseCase : IGetDashboardStatisticsUseCase
{
    private readonly ChurchRegisterWebContext _context;
    private readonly ITrainingCertificateService _trainingCertificateService;
    private readonly ILogger<GetDashboardStatisticsUseCase> _logger;

    public GetDashboardStatisticsUseCase(
        ChurchRegisterWebContext context,
        ITrainingCertificateService trainingCertificateService,
        ILogger<GetDashboardStatisticsUseCase> logger)
    {
        _context = context;
        _trainingCertificateService = trainingCertificateService;
        _logger = logger;
    }

    public async Task<DashboardStatisticsResponse> ExecuteAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Retrieving dashboard statistics");

        var now = DateTime.UtcNow;
        var thirtyDaysAgo = now.AddDays(-30);
        var sevenDaysAgo = now.AddDays(-7);
        var sixtyDaysAgo = now.AddDays(-60);
        var twentyEightDaysAgo = now.AddDays(-28); // Last 4 weeks
        var fiftySevenDaysAgo = now.AddDays(-57); // Previous 4 weeks (for comparison)

        // Get total active members (assuming status ID 1 is "Active")
        var totalMembers = await _context.ChurchMembers
            .AsNoTracking()
            .Where(m => m.ChurchMemberStatusId == 1)
            .CountAsync(cancellationToken);

        // Get new members in last 30 days
        var newMembersThisMonth = await _context.ChurchMembers
            .AsNoTracking()
            .Where(m => m.MemberSince >= thirtyDaysAgo && m.MemberSince <= now)
            .CountAsync(cancellationToken);

        // Get new members in last 7 days
        var newMembersThisWeek = await _context.ChurchMembers
            .AsNoTracking()
            .Where(m => m.MemberSince >= sevenDaysAgo && m.MemberSince <= now)
            .CountAsync(cancellationToken);

        // Calculate growth percentage (comparing last 30 days to previous 30 days)
        var newMembersPreviousMonth = await _context.ChurchMembers
            .AsNoTracking()
            .Where(m => m.MemberSince >= sixtyDaysAgo && m.MemberSince < thirtyDaysAgo)
            .CountAsync(cancellationToken);

        decimal growthPercentage = 0;
        if (newMembersPreviousMonth > 0)
        {
            growthPercentage = ((decimal)(newMembersThisMonth - newMembersPreviousMonth) / newMembersPreviousMonth) * 100;
        }
        else if (newMembersThisMonth > 0)
        {
            growthPercentage = 100; // 100% growth if there were no members last month but there are this month
        }

        // Calculate attendance statistics for each service type
        // Sunday Morning Service (Event ID = 1)
        var (sundayMorningAvg, sundayMorningChange) = await CalculateAttendanceStats(1, twentyEightDaysAgo, fiftySevenDaysAgo, now, cancellationToken);

        // Sunday Evening Service (Event ID = 2)
        var (sundayEveningAvg, sundayEveningChange) = await CalculateAttendanceStats(2, twentyEightDaysAgo, fiftySevenDaysAgo, now, cancellationToken);

        // Bible Study (Event ID = 4)
        var (bibleStudyAvg, bibleStudyChange) = await CalculateAttendanceStats(4, twentyEightDaysAgo, fiftySevenDaysAgo, now, cancellationToken);

        // Get training certificate alerts (grouped summaries with 5+ members)
        var trainingAlerts = await _trainingCertificateService.GetDashboardTrainingSummaryAsync(cancellationToken);
        var trainingAlertsSummary = trainingAlerts.Select(t => new TrainingCertificateGroupSummary
        {
            TrainingType = t.TrainingType,
            MemberCount = t.MemberCount,
            ExpiryDate = t.ExpiryDate,
            Status = t.Status,
            Message = t.Message
        });

        var response = new DashboardStatisticsResponse
        {
            TotalMembers = totalMembers,
            NewMembersThisMonth = newMembersThisMonth,
            NewMembersThisWeek = newMembersThisWeek,
            MemberGrowthPercentage = Math.Round(growthPercentage, 1),
            SundayMorningAverage = sundayMorningAvg,
            SundayMorningChangePercentage = sundayMorningChange,
            SundayEveningAverage = sundayEveningAvg,
            SundayEveningChangePercentage = sundayEveningChange,
            BibleStudyAverage = bibleStudyAvg,
            BibleStudyChangePercentage = bibleStudyChange,
            TrainingAlerts = trainingAlertsSummary
        };

        _logger.LogInformation("Dashboard statistics retrieved successfully: {TotalMembers} total members", response.TotalMembers);

        return response;
    }

    private async Task<(decimal average, decimal changePercentage)> CalculateAttendanceStats(
        int eventId,
        DateTime last4WeeksStart,
        DateTime previous4WeeksStart,
        DateTime now,
        CancellationToken cancellationToken)
    {
        // Get attendance for last 4 weeks
        var recentAttendance = await _context.EventAttendances
            .Where(a => a.EventId == eventId && a.Date >= last4WeeksStart && a.Date <= now)
            .Select(a => a.Attendance)
            .ToListAsync(cancellationToken);

        // Get attendance for previous 4 weeks (for comparison)
        var previousAttendance = await _context.EventAttendances
            .Where(a => a.EventId == eventId && a.Date >= previous4WeeksStart && a.Date < last4WeeksStart)
            .Select(a => a.Attendance)
            .ToListAsync(cancellationToken);

        decimal recentAvg = recentAttendance.Any() ? (decimal)recentAttendance.Average() : 0;
        decimal previousAvg = previousAttendance.Any() ? (decimal)previousAttendance.Average() : 0;

        decimal changePercentage = 0;
        if (previousAvg > 0)
        {
            changePercentage = ((recentAvg - previousAvg) / previousAvg) * 100;
        }
        else if (recentAvg > 0)
        {
            changePercentage = 100; // 100% increase if there was no previous attendance
        }

        return (Math.Round(recentAvg, 0), Math.Round(changePercentage, 1));
    }
}
