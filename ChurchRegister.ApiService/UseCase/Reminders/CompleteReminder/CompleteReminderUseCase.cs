using ChurchRegister.ApiService.Models.Reminders;
using ChurchRegister.ApiService.Services.Reminders;

namespace ChurchRegister.ApiService.UseCase.Reminders.CompleteReminder;

/// <summary>
/// Use case implementation for completing a reminder
/// </summary>
public class CompleteReminderUseCase : ICompleteReminderUseCase
{
    private readonly IReminderService _reminderService;
    private readonly ILogger<CompleteReminderUseCase> _logger;

    public CompleteReminderUseCase(
        IReminderService reminderService,
        ILogger<CompleteReminderUseCase> logger)
    {
        _reminderService = reminderService;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<CompleteReminderResponse> ExecuteAsync(int id, CompleteReminderRequest request, string username, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Completing reminder: {ReminderId} by {Username}", id, username);

            var result = await _reminderService.CompleteReminderAsync(id, request, username);

            _logger.LogInformation("Successfully completed reminder: {ReminderId}", id);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error completing reminder: {ReminderId}", id);
            throw;
        }
    }
}
