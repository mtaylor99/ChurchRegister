using ChurchRegister.ApiService.Models.Reminders;
using ChurchRegister.ApiService.UseCase.Reminders.CreateReminder;
using ChurchRegister.Database.Constants;
using FastEndpoints;
using System.Security.Claims;

namespace ChurchRegister.ApiService.Endpoints.Reminders;

public class CreateReminderEndpoint : Endpoint<CreateReminderRequest, ReminderDto>
{
    private readonly ICreateReminderUseCase _useCase;
    private readonly ILogger<CreateReminderEndpoint> _logger;

    public CreateReminderEndpoint(ICreateReminderUseCase useCase, ILogger<CreateReminderEndpoint> logger)
    {
        _useCase = useCase;
        _logger = logger;
    }

    public override void Configure()
    {
        Post("/api/reminders");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.RemindersContributor, SystemRoles.RemindersAdministrator);
        Description(b => b
            .WithName("CreateReminder")
            .WithSummary("Create a new reminder")
            .WithDescription("Creates a new reminder with the specified details. Status is automatically set to Pending.")
            .WithTags("Reminders"));
    }

    public override async Task<ReminderDto> HandleAsync(CreateReminderRequest req, CancellationToken ct)
    {
        _logger.LogInformation("CreateReminder called with Description={Description}, DueDate={DueDate}, AssignedToUserId={AssignedToUserId}, CategoryId={CategoryId}, Priority={Priority}",
            req.Description, req.DueDate, req.AssignedToUserId, req.CategoryId, req.Priority);

        var username = User.Identity?.Name ?? throw new UnauthorizedAccessException("User not authenticated");

        // Handle "current-user" as a special case to assign to the current logged-in user
        if (req.AssignedToUserId == "current-user")
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                throw new UnauthorizedAccessException("Unable to determine current user ID");
            }
            _logger.LogInformation("Converting 'current-user' to actual user ID: {UserId}", userId);
            req.AssignedToUserId = userId;
        }

        var reminder = await _useCase.ExecuteAsync(req, username);

        _logger.LogInformation("Reminder created successfully with ID={Id}, Status={Status}", reminder.Id, reminder.Status);

        await SendCreatedAtAsync<GetReminderByIdEndpoint>(new { id = reminder.Id }, reminder, cancellation: ct);
        return reminder;
    }
}
