using FastEndpoints;
using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.ApiService.UseCase.ChurchMembers.GetChurchMemberStatuses;
using ChurchRegister.Database.Constants;

namespace ChurchRegister.ApiService.Endpoints.ChurchMembers;

/// <summary>
/// Endpoint for retrieving all available church member statuses
/// </summary>
public class GetChurchMemberStatusesEndpoint : EndpointWithoutRequest<IEnumerable<ChurchMemberStatusDto>>
{
    private readonly IGetChurchMemberStatusesUseCase _useCase;

    public GetChurchMemberStatusesEndpoint(IGetChurchMemberStatusesUseCase useCase)
    {
        _useCase = useCase;
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
            .WithTags("ChurchMembers"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var statuses = await _useCase.ExecuteAsync(ct);
        await SendOkAsync(statuses, ct);
    }
}
