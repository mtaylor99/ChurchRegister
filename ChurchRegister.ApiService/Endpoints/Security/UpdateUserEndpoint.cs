using FastEndpoints;
using ChurchRegister.ApiService.Models.Security;
using ChurchRegister.ApiService.UseCase.Security.UpdateUser;

namespace ChurchRegister.ApiService.Endpoints.Security;

/// <summary>
/// Endpoint for updating user information with audit logging
/// </summary>
public class UpdateUserEndpoint : Endpoint<UpdateUserRequest, UserProfileDto>
{
    private readonly IUpdateUserUseCase _useCase;

    public UpdateUserEndpoint(IUpdateUserUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Put("/api/administration/users/{UserId}");
        Policies("Bearer");
        Roles("SystemAdministration");
        Description(x => x
            .WithName("UpdateUser")
            .WithSummary("Update user information and roles")
            .WithDescription("Updates user profile information and role assignments with audit logging")
            .WithTags("Security"));
    }

    public override async Task HandleAsync(UpdateUserRequest req, CancellationToken ct)
    {
        var modifiedBy = User.Identity?.Name ?? "System";
        var result = await _useCase.ExecuteAsync(req, modifiedBy, ct);
        await SendOkAsync(result, ct);
    }
}
