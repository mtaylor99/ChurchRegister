using ChurchRegister.ApiService.Models.Attendance;
using ChurchRegister.Database.Data;
using Microsoft.EntityFrameworkCore;

namespace ChurchRegister.ApiService.UseCase.Attendance.GetAttendance;

public class GetAttendanceUseCase : IGetAttendanceUseCase
{
    private readonly ChurchRegisterWebContext _context;
    private readonly ILogger<GetAttendanceUseCase> _logger;

    public GetAttendanceUseCase(
        ChurchRegisterWebContext context,
        ILogger<GetAttendanceUseCase> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<GetAttendanceResponse>> ExecuteAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Retrieving all attendance records");

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
                RecordedByName = _context.Users
                    .Where(u => u.Id == a.CreatedBy)
                    .Select(u => u.FirstName + " " + u.LastName)
                    .FirstOrDefault() ?? "Unknown User",
                CreatedDateTime = a.CreatedDateTime,
                ModifiedBy = a.ModifiedBy,
                ModifiedDateTime = a.ModifiedDateTime
            })
            .ToListAsync(cancellationToken);

        _logger.LogInformation("Retrieved {Count} attendance records", attendance.Count);

        return attendance;
    }
}
