using ChurchRegister.ApiService.Models.Attendance;
using ChurchRegister.Database.Data;
using ChurchRegister.Database.Entities;
using Microsoft.EntityFrameworkCore;

namespace ChurchRegister.ApiService.UseCase.Attendance.CreateAttendance;

public class CreateAttendanceUseCase : ICreateAttendanceUseCase
{
    private readonly ChurchRegisterWebContext _context;
    private readonly ILogger<CreateAttendanceUseCase> _logger;

    public CreateAttendanceUseCase(
        ChurchRegisterWebContext context,
        ILogger<CreateAttendanceUseCase> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task ExecuteAsync(
        CreateAttendanceRequest request,
        string createdBy,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Creating attendance record for event {EventId} on {Date}",
            request.EventId, request.Date);

        // Check for duplicate entry (same event and date)
        var existingEntry = await _context.EventAttendances
            .AnyAsync(a => a.EventId == request.EventId && a.Date.Date == request.Date.Date, cancellationToken);

        if (existingEntry)
        {
            throw new InvalidOperationException("An attendance record for this event and date already exists.");
        }

        // Verify event exists and is active
        var eventEntity = await _context.Events.FindAsync(new object[] { request.EventId }, cancellationToken);
        if (eventEntity == null)
        {
            throw new ArgumentException($"Event with ID {request.EventId} not found.");
        }

        if (!eventEntity.IsActive)
        {
            throw new InvalidOperationException("Cannot record attendance for an inactive event.");
        }

        // Validate attendance count
        if (request.Attendance < 0)
        {
            throw new ArgumentException("Attendance count cannot be negative.");
        }

        var attendance = new EventAttendance
        {
            EventId = request.EventId,
            Date = request.Date.Date,
            Attendance = request.Attendance,
            CreatedDateTime = DateTime.UtcNow,
            CreatedBy = createdBy
        };

        _context.EventAttendances.Add(attendance);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created attendance record {Id} for event {EventId}",
            attendance.Id, request.EventId);
    }
}
