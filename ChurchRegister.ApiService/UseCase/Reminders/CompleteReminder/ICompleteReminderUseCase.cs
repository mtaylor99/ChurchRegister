using ChurchRegister.ApiService.Models.Reminders;

namespace ChurchRegister.ApiService.UseCase.Reminders.CompleteReminder;

/// <summary>
/// Use case interface for completing a reminder
/// </summary>
public interface ICompleteReminderUseCase
{
    /// <summary>
    /// Executes the complete reminder use case
    /// </summary>
    Task<CompleteReminderResponse> ExecuteAsync(int id, CompleteReminderRequest request, string username, CancellationToken cancellationToken = default);
}
