using FastEndpoints;
using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.ApiService.Services.Districts;
using ChurchRegister.Database.Constants;

namespace ChurchRegister.ApiService.Endpoints.Districts;

/// <summary>
/// Endpoint for retrieving active church members with Deacon role
/// </summary>
public class GetActiveDeaconsEndpoint : EndpointWithoutRequest<List<ChurchMemberSummaryDto>>
{
    private readonly IDistrictService _districtService;

    public GetActiveDeaconsEndpoint(IDistrictService districtService)
    {
        _districtService = districtService;
    }

    public override void Configure()
    {
        Get("/api/districts/deacons");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.ChurchMembersContributor, SystemRoles.ChurchMembersAdministrator);
        Description(x => x
            .WithName("GetActiveDeacons")
            .WithSummary("Get all active deacons")
            .WithDescription("Retrieves a list of active church members with Deacon role for assignment to districts")
            .WithTags("Districts"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var deacons = await _districtService.GetActiveDeaconsAsync();
        await SendOkAsync(deacons, ct);
    }
}
