using FastEndpoints;
using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.ApiService.UseCase.ChurchMembers.GetChurchMemberRoles;
using ChurchRegister.Database.Constants;

namespace ChurchRegister.ApiService.Endpoints.ChurchMembers;

/// <summary>
/// Empty request class for endpoints that don't require parameters
/// </summary>
public class EmptyRequest { }

/// <summary>
/// Endpoint for retrieving all available church member role types
/// </summary>
public class GetChurchMemberRolesEndpoint : EndpointWithoutRequest<IEnumerable<ChurchMemberRoleDto>>
{
    private readonly IGetChurchMemberRolesUseCase _useCase;

    public GetChurchMemberRolesEndpoint(IGetChurchMemberRolesUseCase useCase)
    {
        _useCase = useCase;
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
            .WithTags("ChurchMembers"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var roles = await _useCase.ExecuteAsync(ct);
        await SendOkAsync(roles, ct);
    }
}
