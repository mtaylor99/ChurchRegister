using ChurchRegister.ApiService.Models.Reminders;

namespace ChurchRegister.ApiService.UseCase.Reminders.GetReminderById;

/// <summary>
/// Use case interface for retrieving a single reminder by ID
/// </summary>
public interface IGetReminderByIdUseCase
{
    /// <summary>
    /// Executes the get reminder by ID use case
    /// </summary>
    Task<ReminderDto> ExecuteAsync(int id, CancellationToken cancellationToken = default);
}
