using ChurchRegister.ApiService.Models.Administration;
using ChurchRegister.ApiService.Services;
using FastEndpoints;

namespace ChurchRegister.ApiService.Endpoints.Administration;

/// <summary>
/// Endpoint to retrieve dashboard statistics for church members
/// </summary>
public class GetDashboardStatisticsEndpoint : EndpointWithoutRequest<DashboardStatisticsResponse>
{
    private readonly IChurchMemberService _churchMemberService;

    public GetDashboardStatisticsEndpoint(IChurchMemberService churchMemberService)
    {
        _churchMemberService = churchMemberService;
    }

    public override void Configure()
    {
        Get("/api/dashboard/statistics");
        Policies("Bearer");
        Description(x => x
            .WithName("GetDashboardStatistics")
            .WithSummary("Get dashboard statistics")
            .WithDescription("Retrieve dashboard statistics including total members, new members, and growth metrics")
            .WithTags("Dashboard", "Administration"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var statistics = await _churchMemberService.GetDashboardStatisticsAsync(ct);
        await SendOkAsync(statistics, ct);
    }
}
