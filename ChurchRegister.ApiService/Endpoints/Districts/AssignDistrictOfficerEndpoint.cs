using FastEndpoints;
using ChurchRegister.ApiService.Models.Districts;
using ChurchRegister.ApiService.Services.Districts;
using ChurchRegister.Database.Constants;

namespace ChurchRegister.ApiService.Endpoints.Districts;

/// <summary>
/// Endpoint for assigning a district officer to a district
/// </summary>
public class AssignDistrictOfficerEndpoint : Endpoint<AssignDistrictOfficerRequest>
{
    private readonly IDistrictService _districtService;
    private readonly ILogger<AssignDistrictOfficerEndpoint> _logger;

    public AssignDistrictOfficerEndpoint(IDistrictService districtService, ILogger<AssignDistrictOfficerEndpoint> logger)
    {
        _districtService = districtService;
        _logger = logger;
    }

    public override void Configure()
    {
        Put("/api/districts/{districtId}/assign-district-officer");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.ChurchMembersContributor, SystemRoles.ChurchMembersAdministrator);
        Description(x => x
            .WithName("AssignDistrictOfficer")
            .WithSummary("Assign a district officer to a district")
            .WithDescription("Assigns an active church member with District Officer role to a specific district. Pass null DistrictOfficerId to unassign. Requires a deacon to be assigned first.")
            .WithTags("Districts"));
    }

    public override async Task HandleAsync(AssignDistrictOfficerRequest req, CancellationToken ct)
    {
        try
        {
            var districtId = Route<int>("districtId");
            await _districtService.AssignDistrictOfficerAsync(districtId, req.DistrictOfficerId);
            await SendNoContentAsync(ct);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation while assigning district officer");
            await SendAsync(new { error = ex.Message }, 400, ct);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid argument while assigning district officer");
            await SendAsync(new { error = ex.Message }, 400, ct);
        }
    }
}
