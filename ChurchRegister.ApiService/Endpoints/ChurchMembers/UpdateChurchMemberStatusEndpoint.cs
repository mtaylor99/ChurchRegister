using FastEndpoints;
using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.ApiService.UseCase.ChurchMembers.UpdateChurchMemberStatus;
using ChurchRegister.Database.Constants;
using System.Security.Claims;

namespace ChurchRegister.ApiService.Endpoints.ChurchMembers;

/// <summary>
/// Request model for updating church member status
/// </summary>
public class UpdateChurchMemberStatusRequestWithId
{
    public int Id { get; set; }
    public int StatusId { get; set; }
    public string? Note { get; set; }
}

/// <summary>
/// Endpoint for updating a church member's status
/// </summary>
public class UpdateChurchMemberStatusEndpoint : Endpoint<UpdateChurchMemberStatusRequestWithId, ChurchMemberDetailDto>
{
    private readonly IUpdateChurchMemberStatusUseCase _useCase;

    public UpdateChurchMemberStatusEndpoint(IUpdateChurchMemberStatusUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Patch("/api/church-members/{id}/status");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.ChurchMembersAdministrator);
        Description(x => x
            .WithName("UpdateChurchMemberStatus")
            .WithSummary("Update a church member's status")
            .WithDescription("Updates the status of a church member (admin only)")
            .WithTags("ChurchMembers"));
    }

    public override async Task HandleAsync(UpdateChurchMemberStatusRequestWithId req, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrEmpty(userId))
        {
            await SendUnauthorizedAsync(ct);
            return;
        }

        var request = new UpdateChurchMemberStatusRequest
        {
            StatusId = req.StatusId,
            Note = req.Note
        };

        var result = await _useCase.ExecuteAsync(req.Id, request, userId, ct);
        await SendOkAsync(result, ct);
    }
}
