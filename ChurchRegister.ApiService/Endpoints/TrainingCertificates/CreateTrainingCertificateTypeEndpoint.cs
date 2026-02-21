using FastEndpoints;
using ChurchRegister.ApiService.Models.TrainingCertificates;
using ChurchRegister.ApiService.UseCase.TrainingCertificates.CreateTrainingCertificateType;
using ChurchRegister.Database.Constants;
using System.Security.Claims;

namespace ChurchRegister.ApiService.Endpoints.TrainingCertificates;

/// <summary>
/// Endpoint for creating a new training certificate type
/// </summary>
public class CreateTrainingCertificateTypeEndpoint : Endpoint<CreateTrainingCertificateTypeRequest, TrainingCertificateTypeDto>
{
    private readonly ICreateTrainingCertificateTypeUseCase _useCase;

    public CreateTrainingCertificateTypeEndpoint(ICreateTrainingCertificateTypeUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Post("/api/training-certificate-types");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.TrainingCertificatesAdministrator);
        Description(x => x
            .WithName("CreateTrainingCertificateType")
            .WithSummary("Create a new training certificate type")
            .WithDescription("Creates a new training certificate type (Administrator only)")
            .WithTags("TrainingCertificates"));
    }

    public override async Task HandleAsync(CreateTrainingCertificateTypeRequest req, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        
        if (string.IsNullOrEmpty(userId))
        {
            await SendUnauthorizedAsync(ct);
            return;
        }

        var result = await _useCase.ExecuteAsync(req, userId, ct);
        await SendOkAsync(result, ct);
    }
}
