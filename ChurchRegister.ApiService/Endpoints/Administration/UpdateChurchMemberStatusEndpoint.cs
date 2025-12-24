using FastEndpoints;
using ChurchRegister.ApiService.Models.Administration;
using ChurchRegister.ApiService.Services;
using ChurchRegister.Database.Constants;
using System.Security.Claims;

namespace ChurchRegister.ApiService.Endpoints.Administration;

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
    private readonly IChurchMemberService _churchMemberService;

    public UpdateChurchMemberStatusEndpoint(IChurchMemberService churchMemberService)
    {
        _churchMemberService = churchMemberService;
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
            .WithTags("Church Members"));
    }

    public override async Task HandleAsync(UpdateChurchMemberStatusRequestWithId req, CancellationToken ct)
    {
        try
        {
            // Get the current user ID for audit
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

            var result = await _churchMemberService.UpdateChurchMemberStatusAsync(req.Id, request, userId, ct);
            await SendOkAsync(result, ct);
        }
        catch (InvalidOperationException ex)
        {
            AddError(ex.Message);
            await SendErrorsAsync(400, ct);
        }
        catch (Exception ex)
        {
            ThrowError($"Error updating church member status: {ex.Message}");
        }
    }
}
