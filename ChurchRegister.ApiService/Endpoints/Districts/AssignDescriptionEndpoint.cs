using FastEndpoints;
using ChurchRegister.ApiService.Models.Districts;
using ChurchRegister.ApiService.Services.Districts;
using ChurchRegister.Database.Constants;

namespace ChurchRegister.ApiService.Endpoints.Districts;

/// <summary>
/// Endpoint for assigning a description to a district
/// </summary>
public class AssignDescriptionEndpoint : Endpoint<AssignDescriptionRequest>
{
    private readonly IDistrictService _districtService;
    private readonly ILogger<AssignDescriptionEndpoint> _logger;

    public AssignDescriptionEndpoint(IDistrictService districtService, ILogger<AssignDescriptionEndpoint> logger)
    {
        _districtService = districtService;
        _logger = logger;
    }

    public override void Configure()
    {
        Put("/api/districts/{districtId}/assign-description");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.ChurchMembersContributor, SystemRoles.ChurchMembersAdministrator);
        Description(x => x
            .WithName("AssignDescription")
            .WithSummary("Assign a description to a district")
            .WithDescription("Sets an optional description for a district. Pass null Description to clear.")
            .WithTags("Districts"));
    }

    public override async Task HandleAsync(AssignDescriptionRequest req, CancellationToken ct)
    {
        try
        {
            var districtId = Route<int>("districtId");
            await _districtService.AssignDescriptionAsync(districtId, req.Description);
            await Send.NoContentAsync(ct);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "District not found while assigning description");
            await Send.ResponseAsync(new { error = ex.Message }, 404, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning description to district");
            await Send.ResponseAsync(new { error = ex.Message }, 500, ct);
        }
    }
}
