using ChurchRegister.ApiService.UseCase.Reminders.DeleteReminder;
using ChurchRegister.Database.Constants;
using FastEndpoints;

namespace ChurchRegister.ApiService.Endpoints.Reminders;

public class DeleteReminderEndpoint : Endpoint<DeleteReminderRequest>
{
    private readonly IDeleteReminderUseCase _useCase;

    public DeleteReminderEndpoint(IDeleteReminderUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Delete("/api/reminders/{id}");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.RemindersContributor, SystemRoles.RemindersAdministrator);
        Description(b => b
            .WithName("DeleteReminder")
            .WithSummary("Delete a reminder")
            .WithDescription("Deletes a reminder by its ID. Cannot delete reminders with Status='Completed'.")
            .WithTags("Reminders"));
    }

    public override async Task HandleAsync(DeleteReminderRequest req, CancellationToken ct)
    {
        await _useCase.ExecuteAsync(req.Id);
        await SendNoContentAsync(ct);
    }
}

public class DeleteReminderRequest
{
    public int Id { get; set; }
}
