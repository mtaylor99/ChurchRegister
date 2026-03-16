using ChurchRegister.ApiService.Models.Reminders;

namespace ChurchRegister.ApiService.UseCase.Reminders.UpdateReminderCategory;

/// <summary>
/// Use case interface for updating an existing reminder category
/// </summary>
public interface IUpdateReminderCategoryUseCase
{
    /// <summary>
    /// Executes the update reminder category use case
    /// </summary>
    Task<ReminderCategoryDto> ExecuteAsync(int id, UpdateReminderCategoryRequest request, string username, CancellationToken cancellationToken = default);
}
