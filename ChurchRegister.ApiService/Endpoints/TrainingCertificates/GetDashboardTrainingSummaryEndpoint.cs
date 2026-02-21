using FastEndpoints;
using ChurchRegister.ApiService.Models.TrainingCertificates;
using ChurchRegister.ApiService.UseCase.TrainingCertificates.GetDashboardTrainingSummary;
using ChurchRegister.Database.Constants;

namespace ChurchRegister.ApiService.Endpoints.TrainingCertificates;

/// <summary>
/// Endpoint for retrieving dashboard training summary with grouped alerts
/// </summary>
public class GetDashboardTrainingSummaryEndpoint : EndpointWithoutRequest<List<TrainingCertificateGroupSummaryDto>>
{
    private readonly IGetDashboardTrainingSummaryUseCase _useCase;

    public GetDashboardTrainingSummaryEndpoint(IGetDashboardTrainingSummaryUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Get("/api/dashboard/training-summary");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.TrainingCertificatesViewer, SystemRoles.TrainingCertificatesContributor, SystemRoles.TrainingCertificatesAdministrator);
        Description(x => x
            .WithName("GetDashboardTrainingSummary")
            .WithSummary("Get dashboard training summary")
            .WithDescription("Retrieves grouped training certificate alerts for the dashboard (5+ members threshold)")
            .WithTags("Dashboard", "TrainingCertificates"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var result = await _useCase.ExecuteAsync(ct);
        await SendOkAsync(result.ToList(), ct);
    }
}
