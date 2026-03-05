using ChurchRegister.ApiService.Services.Reminders;

namespace ChurchRegister.ApiService.UseCase.Reminders.DeleteReminder;

/// <summary>
/// Use case implementation for deleting a reminder
/// </summary>
public class DeleteReminderUseCase : IDeleteReminderUseCase
{
    private readonly IReminderService _reminderService;
    private readonly ILogger<DeleteReminderUseCase> _logger;

    public DeleteReminderUseCase(
        IReminderService reminderService,
        ILogger<DeleteReminderUseCase> logger)
    {
        _reminderService = reminderService;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task ExecuteAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Deleting reminder: {ReminderId}", id);

            await _reminderService.DeleteReminderAsync(id);

            _logger.LogInformation("Successfully deleted reminder: {ReminderId}", id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting reminder: {ReminderId}", id);
            throw;
        }
    }
}
