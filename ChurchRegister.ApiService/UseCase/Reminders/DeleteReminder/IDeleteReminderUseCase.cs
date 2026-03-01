namespace ChurchRegister.ApiService.UseCase.Reminders.DeleteReminder;

/// <summary>
/// Use case interface for deleting a reminder
/// </summary>
public interface IDeleteReminderUseCase
{
    /// <summary>
    /// Executes the delete reminder use case
    /// </summary>
    Task ExecuteAsync(int id, CancellationToken cancellationToken = default);
}
