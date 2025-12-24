using FastEndpoints;
using ChurchRegister.ApiService.Models.Administration;
using ChurchRegister.ApiService.Services;
using ChurchRegister.Database.Constants;
using System.Security.Claims;

namespace ChurchRegister.ApiService.Endpoints.Administration;

/// <summary>
/// Endpoint for updating an existing church member
/// </summary>
public class UpdateChurchMemberEndpoint : Endpoint<UpdateChurchMemberRequest, ChurchMemberDetailDto>
{
    private readonly IChurchMemberService _churchMemberService;

    public UpdateChurchMemberEndpoint(IChurchMemberService churchMemberService)
    {
        _churchMemberService = churchMemberService;
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
            .WithTags("Church Members"));
    }

    public override async Task HandleAsync(UpdateChurchMemberRequest req, CancellationToken ct)
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

            var result = await _churchMemberService.UpdateChurchMemberAsync(req, userId, ct);
            await SendOkAsync(result, ct);
        }
        catch (InvalidOperationException ex)
        {
            AddError(ex.Message);
            await SendErrorsAsync(400, ct);
        }
        catch (Exception ex)
        {
            ThrowError($"Error updating church member: {ex.Message}");
        }
    }
}
