using ChurchRegister.ApiService.Models.Reminders;
using ChurchRegister.ApiService.Services.Reminders;

namespace ChurchRegister.ApiService.UseCase.Reminders.GetDashboardReminderSummary;

/// <summary>
/// Use case implementation for retrieving the dashboard reminder summary
/// </summary>
public class GetDashboardReminderSummaryUseCase : IGetDashboardReminderSummaryUseCase
{
    private readonly IReminderService _reminderService;
    private readonly ILogger<GetDashboardReminderSummaryUseCase> _logger;

    public GetDashboardReminderSummaryUseCase(
        IReminderService reminderService,
        ILogger<GetDashboardReminderSummaryUseCase> logger)
    {
        _reminderService = reminderService;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<DashboardReminderSummaryDto> ExecuteAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Getting dashboard reminder summary");

            var result = await _reminderService.GetDashboardSummaryAsync();

            _logger.LogInformation("Successfully retrieved dashboard reminder summary");

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving dashboard reminder summary");
            throw;
        }
    }
}
