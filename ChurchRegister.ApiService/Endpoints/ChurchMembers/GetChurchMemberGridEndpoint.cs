using FastEndpoints;
using ChurchRegister.ApiService.Models;
using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.ApiService.UseCase.ChurchMembers.GetChurchMemberGrid;
using ChurchRegister.Database.Constants;

namespace ChurchRegister.ApiService.Endpoints.ChurchMembers;

/// <summary>
/// Endpoint for the members grid: lists only members holding a register number for the current year
/// </summary>
public class GetChurchMemberGridEndpoint : Endpoint<ChurchMemberGridQuery, PagedResult<ChurchMemberDto>>
{
    private readonly IGetChurchMemberGridUseCase _useCase;

    public GetChurchMemberGridEndpoint(IGetChurchMemberGridUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Get("/api/church-members/grid");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.ChurchMembersViewer, SystemRoles.ChurchMembersContributor, SystemRoles.ChurchMembersAdministrator);
        Description(x => x
            .WithName("GetChurchMemberGrid")
            .WithSummary("Get church members for the members grid")
            .WithDescription("Retrieves a paginated list of members holding a register number for the current year, with optional search and filtering")
            .WithTags("ChurchMembers"));
    }

    public override async Task HandleAsync(ChurchMemberGridQuery req, CancellationToken ct)
    {
        var result = await _useCase.ExecuteAsync(req, ct);
        await Send.OkAsync(result, ct);
    }
}
