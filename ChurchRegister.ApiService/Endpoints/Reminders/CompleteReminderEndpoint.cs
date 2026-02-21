using ChurchRegister.ApiService.Models.Reminders;
using ChurchRegister.ApiService.UseCase.Reminders;
using ChurchRegister.Database.Constants;
using FastEndpoints;

namespace ChurchRegister.ApiService.Endpoints.Reminders;

public class CompleteReminderEndpoint : Endpoint<CompleteReminderRequest, CompleteReminderResponse>
{
    private readonly ICompleteReminderUseCase _useCase;

    public CompleteReminderEndpoint(ICompleteReminderUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Put("/api/reminders/{id}/complete");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.RemindersContributor, SystemRoles.RemindersAdministrator);
        Description(b => b
            .WithName("CompleteReminder")
            .WithSummary("Complete a reminder")
            .WithDescription("Marks a reminder as completed with completion notes. Optionally creates a next reminder with specified interval (3/6/12 months or custom date).")
            .WithTags("Reminders"));
    }

    public override async Task<CompleteReminderResponse> HandleAsync(CompleteReminderRequest req, CancellationToken ct)
    {
        var id = Route<int>("id");
        var username = User.Identity?.Name ?? throw new UnauthorizedAccessException("User not authenticated");
        var response = await _useCase.ExecuteAsync(id, req, username);
        return response;
    }
}
