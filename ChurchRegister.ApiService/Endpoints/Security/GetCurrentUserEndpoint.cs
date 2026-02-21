using FastEndpoints;
using ChurchRegister.ApiService.Models.Security;
using ChurchRegister.ApiService.UseCase.Authentication.GetCurrentUser;

namespace ChurchRegister.ApiService.Endpoints.Security;

public class GetCurrentUserEndpoint : EndpointWithoutRequest<UserDto>
{
    private readonly IGetCurrentUserUseCase _getCurrentUserUseCase;

    public GetCurrentUserEndpoint(IGetCurrentUserUseCase getCurrentUserUseCase)
    {
        _getCurrentUserUseCase = getCurrentUserUseCase;
    }

    public override void Configure()
    {
        Get("/api/auth/user");
        Policies("Bearer");
        Options(x => x.WithTags("Security"));
        Summary(s =>
        {
            s.Summary = "Get current user";
            s.Description = "Retrieve information about the currently authenticated user";
        });
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        try
        {
            var response = await _getCurrentUserUseCase.ExecuteAsync(User, ct);
            await SendOkAsync(response, ct);
        }
        catch (UnauthorizedAccessException)
        {
            await SendUnauthorizedAsync(ct);
        }
    }
}
