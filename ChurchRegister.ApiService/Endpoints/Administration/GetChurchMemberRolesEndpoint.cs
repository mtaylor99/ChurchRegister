using FastEndpoints;
using ChurchRegister.ApiService.Models.Administration;
using ChurchRegister.ApiService.Services;
using ChurchRegister.Database.Constants;

namespace ChurchRegister.ApiService.Endpoints.Administration;

/// <summary>
/// Empty request class for endpoints that don't require parameters
/// </summary>
public class EmptyRequest { }

/// <summary>
/// Endpoint for retrieving all available church member role types
/// </summary>
public class GetChurchMemberRolesEndpoint : EndpointWithoutRequest<IEnumerable<ChurchMemberRoleDto>>
{
    private readonly IChurchMemberService _churchMemberService;

    public GetChurchMemberRolesEndpoint(IChurchMemberService churchMemberService)
    {
        _churchMemberService = churchMemberService;
    }

    public override void Configure()
    {
        Get("/api/church-members/roles");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.ChurchMembersViewer, SystemRoles.ChurchMembersContributor, SystemRoles.ChurchMembersAdministrator);
        Description(x => x
            .WithName("GetChurchMemberRoles")
            .WithSummary("Get all church member role types")
            .WithDescription("Retrieves a list of all available church member role types")
            .WithTags("Church Members"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        try
        {
            var roles = await _churchMemberService.GetRolesAsync(ct);
            await SendOkAsync(roles, ct);
        }
        catch (Exception ex)
        {
            ThrowError($"Error retrieving church member roles: {ex.Message}");
        }
    }
}
