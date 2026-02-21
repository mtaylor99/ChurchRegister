using FastEndpoints;
using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.ApiService.UseCase.ChurchMembers.UpdateChurchMember;
using ChurchRegister.Database.Constants;
using System.Security.Claims;

namespace ChurchRegister.ApiService.Endpoints.ChurchMembers;

/// <summary>
/// Endpoint for updating an existing church member
/// </summary>
public class UpdateChurchMemberEndpoint : Endpoint<UpdateChurchMemberRequest, ChurchMemberDetailDto>
{
    private readonly IUpdateChurchMemberUseCase _useCase;

    public UpdateChurchMemberEndpoint(IUpdateChurchMemberUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Put("/api/church-members/{id}");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.ChurchMembersContributor, SystemRoles.ChurchMembersAdministrator);
        Description(x => x
            .WithName("UpdateChurchMember")
            .WithSummary("Update an existing church member")
            .WithDescription("Updates church member information with the provided data")
            .WithTags("ChurchMembers"));
    }

    public override async Task HandleAsync(UpdateChurchMemberRequest req, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        
        if (string.IsNullOrEmpty(userId))
        {
            await SendUnauthorizedAsync(ct);
            return;
        }

        var result = await _useCase.ExecuteAsync(req, userId, ct);
        await SendOkAsync(result, ct);
    }
}
