using ChurchRegister.ApiService.Models.Attendance;
using ChurchRegister.ApiService.Exceptions;
using ChurchRegister.Database.Data;
using Microsoft.EntityFrameworkCore;

namespace ChurchRegister.ApiService.UseCase.Attendance.UpdateAttendance;

public class UpdateAttendanceUseCase : IUpdateAttendanceUseCase
{
    private readonly ChurchRegisterWebContext _context;
    private readonly ILogger<UpdateAttendanceUseCase> _logger;

    public UpdateAttendanceUseCase(
        ChurchRegisterWebContext context,
        ILogger<UpdateAttendanceUseCase> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task ExecuteAsync(
        UpdateAttendanceRequest request,
        string modifiedBy,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Updating attendance record {Id}", request.Id);

        var attendance = await _context.EventAttendances.FindAsync(new object[] { request.Id }, cancellationToken);
        if (attendance == null)
        {
            throw new KeyNotFoundException($"Attendance record with ID {request.Id} not found.");
        }

        // Verify event exists and is active
        var eventEntity = await _context.Events.FindAsync(new object[] { request.EventId }, cancellationToken);
        if (eventEntity == null)
        {
            throw new ArgumentException($"Event with ID {request.EventId} not found.");
        }

        if (!eventEntity.IsActive)
        {
            throw new InvalidOperationException("Cannot update attendance for an inactive event.");
        }

        // Check for duplicate (if changing event or date)
        if (attendance.EventId != request.EventId || attendance.Date.Date != request.Date.Date)
        {
            var duplicateExists = await _context.EventAttendances
                .AnyAsync(a => a.Id != request.Id &&
                              a.EventId == request.EventId &&
                              a.Date.Date == request.Date.Date, cancellationToken);

            if (duplicateExists)
            {
                throw new ValidationException("An attendance record for this event and date already exists. Please use the edit function to update the existing record.");
            }
        }

        // Validate attendance count
        if (request.Attendance < 0)
        {
            throw new ArgumentException("Attendance count cannot be negative.");
        }

        attendance.EventId = request.EventId;
        attendance.Date = request.Date.Date;
        attendance.Attendance = request.Attendance;
        attendance.ModifiedDateTime = DateTime.UtcNow;
        attendance.ModifiedBy = modifiedBy;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Updated attendance record {Id}", request.Id);
    }
}
