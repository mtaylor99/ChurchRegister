using ChurchRegister.ApiService.Models.Reminders;
using ChurchRegister.ApiService.UseCase.Reminders.GetReminderById;
using ChurchRegister.Database.Constants;
using FastEndpoints;

namespace ChurchRegister.ApiService.Endpoints.Reminders;

public class GetReminderByIdEndpoint : Endpoint<GetReminderByIdRequest, ReminderDto>
{
    private readonly IGetReminderByIdUseCase _useCase;

    public GetReminderByIdEndpoint(IGetReminderByIdUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Get("/api/reminders/{id}");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.RemindersViewer, SystemRoles.RemindersContributor, SystemRoles.RemindersAdministrator);
        Description(b => b
            .WithName("GetReminderById")
            .WithSummary("Get a reminder by ID")
            .WithDescription("Retrieves a single reminder by its unique identifier.")
            .WithTags("Reminders"));
    }

    public override async Task HandleAsync(GetReminderByIdRequest req, CancellationToken ct)
    {
        var reminder = await _useCase.ExecuteAsync(req.Id);
        await SendOkAsync(reminder, ct);
    }
}

public class GetReminderByIdRequest
{
    public int Id { get; set; }
}
