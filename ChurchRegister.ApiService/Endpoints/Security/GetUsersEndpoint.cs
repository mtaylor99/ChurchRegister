using FastEndpoints;
using ChurchRegister.ApiService.Models;
using ChurchRegister.ApiService.Models.Security;
using ChurchRegister.ApiService.UseCase.Security.GetUsers;

namespace ChurchRegister.ApiService.Endpoints.Security;

/// <summary>
/// Endpoint for retrieving users with pagination, search, and filtering
/// </summary>
public class GetUsersEndpoint : Endpoint<UserGridQuery, PagedResult<UserProfileDto>>
{
    private readonly IGetUsersUseCase _useCase;

    public GetUsersEndpoint(IGetUsersUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Get("/api/administration/users");
        Policies("Bearer");
        Roles("SystemAdministration");
        Description(x => x
            .WithName("GetUsers")
            .WithSummary("Get users with pagination, search, and filtering")
            .WithDescription("Retrieves a paginated list of users with optional search and filtering capabilities")
            .WithTags("Security"));
    }

    public override async Task HandleAsync(UserGridQuery req, CancellationToken ct)
    {
        var result = await _useCase.ExecuteAsync(req, ct);
        await SendOkAsync(result, ct);
    }
}
