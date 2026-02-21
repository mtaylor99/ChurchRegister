using FastEndpoints;
using ChurchRegister.ApiService.Models.Security;
using ChurchRegister.ApiService.UseCase.Security.CreateUser;

namespace ChurchRegister.ApiService.Endpoints.Security;

/// <summary>
/// Endpoint for creating new users with role assignment and invitation email
/// </summary>
public class CreateUserEndpoint : Endpoint<CreateUserRequest, CreateUserResponse>
{
    private readonly ICreateUserUseCase _useCase;

    public CreateUserEndpoint(ICreateUserUseCase useCase)
    {
        _useCase = useCase;
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
            .WithTags("Security"));
    }

    public override async Task HandleAsync(CreateUserRequest req, CancellationToken ct)
    {
        var createdBy = User.Identity?.Name ?? "System";
        var result = await _useCase.ExecuteAsync(req, createdBy, ct);
        
        await SendCreatedAtAsync("/api/administration/users", new { id = result.UserId }, result, cancellation: ct);
    }
}