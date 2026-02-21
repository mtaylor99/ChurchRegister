using ChurchRegister.ApiService.Models.Reminders;
using ChurchRegister.ApiService.Services.Reminders;

namespace ChurchRegister.ApiService.UseCase.Reminders;

public interface IGetDashboardReminderSummaryUseCase
{
    Task<DashboardReminderSummaryDto> ExecuteAsync();
}

public class GetDashboardReminderSummaryUseCase : IGetDashboardReminderSummaryUseCase
{
    private readonly IReminderService _service;

    public GetDashboardReminderSummaryUseCase(IReminderService service)
    {
        _service = service;
    }

    public Task<DashboardReminderSummaryDto> ExecuteAsync()
    {
        return _service.GetDashboardSummaryAsync();
    }
}
