using ChurchRegister.ApiService.Models.Reminders;
using ChurchRegister.ApiService.Services.Reminders;

namespace ChurchRegister.ApiService.UseCase.Reminders.GetReminders;

/// <summary>
/// Use case implementation for retrieving a filtered list of reminders
/// </summary>
public class GetRemindersUseCase : IGetRemindersUseCase
{
    private readonly IReminderService _reminderService;
    private readonly ILogger<GetRemindersUseCase> _logger;

    public GetRemindersUseCase(
        IReminderService reminderService,
        ILogger<GetRemindersUseCase> logger)
    {
        _reminderService = reminderService;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<List<ReminderDto>> ExecuteAsync(ReminderQueryParameters query, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Getting reminders with query parameters");

            var result = await _reminderService.GetRemindersAsync(query);

            _logger.LogInformation("Successfully retrieved {Count} reminders", result.Count);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving reminders");
            throw;
        }
    }
}
