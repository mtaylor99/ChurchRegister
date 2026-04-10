using ChurchRegister.ApiService.Models.Reminders;

namespace ChurchRegister.ApiService.UseCase.Reminders.UpdateReminder;

/// <summary>
/// Use case interface for updating an existing reminder
/// </summary>
public interface IUpdateReminderUseCase
{
    /// <summary>
    /// Executes the update reminder use case
    /// </summary>
    Task<ReminderDto> ExecuteAsync(int id, UpdateReminderRequest request, string username, CancellationToken cancellationToken = default);
}
