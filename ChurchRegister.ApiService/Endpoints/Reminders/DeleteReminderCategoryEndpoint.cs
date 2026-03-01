using FastEndpoints;
using ChurchRegister.ApiService.UseCase.Reminders.DeleteReminderCategory;
using ChurchRegister.Database.Constants;

namespace ChurchRegister.ApiService.Endpoints.Reminders;

public class DeleteReminderCategoryRequest
{
    public int Id { get; set; }
}

/// <summary>
/// Endpoint for deleting a reminder category
/// </summary>
public class DeleteReminderCategoryEndpoint : Endpoint<DeleteReminderCategoryRequest>
{
    private readonly IDeleteReminderCategoryUseCase _useCase;

    public DeleteReminderCategoryEndpoint(IDeleteReminderCategoryUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Delete("/api/reminder-categories/{id}");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.RemindersContributor, SystemRoles.RemindersAdministrator);
        Description(x => x
            .WithName("DeleteReminderCategory")
            .WithSummary("Delete a reminder category")
            .WithDescription("Deletes a reminder category. Cannot delete system categories or categories in use.")
            .WithTags("Reminders"));
    }

    public override async Task HandleAsync(DeleteReminderCategoryRequest req, CancellationToken ct)
    {
        await _useCase.ExecuteAsync(req.Id);
        await SendNoContentAsync(ct);
    }
}
