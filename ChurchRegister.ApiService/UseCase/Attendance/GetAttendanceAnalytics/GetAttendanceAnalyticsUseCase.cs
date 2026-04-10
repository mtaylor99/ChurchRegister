using ChurchRegister.ApiService.Models.Attendance;
using ChurchRegister.ApiService.Models.Dashboard;
using ChurchRegister.Database.Data;
using Microsoft.EntityFrameworkCore;

namespace ChurchRegister.ApiService.UseCase.Attendance.GetAttendanceAnalytics;

public class GetAttendanceAnalyticsUseCase : IGetAttendanceAnalyticsUseCase
{
    private readonly ChurchRegisterWebContext _context;
    private readonly ILogger<GetAttendanceAnalyticsUseCase> _logger;

    public GetAttendanceAnalyticsUseCase(
        ChurchRegisterWebContext context,
        ILogger<GetAttendanceAnalyticsUseCase> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<AttendanceAnalyticsResponse> ExecuteAsync(
        GetAttendanceAnalyticsRequest request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Getting attendance analytics for event {EventId}", request.EventId);

        var eventEntity = await _context.Events.FindAsync(new object[] { request.EventId }, cancellationToken);

        if (eventEntity == null || !eventEntity.IsActive)
        {
            throw new KeyNotFoundException($"Active event with ID {request.EventId} not found.");
        }

        // Get 12 months of data
        var twelveMonthsAgo = DateTime.UtcNow.AddMonths(-11).Date;
        var now = DateTime.UtcNow.Date;

        var attendanceData = await _context.EventAttendances
            .Where(a => a.EventId == request.EventId && a.Date >= twelveMonthsAgo && a.Date <= now)
            .OrderBy(a => a.Date)
            .Select(a => new AttendanceDataPoint
            {
                Date = a.Date,
                Attendance = a.Attendance,
                MonthYear = a.Date.ToString("MMM yyyy")
            })
            .ToListAsync(cancellationToken);

        // Calculate statistics
        var statistics = new AttendanceStatistics();
        if (attendanceData.Any())
        {
            var attendanceValues = attendanceData.Select(d => d.Attendance).ToList();
            statistics = new AttendanceStatistics
            {
                Average = attendanceValues.Average(),
                Maximum = attendanceValues.Max(),
                Minimum = attendanceValues.Min(),
                TotalRecords = attendanceValues.Count,
                TrendPercentage = CalculateTrend(attendanceValues),
                TrendDirection = CalculateTrendDirection(attendanceValues)
            };
        }

        var response = new AttendanceAnalyticsResponse
        {
            EventId = request.EventId,
            EventName = eventEntity.Name,
            DataPoints = attendanceData,
            Statistics = statistics
        };

        _logger.LogInformation("Retrieved analytics for event {EventId} with {Count} data points",
            request.EventId, attendanceData.Count);

        return response;
    }

    private static double CalculateTrend(List<int> values)
    {
        if (values.Count < 2) return 0;

        var firstHalf = values.Take(values.Count / 2).Average();
        var secondHalf = values.Skip(values.Count / 2).Average();

        if (firstHalf == 0) return 0;

        return ((secondHalf - firstHalf) / firstHalf) * 100;
    }

    private static string CalculateTrendDirection(List<int> values)
    {
        var trend = CalculateTrend(values);

        return trend switch
        {
            > 5 => "up",
            < -5 => "down",
            _ => "stable"
        };
    }
}
