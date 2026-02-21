using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.ApiService.Models.Security;
using ChurchRegister.ApiService.Models.Attendance;
using ChurchRegister.ApiService.Models.Dashboard;
using ChurchRegister.ApiService.Services.ChurchMembers;
using ChurchRegister.ApiService.Services.Contributions;
using ChurchRegister.ApiService.Services.Security;
using ChurchRegister.ApiService.UseCase.Dashboard.GetDashboardStatistics;
using FastEndpoints;

namespace ChurchRegister.ApiService.Endpoints.Dashboard;

/// <summary>
/// Endpoint to retrieve dashboard statistics for church members
/// </summary>
public class GetDashboardStatisticsEndpoint : EndpointWithoutRequest<DashboardStatisticsResponse>
{
    private readonly IGetDashboardStatisticsUseCase _useCase;

    public GetDashboardStatisticsEndpoint(IGetDashboardStatisticsUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Get("/api/dashboard/statistics");
        Policies("Bearer");
        Description(x => x
            .WithName("GetDashboardStatistics")
            .WithSummary("Get dashboard statistics")
            .WithDescription("Retrieve dashboard statistics including total members, new members, and growth metrics")
            .WithTags("Dashboard"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var statistics = await _useCase.ExecuteAsync(ct);
        await SendOkAsync(statistics, ct);
    }
}
