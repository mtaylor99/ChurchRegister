using ChurchRegister.ApiService.Models.Reminders;

namespace ChurchRegister.ApiService.UseCase.Reminders.CreateReminderCategory;

/// <summary>
/// Use case interface for creating a new reminder category
/// </summary>
public interface ICreateReminderCategoryUseCase
{
    /// <summary>
    /// Executes the create reminder category use case
    /// </summary>
    Task<ReminderCategoryDto> ExecuteAsync(CreateReminderCategoryRequest request, string username, CancellationToken cancellationToken = default);
}
