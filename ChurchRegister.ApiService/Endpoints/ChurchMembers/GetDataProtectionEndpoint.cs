using FastEndpoints;
using ChurchRegister.ApiService.Models;
using ChurchRegister.ApiService.Models.DataProtection;
using ChurchRegister.ApiService.UseCase.DataProtection;
using ChurchRegister.Database.Constants;

namespace ChurchRegister.ApiService.Endpoints.ChurchMembers;

/// <summary>
/// Request model for getting data protection consent
/// </summary>
public class GetDataProtectionRequest
{
    public int Id { get; set; }
}

/// <summary>
/// Endpoint for retrieving data protection consent information for a church member
/// </summary>
public class GetDataProtectionEndpoint : Endpoint<GetDataProtectionRequest, DataProtectionDto>
{
    private readonly IGetDataProtectionUseCase _useCase;

    public GetDataProtectionEndpoint(IGetDataProtectionUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Get("/api/church-members/{id}/data-protection");
        Policies("Bearer");
        Roles(
            SystemRoles.ChurchMembersViewer, 
            SystemRoles.ChurchMembersContributor, 
            SystemRoles.ChurchMembersAdministrator,
            SystemRoles.SystemAdministration);
        Description(x => x
            .WithName("GetDataProtection")
            .WithSummary("Get data protection consent for a church member")
            .WithDescription("Retrieves GDPR data protection consent preferences for a specific church member")
            .WithTags("ChurchMembers", "DataProtection"));
    }

    public override async Task HandleAsync(GetDataProtectionRequest req, CancellationToken ct)
    {
        var dataProtection = await _useCase.ExecuteAsync(req.Id, ct);

        if (dataProtection == null)
        {
            await SendNotFoundAsync(ct);
            return;
        }

        await SendOkAsync(dataProtection, ct);
    }
}
