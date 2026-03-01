using FastEndpoints;
using ChurchRegister.ApiService.Models.Reminders;
using ChurchRegister.ApiService.UseCase.Reminders.UpdateReminderCategory;
using ChurchRegister.Database.Constants;

namespace ChurchRegister.ApiService.Endpoints.Reminders;

/// <summary>
/// Endpoint for updating a reminder category
/// </summary>
public class UpdateReminderCategoryEndpoint : Endpoint<UpdateReminderCategoryRequest, ReminderCategoryDto>
{
    private readonly IUpdateReminderCategoryUseCase _useCase;

    public UpdateReminderCategoryEndpoint(IUpdateReminderCategoryUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Put("/api/reminder-categories/{id}");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.RemindersContributor, SystemRoles.RemindersAdministrator);
        Description(x => x
            .WithName("UpdateReminderCategory")
            .WithSummary("Update a reminder category")
            .WithDescription("Updates reminder category. System category names cannot be changed.")
            .WithTags("Reminders"));
    }

    public override async Task HandleAsync(UpdateReminderCategoryRequest req, CancellationToken ct)
    {
        var id = Route<int>("id");
        var username = User.Identity?.Name ?? "Unknown";
        var result = await _useCase.ExecuteAsync(id, req, username);
        await SendOkAsync(result, ct);
    }
}
