using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.ApiService.Models.Security;
using ChurchRegister.ApiService.Models.Attendance;
using ChurchRegister.ApiService.Models.Dashboard;
using ChurchRegister.ApiService.UseCase.Administration.RevokeUserTokens;
using ChurchRegister.Database.Constants;
using FastEndpoints;

namespace ChurchRegister.ApiService.Endpoints.Security;

/// <summary>
/// Admin endpoint to revoke all tokens for a specific user
/// </summary>
public class RevokeUserTokensEndpoint : Endpoint<RevokeUserTokensRequest, RevokeUserTokensResponse>
{
    private readonly IRevokeUserTokensUseCase _useCase;

    public RevokeUserTokensEndpoint(IRevokeUserTokensUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Post("/api/administration/users/revoke-tokens");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration);
        Description(x => x
            .WithName("RevokeUserTokens")
            .WithSummary("Revoke all tokens for a specific user")
            .WithDescription("Revokes all refresh tokens for a user, forcing them to log in again")
            .WithTags("Security"));
    }

    public override async Task HandleAsync(RevokeUserTokensRequest req, CancellationToken ct)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var response = await _useCase.ExecuteAsync(req, ipAddress, ct);

        if (response.Success)
        {
            await SendOkAsync(response, ct);
        }
        else
        {
            await SendNotFoundAsync(ct);
        }
    }
}
