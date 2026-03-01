using FastEndpoints;
using ChurchRegister.ApiService.Models.TrainingCertificates;
using ChurchRegister.ApiService.UseCase.TrainingCertificates.CreateTrainingCertificate;
using ChurchRegister.Database.Constants;
using System.Security.Claims;

namespace ChurchRegister.ApiService.Endpoints.TrainingCertificates;

/// <summary>
/// Endpoint for creating a new training certificate
/// </summary>
public class CreateTrainingCertificateEndpoint : Endpoint<CreateTrainingCertificateRequest, TrainingCertificateDto>
{
    private readonly ICreateTrainingCertificateUseCase _useCase;

    public CreateTrainingCertificateEndpoint(ICreateTrainingCertificateUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Post("/api/training-certificates");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.TrainingCertificatesContributor, SystemRoles.TrainingCertificatesAdministrator);
        Description(x => x
            .WithName("CreateTrainingCertificate")
            .WithSummary("Create a new training certificate")
            .WithDescription("Creates a new training certificate with the provided information")
            .WithTags("TrainingCertificates"));
    }

    public override async Task HandleAsync(CreateTrainingCertificateRequest req, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrEmpty(userId))
        {
            await SendUnauthorizedAsync(ct);
            return;
        }

        var result = await _useCase.ExecuteAsync(req, userId, ct);
        await SendCreatedAtAsync<GetTrainingCertificateByIdEndpoint>(
            new { id = result.Id },
            result,
            generateAbsoluteUrl: false,
            cancellation: ct);
    }
}
