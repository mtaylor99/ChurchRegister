using ChurchRegister.ApiService.Services;
using ChurchRegister.Database.Data;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace ChurchRegister.ApiService.Endpoints.Administration;

/// <summary>
/// Endpoint for emailing attendance analytics reports
/// </summary>
public class EmailAttendanceAnalyticsEndpoint : Endpoint<EmailAttendanceAnalyticsRequest>
{
    private readonly ChurchRegisterWebContext _context;
    private readonly IAzureEmailService _emailService;
    private readonly ILogger<EmailAttendanceAnalyticsEndpoint> _logger;

    public EmailAttendanceAnalyticsEndpoint(
        ChurchRegisterWebContext context,
        IAzureEmailService emailService,
        ILogger<EmailAttendanceAnalyticsEndpoint> logger)
    {
        _context = context;
        _emailService = emailService;
        _logger = logger;
    }

    public override void Configure()
    {
        Post("/api/attendance/email-analytics");
        // Allow either Attendance.ShareAnalytics permission OR SystemAdministration role
        Policies("AttendanceSharePolicy");
        Description(x => x
            .WithName("EmailAttendanceAnalytics")
            .WithSummary("Email attendance analytics report")
            .WithDescription("Sends an attendance analytics report via email for a specific event or all events")
            .WithTags("Attendance", "Analytics", "Administration"));
    }

    public override async Task HandleAsync(EmailAttendanceAnalyticsRequest req, CancellationToken ct)
    {
        try
        {
            // Validate email address
            if (string.IsNullOrWhiteSpace(req.Email) || !IsValidEmail(req.Email))
            {
                ThrowError("Invalid email address provided.");
            }

            // Get event information if specific event requested
            string subject;
            string htmlContent;

            if (req.EventId.HasValue)
            {
                // Single event analytics
                var eventEntity = await _context.Events
                    .FirstOrDefaultAsync(e => e.Id == req.EventId.Value && e.IsActive, ct);

                if (eventEntity == null)
                {
                    await SendNotFoundAsync(ct);
                    return;
                }

                subject = $"Attendance Analytics - {eventEntity.Name}";
                htmlContent = await GenerateSingleEventEmailContent(eventEntity, ct);
            }
            else
            {
                // All events analytics
                subject = "Church Attendance Analytics Report";
                htmlContent = await GenerateAllEventsEmailContent(ct);
            }

            // Send email
            var emailSent = await _emailService.SendEmailAsync(req.Email, subject, htmlContent);

            if (emailSent)
            {
                _logger.LogInformation("Attendance analytics email sent successfully to {Email} by {User}", 
                    req.Email, User.Identity?.Name ?? "system");
                await SendOkAsync("Email sent successfully", ct);
            }
            else
            {
                _logger.LogError("Failed to send attendance analytics email to {Email}", req.Email);
                ThrowError("Failed to send email. Please try again later.");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending attendance analytics email to {Email}", req.Email);
            ThrowError("An error occurred while sending the email.");
        }
    }

    private async Task<string> GenerateSingleEventEmailContent(Database.Entities.Events eventEntity, CancellationToken ct)
    {
        // Get 12 months of attendance data
        var twelveMonthsAgo = DateTime.UtcNow.AddMonths(-11).Date;
        var now = DateTime.UtcNow.Date;

        var attendanceData = await _context.EventAttendances
            .Where(a => a.EventId == eventEntity.Id && a.Date >= twelveMonthsAgo && a.Date <= now)
            .OrderBy(a => a.Date)
            .ToListAsync(ct);

        var stats = CalculateStatistics(attendanceData.Select(a => a.Attendance).ToList());

        return $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; }}
        .header {{ color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }}
        .stats {{ background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }}
        .data-table {{ border-collapse: collapse; width: 100%; margin-top: 20px; }}
        .data-table th, .data-table td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
        .data-table th {{ background-color: #3498db; color: white; }}
        .trend-up {{ color: #27ae60; font-weight: bold; }}
        .trend-down {{ color: #e74c3c; font-weight: bold; }}
        .trend-stable {{ color: #f39c12; font-weight: bold; }}
    </style>
</head>
<body>
    <div class='header'>
        <h1>Attendance Analytics Report</h1>
        <h2>{eventEntity.Name}</h2>
        <p>Generated on {DateTime.Now:MMMM dd, yyyy} by Church Register System</p>
    </div>
    
    <div class='stats'>
        <h3>Summary Statistics (Last 12 Months)</h3>
        <p><strong>Total Records:</strong> {stats.TotalRecords}</p>
        <p><strong>Average Attendance:</strong> {stats.Average:F1}</p>
        <p><strong>Highest Attendance:</strong> {stats.Maximum}</p>
        <p><strong>Lowest Attendance:</strong> {stats.Minimum}</p>
        <p><strong>Trend:</strong> <span class='trend-{stats.TrendDirection}'>{GetTrendDescription(stats.TrendPercentage, stats.TrendDirection)}</span></p>
    </div>

    <table class='data-table'>
        <thead>
            <tr>
                <th>Date</th>
                <th>Attendance</th>
            </tr>
        </thead>
        <tbody>
            {string.Join("", attendanceData.Select(a => $"<tr><td>{a.Date:MMM dd, yyyy}</td><td>{a.Attendance}</td></tr>"))}
        </tbody>
    </table>

    <p style='margin-top: 30px; font-size: 12px; color: #7f8c8d;'>
        This report was generated automatically by the Church Register system. 
        For questions or support, please contact your system administrator.
    </p>
</body>
</html>";
    }

    private async Task<string> GenerateAllEventsEmailContent(CancellationToken ct)
    {
        var activeEvents = await _context.Events
            .Where(e => e.IsActive && e.ShowInAnalysis)
            .ToListAsync(ct);

        var twelveMonthsAgo = DateTime.UtcNow.AddMonths(-11).Date;
        var now = DateTime.UtcNow.Date;

        var eventsSummary = new List<(string Name, int TotalAttendance, double Average, int Records)>();

        foreach (var eventEntity in activeEvents)
        {
            var attendanceData = await _context.EventAttendances
                .Where(a => a.EventId == eventEntity.Id && a.Date >= twelveMonthsAgo && a.Date <= now)
                .ToListAsync(ct);

            if (attendanceData.Any())
            {
                eventsSummary.Add((
                    eventEntity.Name,
                    attendanceData.Sum(a => a.Attendance),
                    attendanceData.Average(a => a.Attendance),
                    attendanceData.Count
                ));
            }
        }

        return $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; }}
        .header {{ color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }}
        .data-table {{ border-collapse: collapse; width: 100%; margin-top: 20px; }}
        .data-table th, .data-table td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
        .data-table th {{ background-color: #3498db; color: white; }}
    </style>
</head>
<body>
    <div class='header'>
        <h1>Church Attendance Analytics Report</h1>
        <h2>All Events Summary</h2>
        <p>Generated on {DateTime.Now:MMMM dd, yyyy} by Church Register System</p>
    </div>

    <table class='data-table'>
        <thead>
            <tr>
                <th>Event Name</th>
                <th>Total Attendance (12 months)</th>
                <th>Average Attendance</th>
                <th>Number of Records</th>
            </tr>
        </thead>
        <tbody>
            {string.Join("", eventsSummary.Select(e => $"<tr><td>{e.Name}</td><td>{e.TotalAttendance}</td><td>{e.Average:F1}</td><td>{e.Records}</td></tr>"))}
        </tbody>
    </table>

    <p style='margin-top: 30px; font-size: 12px; color: #7f8c8d;'>
        This report was generated automatically by the Church Register system. 
        For questions or support, please contact your system administrator.
    </p>
</body>
</html>";
    }

    private static (int TotalRecords, double Average, int Maximum, int Minimum, double TrendPercentage, string TrendDirection) CalculateStatistics(List<int> values)
    {
        if (!values.Any())
            return (0, 0, 0, 0, 0, "stable");

        var trend = CalculateTrend(values);
        return (
            values.Count,
            values.Average(),
            values.Max(),
            values.Min(),
            trend,
            GetTrendDirection(trend)
        );
    }

    private static double CalculateTrend(List<int> values)
    {
        if (values.Count < 2) return 0;
        
        var firstHalf = values.Take(values.Count / 2).Average();
        var secondHalf = values.Skip(values.Count / 2).Average();
        
        if (firstHalf == 0) return 0;
        
        return ((secondHalf - firstHalf) / firstHalf) * 100;
    }

    private static string GetTrendDirection(double trend)
    {
        return trend switch
        {
            > 5 => "up",
            < -5 => "down",
            _ => "stable"
        };
    }

    private static string GetTrendDescription(double trendPercentage, string trendDirection)
    {
        return trendDirection switch
        {
            "up" => $"Increasing by {trendPercentage:F1}%",
            "down" => $"Decreasing by {Math.Abs(trendPercentage):F1}%",
            _ => "Stable"
        };
    }

    private static bool IsValidEmail(string email)
    {
        try
        {
            var addr = new System.Net.Mail.MailAddress(email);
            return addr.Address == email;
        }
        catch
        {
            return false;
        }
    }
}

public record EmailAttendanceAnalyticsRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; init; } = string.Empty;
    
    public int? EventId { get; init; } // If null, send all events
    
    public string? ChartData { get; init; } // Base64 encoded chart image (optional)
}