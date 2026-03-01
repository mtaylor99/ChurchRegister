using ChurchRegister.ApiService.Models.Reminders;
using ChurchRegister.ApiService.Services.Reminders;

namespace ChurchRegister.ApiService.UseCase.Reminders.UpdateReminder;

/// <summary>
/// Use case implementation for updating an existing reminder
/// </summary>
public class UpdateReminderUseCase : IUpdateReminderUseCase
{
    private readonly IReminderService _reminderService;
    private readonly ILogger<UpdateReminderUseCase> _logger;

    public UpdateReminderUseCase(
        IReminderService reminderService,
        ILogger<UpdateReminderUseCase> logger)
    {
        _reminderService = reminderService;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<ReminderDto> ExecuteAsync(int id, UpdateReminderRequest request, string username, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Updating reminder: {ReminderId} by {Username}", id, username);

            var result = await _reminderService.UpdateReminderAsync(id, request, username);

            _logger.LogInformation("Successfully updated reminder: {ReminderId}", id);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating reminder: {ReminderId}", id);
            throw;
        }
    }
}
