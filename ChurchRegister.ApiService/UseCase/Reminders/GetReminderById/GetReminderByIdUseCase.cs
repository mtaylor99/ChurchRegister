using ChurchRegister.ApiService.Models.Reminders;
using ChurchRegister.ApiService.Services.Reminders;

namespace ChurchRegister.ApiService.UseCase.Reminders.GetReminderById;

/// <summary>
/// Use case implementation for retrieving a single reminder by ID
/// </summary>
public class GetReminderByIdUseCase : IGetReminderByIdUseCase
{
    private readonly IReminderService _reminderService;
    private readonly ILogger<GetReminderByIdUseCase> _logger;

    public GetReminderByIdUseCase(
        IReminderService reminderService,
        ILogger<GetReminderByIdUseCase> logger)
    {
        _reminderService = reminderService;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<ReminderDto> ExecuteAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Getting reminder by ID: {ReminderId}", id);

            var result = await _reminderService.GetReminderByIdAsync(id);

            _logger.LogInformation("Successfully retrieved reminder: {ReminderId}", id);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving reminder: {ReminderId}", id);
            throw;
        }
    }
}
