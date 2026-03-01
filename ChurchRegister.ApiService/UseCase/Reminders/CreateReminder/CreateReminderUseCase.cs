using ChurchRegister.ApiService.Models.Reminders;
using ChurchRegister.ApiService.Services.Reminders;

namespace ChurchRegister.ApiService.UseCase.Reminders.CreateReminder;

/// <summary>
/// Use case implementation for creating a new reminder
/// </summary>
public class CreateReminderUseCase : ICreateReminderUseCase
{
    private readonly IReminderService _reminderService;
    private readonly ILogger<CreateReminderUseCase> _logger;

    public CreateReminderUseCase(
        IReminderService reminderService,
        ILogger<CreateReminderUseCase> logger)
    {
        _reminderService = reminderService;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<ReminderDto> ExecuteAsync(CreateReminderRequest request, string username, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Creating reminder: {Description} by {Username}", request.Description, username);

            var result = await _reminderService.CreateReminderAsync(request, username);

            _logger.LogInformation("Successfully created reminder with ID: {ReminderId}", result.Id);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating reminder: {Description} by {Username}", request.Description, username);
            throw;
        }
    }
}
