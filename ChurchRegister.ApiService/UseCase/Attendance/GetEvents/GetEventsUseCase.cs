using ChurchRegister.ApiService.Models.Attendance;
using ChurchRegister.Database.Data;
using Microsoft.EntityFrameworkCore;

namespace ChurchRegister.ApiService.UseCase.Attendance.GetEvents;

public class GetEventsUseCase : IGetEventsUseCase
{
    private readonly ChurchRegisterWebContext _context;
    private readonly ILogger<GetEventsUseCase> _logger;

    public GetEventsUseCase(
        ChurchRegisterWebContext context,
        ILogger<GetEventsUseCase> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<GetEventsResponse>> ExecuteAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Retrieving all events");

        var events = await _context.Events
            .Select(e => new GetEventsResponse
            {
                Id = e.Id,
                Name = e.Name,
                Description = e.Description,
                IsActive = e.IsActive,
                ShowInAnalysis = e.ShowInAnalysis,
                DayOfWeek = e.DayOfWeek,
                CreatedAt = e.CreatedDateTime,
                CreatedBy = e.CreatedBy,
                LastModifiedAt = e.ModifiedDateTime,
                LastModifiedBy = e.ModifiedBy
            })
            .ToListAsync(cancellationToken);

        _logger.LogInformation("Retrieved {Count} events", events.Count);

        return events;
    }
}
