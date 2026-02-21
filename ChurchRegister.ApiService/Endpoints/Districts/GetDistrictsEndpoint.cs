using FastEndpoints;
using ChurchRegister.ApiService.Models.Districts;
using ChurchRegister.ApiService.UseCase.Districts;
using ChurchRegister.Database.Constants;

namespace ChurchRegister.ApiService.Endpoints.Districts;

/// <summary>
/// Endpoint for retrieving all available church districts
/// </summary>
public class GetDistrictsEndpoint : EndpointWithoutRequest<List<DistrictDto>>
{
    private readonly IGetDistrictsUseCase _useCase;

    public GetDistrictsEndpoint(IGetDistrictsUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Get("/api/districts");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.ChurchMembersViewer, SystemRoles.ChurchMembersContributor, SystemRoles.ChurchMembersAdministrator);
        Description(x => x
            .WithName("GetDistricts")
            .WithSummary("Get all church districts")
            .WithDescription("Retrieves a list of all available church districts (A-L)")
            .WithTags("Districts"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var districts = await _useCase.ExecuteAsync(ct);
        await SendOkAsync(districts, ct);
    }
}
