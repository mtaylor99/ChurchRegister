using ChurchRegister.ApiService.Models.Reminders;

namespace ChurchRegister.ApiService.UseCase.Reminders.CreateReminder;

/// <summary>
/// Use case interface for creating a new reminder
/// </summary>
public interface ICreateReminderUseCase
{
    /// <summary>
    /// Executes the create reminder use case
    /// </summary>
    Task<ReminderDto> ExecuteAsync(CreateReminderRequest request, string username, CancellationToken cancellationToken = default);
}
