using FastEndpoints;
using ChurchRegister.ApiService.Models.Administration;
using ChurchRegister.ApiService.Services;
using ChurchRegister.Database.Constants;

namespace ChurchRegister.ApiService.Endpoints.Administration;

/// <summary>
/// Endpoint for retrieving all available church member statuses
/// </summary>
public class GetChurchMemberStatusesEndpoint : EndpointWithoutRequest<IEnumerable<ChurchMemberStatusDto>>
{
    private readonly IChurchMemberService _churchMemberService;

    public GetChurchMemberStatusesEndpoint(IChurchMemberService churchMemberService)
    {
        _churchMemberService = churchMemberService;
    }

    public override void Configure()
    {
        Get("/api/church-members/statuses");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.ChurchMembersViewer, SystemRoles.ChurchMembersContributor, SystemRoles.ChurchMembersAdministrator);
        Description(x => x
            .WithName("GetChurchMemberStatuses")
            .WithSummary("Get all church member statuses")
            .WithDescription("Retrieves a list of all available church member statuses")
            .WithTags("Church Members"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        try
        {
            var statuses = await _churchMemberService.GetStatusesAsync(ct);
            await SendOkAsync(statuses, ct);
        }
        catch (Exception ex)
        {
            ThrowError($"Error retrieving church member statuses: {ex.Message}");
        }
    }
}
