using FastEndpoints;
using ChurchRegister.ApiService.Models;
using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.ApiService.UseCase.ChurchMembers.GetChurchMembers;
using ChurchRegister.Database.Constants;

namespace ChurchRegister.ApiService.Endpoints.ChurchMembers;

/// <summary>
/// Endpoint for retrieving church members with pagination, search, and filtering
/// </summary>
public class GetChurchMembersEndpoint : Endpoint<ChurchMemberGridQuery, PagedResult<ChurchMemberDto>>
{
    private readonly IGetChurchMembersUseCase _useCase;

    public GetChurchMembersEndpoint(IGetChurchMembersUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Get("/api/church-members");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.ChurchMembersViewer, SystemRoles.ChurchMembersContributor, SystemRoles.ChurchMembersAdministrator);
        Description(x => x
            .WithName("GetChurchMembers")
            .WithSummary("Get church members with pagination, search, and filtering")
            .WithDescription("Retrieves a paginated list of church members with optional search and filtering capabilities")
            .WithTags("ChurchMembers"));
    }

    public override async Task HandleAsync(ChurchMemberGridQuery req, CancellationToken ct)
    {
        var result = await _useCase.ExecuteAsync(req, ct);
        await SendOkAsync(result, ct);
    }
}
