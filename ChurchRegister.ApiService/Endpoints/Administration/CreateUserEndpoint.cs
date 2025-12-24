using FastEndpoints;
using ChurchRegister.ApiService.Models.Administration;
using ChurchRegister.ApiService.Services;

namespace ChurchRegister.ApiService.Endpoints.Administration;

/// <summary>
/// Endpoint for creating new users with role assignment and invitation email
/// </summary>
public class CreateUserEndpoint : Endpoint<CreateUserRequest, CreateUserResponse>
{
    private readonly IUserManagementService _userManagementService;

    public CreateUserEndpoint(IUserManagementService userManagementService)
    {
        _userManagementService = userManagementService;
    }

    public override void Configure()
    {
        Post("/api/administration/users");
        Policies("Bearer");
        Roles("SystemAdministration");
        Description(x => x
            .WithName("CreateUser")
            .WithSummary("Create a new user with role assignment and invitation email")
            .WithDescription("Creates a new user account with specified roles and sends invitation email for setup")
            .WithTags("Administration"));
    }

    public override async Task HandleAsync(CreateUserRequest req, CancellationToken ct)
    {
        try
        {
            var createdBy = User.Identity?.Name ?? "System";
            var result = await _userManagementService.CreateUserAsync(req, createdBy, ct);
            
            await SendCreatedAtAsync("/api/administration/users", new { id = result.UserId }, result, cancellation: ct);
        }
        catch (Exception ex)
        {
            ThrowError($"Failed to create user: {ex.Message}");
        }
    }
}