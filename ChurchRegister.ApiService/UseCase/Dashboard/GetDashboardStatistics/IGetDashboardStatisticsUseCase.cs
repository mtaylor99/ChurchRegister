using ChurchRegister.ApiService.Models.Dashboard;

namespace ChurchRegister.ApiService.UseCase.Dashboard.GetDashboardStatistics;

public interface IGetDashboardStatisticsUseCase
{
    Task<DashboardStatisticsResponse> ExecuteAsync(CancellationToken cancellationToken = default);
}
