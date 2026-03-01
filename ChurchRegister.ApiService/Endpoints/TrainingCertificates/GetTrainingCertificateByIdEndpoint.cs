using FastEndpoints;
using ChurchRegister.ApiService.Models.TrainingCertificates;
using ChurchRegister.ApiService.UseCase.TrainingCertificates.GetTrainingCertificateById;
using ChurchRegister.Database.Constants;

namespace ChurchRegister.ApiService.Endpoints.TrainingCertificates;

/// <summary>
/// Request for getting a training certificate by ID
/// </summary>
public class GetTrainingCertificateByIdRequest
{
    public int Id { get; set; }
}

/// <summary>
/// Endpoint for retrieving a training certificate by ID
/// </summary>
public class GetTrainingCertificateByIdEndpoint : Endpoint<GetTrainingCertificateByIdRequest, TrainingCertificateDto>
{
    private readonly IGetTrainingCertificateByIdUseCase _useCase;

    public GetTrainingCertificateByIdEndpoint(IGetTrainingCertificateByIdUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Get("/api/training-certificates/{id}");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.TrainingCertificatesViewer, SystemRoles.TrainingCertificatesContributor, SystemRoles.TrainingCertificatesAdministrator);
        Description(x => x
            .WithName("GetTrainingCertificateById")
            .WithSummary("Get a training certificate by ID")
            .WithDescription("Retrieves a single training certificate by its unique identifier")
            .WithTags("TrainingCertificates"));
    }

    public override async Task HandleAsync(GetTrainingCertificateByIdRequest req, CancellationToken ct)
    {
        var result = await _useCase.ExecuteAsync(req.Id, ct);

        if (result == null)
        {
            await SendNotFoundAsync(ct);
            return;
        }

        await SendOkAsync(result, ct);
    }
}
