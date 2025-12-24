using FastEndpoints;
using ChurchRegister.ApiService.Models.Administration;
using ChurchRegister.ApiService.Services;
using ChurchRegister.Database.Constants;

namespace ChurchRegister.ApiService.Endpoints.Administration;

/// <summary>
/// Endpoint for retrieving church members with pagination, search, and filtering
/// </summary>
public class GetChurchMembersEndpoint : Endpoint<ChurchMemberGridQuery, PagedResult<ChurchMemberDto>>
{
    private readonly IChurchMemberService _churchMemberService;

    public GetChurchMembersEndpoint(IChurchMemberService churchMemberService)
    {
        _churchMemberService = churchMemberService;
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
            .WithTags("Church Members"));
    }

    public override async Task HandleAsync(ChurchMemberGridQuery req, CancellationToken ct)
    {
        try
        {
            var result = await _churchMemberService.GetChurchMembersAsync(req, ct);
            await SendOkAsync(result, ct);
        }
        catch (Exception ex)
        {
            await SendAsync(new PagedResult<ChurchMemberDto>
            {
                Items = Enumerable.Empty<ChurchMemberDto>(),
                TotalCount = 0,
                PageSize = req.PageSize,
                CurrentPage = req.Page
            }, 500, ct);

            ThrowError($"Error retrieving church members: {ex.Message}");
        }
    }
}
