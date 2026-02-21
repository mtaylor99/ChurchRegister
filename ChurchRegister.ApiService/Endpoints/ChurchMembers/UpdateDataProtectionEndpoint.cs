using FastEndpoints;
using ChurchRegister.ApiService.Models;
using ChurchRegister.ApiService.Models.DataProtection;
using ChurchRegister.ApiService.UseCase.DataProtection;
using ChurchRegister.Database.Constants;
using System.Security.Claims;

namespace ChurchRegister.ApiService.Endpoints.ChurchMembers;

/// <summary>
/// Endpoint for updating data protection consent information for a church member
/// </summary>
public class UpdateDataProtectionEndpoint : Endpoint<UpdateDataProtectionRequest, DataProtectionDto>
{
    private readonly IUpdateDataProtectionUseCase _useCase;

    public UpdateDataProtectionEndpoint(IUpdateDataProtectionUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Put("/api/church-members/{id}/data-protection");
        Policies("Bearer");
        Roles(
            SystemRoles.ChurchMembersContributor, 
            SystemRoles.ChurchMembersAdministrator,
            SystemRoles.SystemAdministration);
        Description(x => x
            .WithName("UpdateDataProtection")
            .WithSummary("Update data protection consent for a church member")
            .WithDescription("Updates GDPR data protection consent preferences for a specific church member. Only Contributors and Administrators can update consent.")
            .WithTags("ChurchMembers", "DataProtection"));
    }

    public override async Task HandleAsync(UpdateDataProtectionRequest req, CancellationToken ct)
    {
        // Extract member ID from route
        var memberId = Route<int>("id");
        
        // Extract username from JWT claims for audit trail
        var username = User.Identity?.Name 
            ?? User.FindFirst(ClaimTypes.Name)?.Value 
            ?? User.FindFirst("preferred_username")?.Value 
            ?? "Unknown";

        var dataProtection = await _useCase.ExecuteAsync(memberId, req, username, ct);

        if (dataProtection == null)
        {
            await SendNotFoundAsync(ct);
            return;
        }

        await SendOkAsync(dataProtection, ct);
    }
}
