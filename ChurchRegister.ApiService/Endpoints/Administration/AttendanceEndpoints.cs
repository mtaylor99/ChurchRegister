using ChurchRegister.ApiService.Models.Administration;
using ChurchRegister.Database.Data;
using ChurchRegister.Database.Entities;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace ChurchRegister.ApiService.Endpoints.Administration;

/// <summary>
/// Endpoint for retrieving all event attendance records
/// </summary>
public class GetAttendanceEndpoint : EndpointWithoutRequest<List<GetAttendanceResponse>>
{
    private readonly ChurchRegisterWebContext _context;

    public GetAttendanceEndpoint(ChurchRegisterWebContext context)
    {
        _context = context;
    }

    public override void Configure()
    {
        Get("/api/attendance");
        // Allow either Attendance.View permission OR SystemAdministration role
        Policies("AttendanceViewPolicy");
        Description(x => x
            .WithName("GetAttendance")
            .WithSummary("Get all attendance records")
            .WithDescription("Retrieves all event attendance records sorted by date and event name")
            .WithTags("Attendance", "Administration"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var attendance = await _context.EventAttendances
            .Include(a => a.Event)
            .OrderByDescending(a => a.Date)
            .ThenBy(a => a.Event.Name)
            .Select(a => new GetAttendanceResponse
            {
                Id = a.Id,
                EventId = a.EventId,
                EventName = a.Event.Name,
                Date = a.Date,
                Attendance = a.Attendance,
                CreatedBy = a.CreatedBy,
                CreatedDateTime = a.CreatedDateTime,
                ModifiedBy = a.ModifiedBy,
                ModifiedDateTime = a.ModifiedDateTime
            })
            .ToListAsync(ct);

        await SendAsync(attendance, cancellation: ct);
    }
}

/// <summary>
/// Endpoint for creating a new attendance record
/// </summary>
public class CreateAttendanceEndpoint : Endpoint<CreateAttendanceRequest>
{
    private readonly ChurchRegisterWebContext _context;

    public CreateAttendanceEndpoint(ChurchRegisterWebContext context)
    {
        _context = context;
    }

    public override void Configure()
    {
        Post("/api/attendance");
        // Allow either Attendance.Record permission OR SystemAdministration role
        Policies("AttendanceRecordPolicy");
        Description(x => x
            .WithName("CreateAttendance")
            .WithSummary("Create a new attendance record")
            .WithDescription("Records attendance for a specific event and date")
            .WithTags("Attendance", "Administration"));
    }

    public override async Task HandleAsync(CreateAttendanceRequest req, CancellationToken ct)
    {
        // Check for duplicate entry (same event and date)
        var existingEntry = await _context.EventAttendances
            .AnyAsync(a => a.EventId == req.EventId && a.Date.Date == req.Date.Date, ct);

        if (existingEntry)
        {
            ThrowError("An attendance record for this event and date already exists.");
        }

        // Verify event exists and is active
        var eventExists = await _context.Events
            .AnyAsync(e => e.Id == req.EventId && e.IsActive, ct);

        if (!eventExists)
        {
            await SendNotFoundAsync(ct);
            return;
        }

        var newAttendance = new EventAttendance
        {
            EventId = req.EventId,
            Date = req.Date.Date, // Store only the date part
            Attendance = req.Attendance,
            CreatedDateTime = DateTime.UtcNow,
            CreatedBy = User.Identity?.Name ?? "system"
        };

        _context.EventAttendances.Add(newAttendance);
        await _context.SaveChangesAsync(ct);

        await SendCreatedAtAsync<GetAttendanceEndpoint>(
            routeValues: new { id = newAttendance.Id },
            responseBody: null,
            generateAbsoluteUrl: true,
            cancellation: ct);
    }
}

/// <summary>
/// Endpoint for updating an existing attendance record
/// </summary>
public class UpdateAttendanceEndpoint : Endpoint<UpdateAttendanceRequest>
{
    private readonly ChurchRegisterWebContext _context;

    public UpdateAttendanceEndpoint(ChurchRegisterWebContext context)
    {
        _context = context;
    }

    public override void Configure()
    {
        Put("/api/attendance/{Id}");
        // Allow either Attendance.Record permission OR SystemAdministration role
        Policies("AttendanceRecordPolicy");
        Description(x => x
            .WithName("UpdateAttendance")
            .WithSummary("Update an existing attendance record")
            .WithDescription("Updates the attendance record for a specific event and date")
            .WithTags("Attendance", "Administration"));
    }

    public override async Task HandleAsync(UpdateAttendanceRequest req, CancellationToken ct)
    {
        var existingAttendance = await _context.EventAttendances.FindAsync(new object[] { req.Id }, ct);
        
        if (existingAttendance == null)
        {
            await SendNotFoundAsync(ct);
            return;
        }

        // Check for duplicate if event or date changed
        if (existingAttendance.EventId != req.EventId || existingAttendance.Date.Date != req.Date.Date)
        {
            var duplicateExists = await _context.EventAttendances
                .AnyAsync(a => a.Id != req.Id && a.EventId == req.EventId && a.Date.Date == req.Date.Date, ct);

            if (duplicateExists)
            {
                ThrowError("An attendance record for this event and date already exists.");
            }
        }

        // Verify event exists and is active
        var eventExists = await _context.Events
            .AnyAsync(e => e.Id == req.EventId && e.IsActive, ct);

        if (!eventExists)
        {
            ThrowError("The specified event does not exist or is inactive.");
        }

        existingAttendance.EventId = req.EventId;
        existingAttendance.Date = req.Date.Date;
        existingAttendance.Attendance = req.Attendance;
        existingAttendance.ModifiedDateTime = DateTime.UtcNow;
        existingAttendance.ModifiedBy = User.Identity?.Name ?? "system";

        await _context.SaveChangesAsync(ct);
        await SendNoContentAsync(ct);
    }
}

/// <summary>
/// Endpoint for deleting an attendance record
/// </summary>
public class DeleteAttendanceEndpoint : Endpoint<DeleteAttendanceRequest>
{
    private readonly ChurchRegisterWebContext _context;

    public DeleteAttendanceEndpoint(ChurchRegisterWebContext context)
    {
        _context = context;
    }

    public override void Configure()
    {
        Delete("/api/attendance/{Id}");
        // Allow either Attendance.Record permission OR SystemAdministration role
        Policies("AttendanceRecordPolicy");
        Description(x => x
            .WithName("DeleteAttendance")
            .WithSummary("Delete an attendance record")
            .WithDescription("Removes an attendance record from the system")
            .WithTags("Attendance", "Administration"));
    }

    public override async Task HandleAsync(DeleteAttendanceRequest req, CancellationToken ct)
    {
        var attendance = await _context.EventAttendances.FindAsync(new object[] { req.Id }, ct);
        
        if (attendance == null)
        {
            await SendNotFoundAsync(ct);
            return;
        }

        _context.EventAttendances.Remove(attendance);
        await _context.SaveChangesAsync(ct);
        await SendNoContentAsync(ct);
    }
}

/// <summary>
/// Endpoint for retrieving attendance analytics for a specific event
/// </summary>
public class GetAttendanceAnalyticsEndpoint : Endpoint<GetAttendanceAnalyticsRequest, AttendanceAnalyticsResponse>
{
    private readonly ChurchRegisterWebContext _context;

    public GetAttendanceAnalyticsEndpoint(ChurchRegisterWebContext context)
    {
        _context = context;
    }

    public override void Configure()
    {
        Get("/api/attendance/analytics/{EventId}");
        // Allow either Attendance.ViewAnalytics permission OR SystemAdministration role
        Policies("AttendanceAnalyticsPolicy");
        Description(x => x
            .WithName("GetAttendanceAnalytics")
            .WithSummary("Get attendance analytics for an event")
            .WithDescription("Retrieves attendance data and statistics for the past 12 months for a specific event")
            .WithTags("Attendance", "Analytics", "Administration"));
    }

    public override async Task HandleAsync(GetAttendanceAnalyticsRequest req, CancellationToken ct)
    {
        var eventEntity = await _context.Events.FindAsync(new object[] { req.EventId }, ct);
        
        if (eventEntity == null || !eventEntity.IsActive)
        {
            await SendNotFoundAsync(ct);
            return;
        }

        // Get 12 months of data
        var twelveMonthsAgo = DateTime.UtcNow.AddMonths(-11).Date;
        var now = DateTime.UtcNow.Date;

        var attendanceData = await _context.EventAttendances
            .Where(a => a.EventId == req.EventId && a.Date >= twelveMonthsAgo && a.Date <= now)
            .OrderBy(a => a.Date)
            .Select(a => new AttendanceDataPoint
            {
                Date = a.Date,
                Attendance = a.Attendance,
                MonthYear = a.Date.ToString("MMM yyyy")
            })
            .ToListAsync(ct);

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
            EventId = req.EventId,
            EventName = eventEntity.Name,
            DataPoints = attendanceData,
            Statistics = statistics
        };

        await SendOkAsync(response, ct);
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

// Additional request models for endpoints
public record DeleteAttendanceRequest
{
    public int Id { get; init; }
}

public record GetAttendanceAnalyticsRequest
{
    public int EventId { get; init; }
}