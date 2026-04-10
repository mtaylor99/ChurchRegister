namespace ChurchRegister.ApiService.UseCase.Reminders.DeleteReminderCategory;

/// <summary>
/// Use case interface for deleting a reminder category
/// </summary>
public interface IDeleteReminderCategoryUseCase
{
    /// <summary>
    /// Executes the delete reminder category use case
    /// </summary>
    Task ExecuteAsync(int id, CancellationToken cancellationToken = default);
}
