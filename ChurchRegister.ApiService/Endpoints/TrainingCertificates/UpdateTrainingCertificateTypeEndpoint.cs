using FastEndpoints;
using ChurchRegister.ApiService.Models.TrainingCertificates;
using ChurchRegister.ApiService.UseCase.TrainingCertificates.UpdateTrainingCertificateType;
using ChurchRegister.Database.Constants;
using System.Security.Claims;

namespace ChurchRegister.ApiService.Endpoints.TrainingCertificates;

/// <summary>
/// Endpoint for updating an existing training certificate type
/// </summary>
public class UpdateTrainingCertificateTypeEndpoint : Endpoint<UpdateTrainingCertificateTypeRequest, TrainingCertificateTypeDto>
{
    private readonly IUpdateTrainingCertificateTypeUseCase _useCase;

    public UpdateTrainingCertificateTypeEndpoint(IUpdateTrainingCertificateTypeUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Put("/api/training-certificate-types/{id}");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.TrainingCertificatesAdministrator);
        Description(x => x
            .WithName("UpdateTrainingCertificateType")
            .WithSummary("Update an existing training certificate type")
            .WithDescription("Updates training certificate type information (Administrator only, edit-only no delete)")
            .WithTags("TrainingCertificates"));
    }

    public override async Task HandleAsync(UpdateTrainingCertificateTypeRequest req, CancellationToken ct)
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
