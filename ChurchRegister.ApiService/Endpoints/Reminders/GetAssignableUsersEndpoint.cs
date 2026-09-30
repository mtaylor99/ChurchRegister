using ChurchRegister.ApiService.Models.Reminders;
using ChurchRegister.ApiService.Services.Reminders;
using ChurchRegister.Database.Constants;
using FastEndpoints;

namespace ChurchRegister.ApiService.Endpoints.Reminders;

/// <summary>
/// Endpoint for retrieving users a reminder can be assigned to
/// </summary>
public class GetAssignableUsersEndpoint : EndpointWithoutRequest<List<AssignableUserDto>>
{
    private readonly IReminderService _reminderService;

    public GetAssignableUsersEndpoint(IReminderService reminderService)
    {
        _reminderService = reminderService;
    }

    public override void Configure()
    {
        Get("/api/reminders/assignable-users");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.RemindersContributor, SystemRoles.RemindersAdministrator);
        Description(x => x
            .WithName("GetAssignableReminderUsers")
            .WithSummary("Get users a reminder can be assigned to")
            .WithDescription("Retrieves active users with a Reminders contributor/administrator or system administration role")
            .WithTags("Reminders"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var result = await _reminderService.GetAssignableUsersAsync();
        await Send.OkAsync(result, ct);
    }
}
