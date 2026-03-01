using ChurchRegister.ApiService.Models.Reminders;

namespace ChurchRegister.ApiService.UseCase.Reminders.GetReminderCategoryById;

/// <summary>
/// Use case interface for retrieving a single reminder category by ID
/// </summary>
public interface IGetReminderCategoryByIdUseCase
{
    /// <summary>
    /// Executes the get reminder category by ID use case
    /// </summary>
    Task<ReminderCategoryDto> ExecuteAsync(int id, CancellationToken cancellationToken = default);
}
