using FastEndpoints;
using ChurchRegister.ApiService.Models.Reminders;
using ChurchRegister.ApiService.UseCase.Reminders.GetReminderCategoryById;
using ChurchRegister.Database.Constants;

namespace ChurchRegister.ApiService.Endpoints.Reminders;

public class GetReminderCategoryByIdRequest
{
    public int Id { get; set; }
}

/// <summary>
/// Endpoint for retrieving a reminder category by ID
/// </summary>
public class GetReminderCategoryByIdEndpoint : Endpoint<GetReminderCategoryByIdRequest, ReminderCategoryDto>
{
    private readonly IGetReminderCategoryByIdUseCase _useCase;

    public GetReminderCategoryByIdEndpoint(IGetReminderCategoryByIdUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Get("/api/reminder-categories/{id}");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.RemindersViewer, SystemRoles.RemindersContributor, SystemRoles.RemindersAdministrator);
        Description(x => x
            .WithName("GetReminderCategoryById")
            .WithSummary("Get reminder category by ID")
            .WithDescription("Retrieves a specific reminder category with reminder count")
            .WithTags("Reminders"));
    }

    public override async Task HandleAsync(GetReminderCategoryByIdRequest req, CancellationToken ct)
    {
        var result = await _useCase.ExecuteAsync(req.Id);
        await SendOkAsync(result, ct);
    }
}
