using FastEndpoints;
using ChurchRegister.ApiService.UseCase.TrainingCertificates.DeleteTrainingCertificate;
using ChurchRegister.Database.Constants;

namespace ChurchRegister.ApiService.Endpoints.TrainingCertificates;

/// <summary>
/// Request model for deleting a training certificate
/// </summary>
public record DeleteTrainingCertificateRequest
{
    public int Id { get; init; }
}

/// <summary>
/// Endpoint for deleting a training certificate
/// </summary>
public class DeleteTrainingCertificateEndpoint : Endpoint<DeleteTrainingCertificateRequest>
{
    private readonly IDeleteTrainingCertificateUseCase _useCase;

    public DeleteTrainingCertificateEndpoint(IDeleteTrainingCertificateUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Delete("/api/training-certificates/{Id}");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.TrainingCertificatesAdministrator);
        Description(x => x
            .WithName("DeleteTrainingCertificate")
            .WithSummary("Delete a training certificate")
            .WithDescription("Removes a training certificate record from the system")
            .WithTags("TrainingCertificates"));
    }

    public override async Task HandleAsync(DeleteTrainingCertificateRequest req, CancellationToken ct)
    {
        try
        {
            await _useCase.ExecuteAsync(req.Id, ct);
            await Send.NoContentAsync(ct);
        }
        catch (KeyNotFoundException)
        {
            await Send.NotFoundAsync(ct);
        }
    }
}
