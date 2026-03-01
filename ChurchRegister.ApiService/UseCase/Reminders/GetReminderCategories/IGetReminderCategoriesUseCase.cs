using ChurchRegister.ApiService.Models.Reminders;

namespace ChurchRegister.ApiService.UseCase.Reminders.GetReminderCategories;

/// <summary>
/// Use case interface for retrieving all reminder categories
/// </summary>
public interface IGetReminderCategoriesUseCase
{
    /// <summary>
    /// Executes the get reminder categories use case
    /// </summary>
    Task<List<ReminderCategoryDto>> ExecuteAsync(CancellationToken cancellationToken = default);
}
