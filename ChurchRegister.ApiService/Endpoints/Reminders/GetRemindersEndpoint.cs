using ChurchRegister.ApiService.Models.Reminders;
using ChurchRegister.ApiService.UseCase.Reminders.GetReminders;
using ChurchRegister.Database.Constants;
using FastEndpoints;

namespace ChurchRegister.ApiService.Endpoints.Reminders;

public class GetRemindersEndpoint : Endpoint<ReminderQueryParameters, List<ReminderDto>>
{
    private readonly IGetRemindersUseCase _useCase;
    private readonly ILogger<GetRemindersEndpoint> _logger;

    public GetRemindersEndpoint(IGetRemindersUseCase useCase, ILogger<GetRemindersEndpoint> logger)
    {
        _useCase = useCase;
        _logger = logger;
    }

    public override void Configure()
    {
        Get("/api/reminders");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.RemindersViewer, SystemRoles.RemindersContributor, SystemRoles.RemindersAdministrator);
        Description(b => b
            .WithName("GetReminders")
            .WithSummary("Get all reminders with optional filters")
            .WithDescription("Retrieves a list of reminders. Supports filtering by status, assignedTo, categoryId, description search, and showExpired flag.")
            .WithTags("Reminders"));
    }

    public override async Task HandleAsync(ReminderQueryParameters query, CancellationToken ct)
    {
        _logger.LogInformation("GetReminders called with Status={Status}, AssignedToUserId={AssignedToUserId}, CategoryId={CategoryId}, ShowCompleted={ShowCompleted}",
            query.Status, query.AssignedToUserId, query.CategoryId, query.ShowCompleted);

        var reminders = await _useCase.ExecuteAsync(query);

        _logger.LogInformation("GetReminders returning {Count} reminders", reminders.Count);

        await SendOkAsync(reminders, ct);
    }
}
