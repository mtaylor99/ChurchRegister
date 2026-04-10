using ChurchRegister.ApiService.Models.Reminders;

namespace ChurchRegister.ApiService.UseCase.Reminders.GetReminders;

/// <summary>
/// Use case interface for retrieving a filtered list of reminders
/// </summary>
public interface IGetRemindersUseCase
{
    /// <summary>
    /// Executes the get reminders use case
    /// </summary>
    Task<List<ReminderDto>> ExecuteAsync(ReminderQueryParameters query, CancellationToken cancellationToken = default);
}
