using FastEndpoints;
using ChurchRegister.ApiService.Models.Security;
using ChurchRegister.ApiService.UseCase.Security.UpdateUserStatus;

namespace ChurchRegister.ApiService.Endpoints.Security;

/// <summary>
/// Endpoint for updating user account status (Lock/Unlock/Activate/Deactivate)
/// </summary>
public class UpdateUserStatusEndpoint : Endpoint<UpdateUserStatusRequest, UserProfileDto>
{
    private readonly IUpdateUserStatusUseCase _useCase;

    public UpdateUserStatusEndpoint(IUpdateUserStatusUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Patch("/api/administration/users/{UserId}/status");
        Policies("Bearer");
        Roles("SystemAdministration");
        Description(x => x
            .WithName("UpdateUserStatus")
            .WithSummary("Update user account status")
            .WithDescription("Lock, unlock, activate, or deactivate a user account with audit logging")
            .WithTags("Security"));
    }

    public override async Task HandleAsync(UpdateUserStatusRequest req, CancellationToken ct)
    {
        var modifiedBy = User.Identity?.Name ?? "System";
        var result = await _useCase.ExecuteAsync(req, modifiedBy, ct);
        await SendOkAsync(result, ct);
    }
}
