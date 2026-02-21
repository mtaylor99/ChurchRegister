using FastEndpoints;
using ChurchRegister.ApiService.Models.TrainingCertificates;
using ChurchRegister.ApiService.UseCase.TrainingCertificates.GetTrainingCertificateTypes;
using ChurchRegister.Database.Constants;

namespace ChurchRegister.ApiService.Endpoints.TrainingCertificates;

/// <summary>
/// Request for getting training certificate types with optional status filter
/// </summary>
public class GetTrainingCertificateTypesRequest
{
    public string? StatusFilter { get; set; }
}

/// <summary>
/// Endpoint for retrieving all training certificate types
/// </summary>
public class GetTrainingCertificateTypesEndpoint : Endpoint<GetTrainingCertificateTypesRequest, List<TrainingCertificateTypeDto>>
{
    private readonly IGetTrainingCertificateTypesUseCase _useCase;

    public GetTrainingCertificateTypesEndpoint(IGetTrainingCertificateTypesUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Get("/api/training-certificate-types");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.TrainingCertificatesViewer, SystemRoles.TrainingCertificatesContributor, SystemRoles.TrainingCertificatesAdministrator);
        Description(x => x
            .WithName("GetTrainingCertificateTypes")
            .WithSummary("Get all training certificate types")
            .WithDescription("Retrieves all training certificate types with optional status filter (Active, InActive)")
            .WithTags("TrainingCertificates"));
    }

    public override async Task HandleAsync(GetTrainingCertificateTypesRequest req, CancellationToken ct)
    {
        var result = await _useCase.ExecuteAsync(req.StatusFilter, ct);
        await SendOkAsync(result.ToList(), ct);
    }
}
