using ChurchRegister.Database.Data;
using Microsoft.EntityFrameworkCore;

namespace ChurchRegister.ApiService.UseCase.Attendance.DeleteEvent;

public class DeleteEventUseCase : IDeleteEventUseCase
{
    private readonly ChurchRegisterWebContext _context;
    private readonly ILogger<DeleteEventUseCase> _logger;

    public DeleteEventUseCase(
        ChurchRegisterWebContext context,
        ILogger<DeleteEventUseCase> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task ExecuteAsync(int id, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Deleting event {Id}", id);

        var eventEntity = await _context.Events.FindAsync(new object[] { id }, cancellationToken);
        if (eventEntity == null)
        {
            throw new KeyNotFoundException($"Event with ID {id} not found.");
        }

        _context.Events.Remove(eventEntity);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Deleted event {Id}", id);
    }
}
