using ChurchRegister.Database.Data;

namespace ChurchRegister.ApiService.UseCase.Attendance.DeleteAttendance;

public class DeleteAttendanceUseCase : IDeleteAttendanceUseCase
{
    private readonly ChurchRegisterWebContext _context;
    private readonly ILogger<DeleteAttendanceUseCase> _logger;

    public DeleteAttendanceUseCase(
        ChurchRegisterWebContext context,
        ILogger<DeleteAttendanceUseCase> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task ExecuteAsync(int id, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Deleting attendance record {Id}", id);

        var attendance = await _context.EventAttendances.FindAsync(new object[] { id }, cancellationToken);
        if (attendance == null)
        {
            throw new KeyNotFoundException($"Attendance record with ID {id} not found.");
        }

        _context.EventAttendances.Remove(attendance);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Deleted attendance record {Id}", id);
    }
}
