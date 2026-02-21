using ChurchRegister.ApiService.Models.Attendance;
using ChurchRegister.Database.Data;

namespace ChurchRegister.ApiService.UseCase.Attendance.UpdateEvent;

public class UpdateEventUseCase : IUpdateEventUseCase
{
    private readonly ChurchRegisterWebContext _context;
    private readonly ILogger<UpdateEventUseCase> _logger;

    public UpdateEventUseCase(
        ChurchRegisterWebContext context,
        ILogger<UpdateEventUseCase> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task ExecuteAsync(
        UpdateEventRequest request,
        string modifiedBy,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Updating event {Id}", request.Id);

        var eventEntity = await _context.Events.FindAsync(new object[] { request.Id }, cancellationToken);
        if (eventEntity == null)
        {
            throw new KeyNotFoundException($"Event with ID {request.Id} not found.");
        }

        eventEntity.Name = request.Name;
        eventEntity.Description = request.Description;
        eventEntity.IsActive = request.IsActive;
        eventEntity.ShowInAnalysis = request.ShowInAnalysis;
        eventEntity.DayOfWeek = request.DayOfWeek;
        eventEntity.ModifiedDateTime = DateTime.UtcNow;
        eventEntity.ModifiedBy = modifiedBy;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Updated event {Id}: {Name}", eventEntity.Id, eventEntity.Name);
    }
}
