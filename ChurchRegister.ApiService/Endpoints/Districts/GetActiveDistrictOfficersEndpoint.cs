using FastEndpoints;
using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.ApiService.Services.Districts;
using ChurchRegister.Database.Constants;

namespace ChurchRegister.ApiService.Endpoints.Districts;

/// <summary>
/// Request for filtering district officers by excluding a specific member
/// </summary>
public class GetActiveDistrictOfficersRequest
{
    /// <summary>
    /// Optional member ID to exclude from results (typically the current deacon being excluded)
    /// </summary>
    public int? ExcludeMemberId { get; set; }
}

/// <summary>
/// Endpoint for retrieving active church members with District Officer role
/// </summary>
public class GetActiveDistrictOfficersEndpoint : Endpoint<GetActiveDistrictOfficersRequest, List<ChurchMemberSummaryDto>>
{
    private readonly IDistrictService _districtService;

    public GetActiveDistrictOfficersEndpoint(IDistrictService districtService)
    {
        _districtService = districtService;
    }

    public override void Configure()
    {
        Get("/api/districts/district-officers");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.ChurchMembersContributor, SystemRoles.ChurchMembersAdministrator);
        Description(x => x
            .WithName("GetActiveDistrictOfficers")
            .WithSummary("Get all active district officers")
            .WithDescription("Retrieves a list of active church members with District Officer role for assignment to districts. Optionally exclude a specific member ID.")
            .WithTags("Districts"));
    }

    public override async Task HandleAsync(GetActiveDistrictOfficersRequest req, CancellationToken ct)
    {
        var officers = await _districtService.GetActiveDistrictOfficersAsync(req.ExcludeMemberId);
        await SendOkAsync(officers, ct);
    }
}
