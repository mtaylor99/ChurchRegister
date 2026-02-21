using FastEndpoints;
using ChurchRegister.ApiService.Models.Reminders;
using ChurchRegister.ApiService.UseCase.Reminders;
using ChurchRegister.Database.Constants;

namespace ChurchRegister.ApiService.Endpoints.Reminders;

/// <summary>
/// Endpoint for creating a new reminder category
/// </summary>
public class CreateReminderCategoryEndpoint : Endpoint<CreateReminderCategoryRequest, ReminderCategoryDto>
{
    private readonly ICreateReminderCategoryUseCase _useCase;

    public CreateReminderCategoryEndpoint(ICreateReminderCategoryUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Post("/api/reminder-categories");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.RemindersContributor, SystemRoles.RemindersAdministrator);
        Description(x => x
            .WithName("CreateReminderCategory")
            .WithSummary("Create a new reminder category")
            .WithDescription("Creates a new reminder category with unique name and optional color. System categories cannot be created via API.")
            .WithTags("Reminders"));
    }

    public override async Task HandleAsync(CreateReminderCategoryRequest req, CancellationToken ct)
    {
        var username = User.Identity?.Name ?? "Unknown";
        var result = await _useCase.ExecuteAsync(req, username);
        await SendCreatedAtAsync<GetReminderCategoryByIdEndpoint>(
            new { id = result.Id },
            result,
            generateAbsoluteUrl: true,
            cancellation: ct);
    }
}
