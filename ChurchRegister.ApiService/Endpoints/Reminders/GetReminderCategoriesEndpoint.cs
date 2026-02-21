using FastEndpoints;
using ChurchRegister.ApiService.Models.Reminders;
using ChurchRegister.ApiService.UseCase.Reminders;
using ChurchRegister.Database.Constants;

namespace ChurchRegister.ApiService.Endpoints.Reminders;

/// <summary>
/// Endpoint for retrieving all reminder categories
/// </summary>
public class GetReminderCategoriesEndpoint : EndpointWithoutRequest<List<ReminderCategoryDto>>
{
    private readonly IGetReminderCategoriesUseCase _useCase;

    public GetReminderCategoriesEndpoint(IGetReminderCategoriesUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Get("/api/reminder-categories");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.RemindersViewer, SystemRoles.RemindersContributor, SystemRoles.RemindersAdministrator);
        Description(x => x
            .WithName("GetReminderCategories")
            .WithSummary("Get all reminder categories")
            .WithDescription("Retrieves all reminder categories ordered by sort order")
            .WithTags("Reminders"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var result = await _useCase.ExecuteAsync();
        await SendOkAsync(result, ct);
    }
}
