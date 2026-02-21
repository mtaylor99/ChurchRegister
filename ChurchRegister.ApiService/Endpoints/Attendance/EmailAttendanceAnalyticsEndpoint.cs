using ChurchRegister.ApiService.Services.ChurchMembers;
using ChurchRegister.ApiService.Services.Contributions;
using ChurchRegister.ApiService.Services.Security;
using ChurchRegister.Database.Constants;
using ChurchRegister.Database.Data;
using ChurchRegister.ApiService.UseCase.Attendance.EmailAttendanceAnalytics;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace ChurchRegister.ApiService.Endpoints.Attendance;

/// <summary>
/// Endpoint for emailing attendance analytics reports
/// </summary>
public class EmailAttendanceAnalyticsEndpoint : Endpoint<EmailAttendanceAnalyticsRequest>
{
    private readonly IEmailAttendanceAnalyticsUseCase _useCase;
    private readonly ILogger<EmailAttendanceAnalyticsEndpoint> _logger;

    public EmailAttendanceAnalyticsEndpoint(
        IEmailAttendanceAnalyticsUseCase useCase,
        ILogger<EmailAttendanceAnalyticsEndpoint> logger)
    {
        _useCase = useCase;
        _logger = logger;
    }

    public override void Configure()
    {
        Post("/api/attendance/email-analytics");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.AttendanceAdministrator);
        Description(x => x
            .WithName("EmailAttendanceAnalytics")
            .WithSummary("Email attendance analytics report")
            .WithDescription("Sends an attendance analytics report via email for a specific event or all events")
            .WithTags("Attendance"));
    }

    public override async Task HandleAsync(EmailAttendanceAnalyticsRequest req, CancellationToken ct)
    {
        try
        {
            var userId = User.Identity?.Name ?? "system";
            await _useCase.ExecuteAsync(req.EventId, req.Email, ct);
            _logger.LogInformation("Attendance analytics email sent successfully to {Email} by {User}", 
                req.Email, userId);
            await SendOkAsync("Email sent successfully", ct);
        }
        catch (KeyNotFoundException)
        {
            await SendNotFoundAsync(ct);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid request for attendance analytics email to {Email}", req.Email);
            await SendAsync(new { error = ex.Message }, statusCode: 400, cancellation: ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending attendance analytics email to {Email}", req.Email);
            ThrowError("An error occurred while sending the email.");
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