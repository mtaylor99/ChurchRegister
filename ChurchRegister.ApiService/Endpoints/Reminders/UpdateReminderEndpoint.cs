using ChurchRegister.ApiService.Models.Reminders;
using ChurchRegister.ApiService.UseCase.Reminders.UpdateReminder;
using ChurchRegister.Database.Constants;
using FastEndpoints;

namespace ChurchRegister.ApiService.Endpoints.Reminders;

public class UpdateReminderEndpoint : Endpoint<UpdateReminderRequest, ReminderDto>
{
    private readonly IUpdateReminderUseCase _useCase;

    public UpdateReminderEndpoint(IUpdateReminderUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Put("/api/reminders/{id}");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.RemindersContributor, SystemRoles.RemindersAdministrator);
        Description(b => b
            .WithName("UpdateReminder")
            .WithSummary("Update a reminder")
            .WithDescription("Updates an existing reminder. Cannot update reminders with Status='Completed'.")
            .WithTags("Reminders"));
    }

    public override async Task<ReminderDto> HandleAsync(UpdateReminderRequest req, CancellationToken ct)
    {
        var id = Route<int>("id");
        var username = User.Identity?.Name ?? throw new UnauthorizedAccessException("User not authenticated");

        var reminder = await _useCase.ExecuteAsync(id, req, username);
        return reminder;
    }
}
