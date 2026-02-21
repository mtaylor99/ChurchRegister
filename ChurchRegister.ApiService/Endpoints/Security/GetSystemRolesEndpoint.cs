using FastEndpoints;
using ChurchRegister.ApiService.Models.Security;
using ChurchRegister.ApiService.UseCase.Security.GetSystemRoles;

namespace ChurchRegister.ApiService.Endpoints.Security;

/// <summary>
/// Endpoint for retrieving all system roles for dropdowns and role selection
/// </summary>
public class GetSystemRolesEndpoint : EndpointWithoutRequest<IEnumerable<SystemRoleDto>>
{
    private readonly IGetSystemRolesUseCase _useCase;

    public GetSystemRolesEndpoint(IGetSystemRolesUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Get("/api/administration/roles");
        Policies("Bearer");
        Roles("SystemAdministration");
        Description(x => x
            .WithName("GetSystemRoles")
            .WithSummary("Get all system roles")
            .WithDescription("Retrieves all available system roles for role assignment and dropdown population")
            .WithTags("Security"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var result = await _useCase.ExecuteAsync(ct);
        await SendOkAsync(result, ct);
    }
}
