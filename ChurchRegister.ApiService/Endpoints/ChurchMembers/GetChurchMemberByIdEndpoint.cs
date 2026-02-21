using FastEndpoints;
using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.ApiService.UseCase.ChurchMembers.GetChurchMemberById;
using ChurchRegister.Database.Constants;

namespace ChurchRegister.ApiService.Endpoints.ChurchMembers;

/// <summary>
/// Request model for getting a church member by ID
/// </summary>
public class GetChurchMemberByIdRequest
{
    public int Id { get; set; }
}

/// <summary>
/// Endpoint for retrieving a specific church member by ID
/// </summary>
public class GetChurchMemberByIdEndpoint : Endpoint<GetChurchMemberByIdRequest, ChurchMemberDetailDto>
{
    private readonly IGetChurchMemberByIdUseCase _useCase;

    public GetChurchMemberByIdEndpoint(IGetChurchMemberByIdUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Get("/api/church-members/{id}");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.ChurchMembersViewer, SystemRoles.ChurchMembersContributor, SystemRoles.ChurchMembersAdministrator);
        Description(x => x
            .WithName("GetChurchMemberById")
            .WithSummary("Get a church member by ID")
            .WithDescription("Retrieves detailed information about a specific church member")
            .WithTags("ChurchMembers"));
    }

    public override async Task HandleAsync(GetChurchMemberByIdRequest req, CancellationToken ct)
    {
        var member = await _useCase.ExecuteAsync(req.Id, ct);

        if (member == null)
        {
            await SendNotFoundAsync(ct);
            return;
        }

        await SendOkAsync(member, ct);
    }
}
