using FastEndpoints;
using ChurchRegister.ApiService.Models.Administration;
using ChurchRegister.ApiService.Services;
using ChurchRegister.Database.Constants;

namespace ChurchRegister.ApiService.Endpoints.Administration;

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
    private readonly IChurchMemberService _churchMemberService;

    public GetChurchMemberByIdEndpoint(IChurchMemberService churchMemberService)
    {
        _churchMemberService = churchMemberService;
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
            .WithTags("Church Members"));
    }

    public override async Task HandleAsync(GetChurchMemberByIdRequest req, CancellationToken ct)
    {
        try
        {
            var member = await _churchMemberService.GetChurchMemberByIdAsync(req.Id, ct);

            if (member == null)
            {
                await SendNotFoundAsync(ct);
                return;
            }

            await SendOkAsync(member, ct);
        }
        catch (Exception ex)
        {
            ThrowError($"Error retrieving church member: {ex.Message}");
        }
    }
}
