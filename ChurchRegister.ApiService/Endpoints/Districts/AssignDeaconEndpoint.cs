using FastEndpoints;
using ChurchRegister.ApiService.Models.Districts;
using ChurchRegister.ApiService.Services.Districts;
using ChurchRegister.Database.Constants;

namespace ChurchRegister.ApiService.Endpoints.Districts;

/// <summary>
/// Endpoint for assigning a deacon to a district
/// </summary>
public class AssignDeaconEndpoint : Endpoint<AssignDeaconRequest>
{
    private readonly IDistrictService _districtService;
    private readonly ILogger<AssignDeaconEndpoint> _logger;

    public AssignDeaconEndpoint(IDistrictService districtService, ILogger<AssignDeaconEndpoint> logger)
    {
        _districtService = districtService;
        _logger = logger;
    }

    public override void Configure()
    {
        Put("/api/districts/{districtId}/assign-deacon");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.ChurchMembersContributor, SystemRoles.ChurchMembersAdministrator);
        Description(x => x
            .WithName("AssignDeacon")
            .WithSummary("Assign a deacon to a district")
            .WithDescription("Assigns an active church member with Deacon role to a specific district. Pass null DeaconId to unassign.")
            .WithTags("Districts"));
    }

    public override async Task HandleAsync(AssignDeaconRequest req, CancellationToken ct)
    {
        try
        {
            var districtId = Route<int>("districtId");
            await _districtService.AssignDeaconAsync(districtId, req.DeaconId);
            await SendNoContentAsync(ct);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation while assigning deacon");
            await SendAsync(new { error = ex.Message }, 400, ct);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid argument while assigning deacon");
            await SendAsync(new { error = ex.Message }, 400, ct);
        }
    }
}
