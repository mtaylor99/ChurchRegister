using ChurchRegister.ApiService.Models.Attendance;
using ChurchRegister.Database.Data;
using ChurchRegister.Database.Entities;

namespace ChurchRegister.ApiService.UseCase.Attendance.CreateEvent;

public class CreateEventUseCase : ICreateEventUseCase
{
    private readonly ChurchRegisterWebContext _context;
    private readonly ILogger<CreateEventUseCase> _logger;

    public CreateEventUseCase(
        ChurchRegisterWebContext context,
        ILogger<CreateEventUseCase> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<int> ExecuteAsync(
        CreateEventRequest request,
        string createdBy,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Creating new event: {Name}", request.Name);

        var newEvent = new Events
        {
            Name = request.Name,
            Description = request.Description,
            IsActive = request.IsActive,
            ShowInAnalysis = request.ShowInAnalysis,
            DayOfWeek = request.DayOfWeek,
            CreatedDateTime = DateTime.UtcNow,
            CreatedBy = createdBy
        };

        _context.Events.Add(newEvent);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created event {Id}: {Name}", newEvent.Id, newEvent.Name);

        return newEvent.Id;
    }
}
