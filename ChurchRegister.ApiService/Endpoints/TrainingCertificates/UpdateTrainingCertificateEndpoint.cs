using FastEndpoints;
using ChurchRegister.ApiService.Models.TrainingCertificates;
using ChurchRegister.ApiService.UseCase.TrainingCertificates.UpdateTrainingCertificate;
using ChurchRegister.Database.Constants;
using System.Security.Claims;

namespace ChurchRegister.ApiService.Endpoints.TrainingCertificates;

/// <summary>
/// Endpoint for updating an existing training certificate
/// </summary>
public class UpdateTrainingCertificateEndpoint : Endpoint<UpdateTrainingCertificateRequest, TrainingCertificateDto>
{
    private readonly IUpdateTrainingCertificateUseCase _useCase;

    public UpdateTrainingCertificateEndpoint(IUpdateTrainingCertificateUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Put("/api/training-certificates/{id}");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.TrainingCertificatesContributor, SystemRoles.TrainingCertificatesAdministrator);
        Description(x => x
            .WithName("UpdateTrainingCertificate")
            .WithSummary("Update an existing training certificate")
            .WithDescription("Updates training certificate information with the provided data")
            .WithTags("TrainingCertificates"));
    }

    public override async Task HandleAsync(UpdateTrainingCertificateRequest req, CancellationToken ct)
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
