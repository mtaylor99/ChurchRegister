using FastEndpoints;
using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.ApiService.Models.Districts;
using ChurchRegister.ApiService.UseCase.ChurchMembers.AssignDistrict;
using ChurchRegister.Database.Constants;
using System.Security.Claims;

namespace ChurchRegister.ApiService.Endpoints.ChurchMembers;

/// <summary>
/// Request model for assigning district to church member
/// </summary>
public class AssignDistrictRequestWithId
{
    public int Id { get; set; }
    public int? DistrictId { get; set; }
}

/// <summary>
/// Endpoint for assigning a district to a church member
/// </summary>
public class AssignDistrictEndpoint : Endpoint<AssignDistrictRequestWithId, ChurchMemberDetailDto>
{
    private readonly IAssignDistrictUseCase _useCase;

    public AssignDistrictEndpoint(IAssignDistrictUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Put("/api/church-members/{id}/district");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.ChurchMembersAdministrator);
        Description(x => x
            .WithName("AssignDistrict")
            .WithSummary("Assign a district to a church member")
            .WithDescription("Assigns or unassigns a district from a church member (admin only)")
            .WithTags("ChurchMembers"));
    }

    public override async Task HandleAsync(AssignDistrictRequestWithId req, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrEmpty(userId))
        {
            await SendUnauthorizedAsync(ct);
            return;
        }

        var request = new AssignDistrictRequest
        {
            DistrictId = req.DistrictId
        };

        var result = await _useCase.ExecuteAsync(req.Id, request, userId, ct);
        await SendOkAsync(result, ct);
    }
}
