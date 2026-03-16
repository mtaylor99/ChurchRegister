using ChurchRegister.ApiService.Models.Reminders;

namespace ChurchRegister.ApiService.UseCase.Reminders.GetDashboardReminderSummary;

/// <summary>
/// Use case interface for retrieving the dashboard reminder summary
/// </summary>
public interface IGetDashboardReminderSummaryUseCase
{
    /// <summary>
    /// Executes the get dashboard reminder summary use case
    /// </summary>
    Task<DashboardReminderSummaryDto> ExecuteAsync(CancellationToken cancellationToken = default);
}
