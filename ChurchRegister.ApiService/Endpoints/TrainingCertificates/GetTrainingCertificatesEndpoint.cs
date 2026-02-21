using FastEndpoints;
using ChurchRegister.ApiService.Models;
using ChurchRegister.ApiService.Models.TrainingCertificates;
using ChurchRegister.ApiService.UseCase.TrainingCertificates.GetTrainingCertificates;
using ChurchRegister.Database.Constants;

namespace ChurchRegister.ApiService.Endpoints.TrainingCertificates;

/// <summary>
/// Endpoint for retrieving training certificates with pagination, search, and filtering
/// </summary>
public class GetTrainingCertificatesEndpoint : Endpoint<TrainingCertificateGridQuery, PagedResult<TrainingCertificateDto>>
{
    private readonly IGetTrainingCertificatesUseCase _useCase;

    public GetTrainingCertificatesEndpoint(IGetTrainingCertificatesUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Get("/api/training-certificates");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.TrainingCertificatesViewer, SystemRoles.TrainingCertificatesContributor, SystemRoles.TrainingCertificatesAdministrator);
        Description(x => x
            .WithName("GetTrainingCertificates")
            .WithSummary("Get training certificates with pagination, search, and filtering")
            .WithDescription("Retrieves a paginated list of training certificates with optional search and filtering capabilities")
            .WithTags("TrainingCertificates"));
    }

    public override async Task HandleAsync(TrainingCertificateGridQuery req, CancellationToken ct)
    {
        var result = await _useCase.ExecuteAsync(req, ct);
        await SendOkAsync(result, ct);
    }
}
