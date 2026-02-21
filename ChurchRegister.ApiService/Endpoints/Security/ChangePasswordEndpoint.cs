using FastEndpoints;
using ChurchRegister.ApiService.Models.Security;
using ChurchRegister.ApiService.UseCase.Authentication.ChangePassword;
using System.Security.Claims;

namespace ChurchRegister.ApiService.Endpoints.Security;

public class ChangePasswordEndpoint : Endpoint<ChangePasswordRequest>
{
    private readonly IChangePasswordUseCase _changePasswordUseCase;

    public ChangePasswordEndpoint(IChangePasswordUseCase changePasswordUseCase)
    {
        _changePasswordUseCase = changePasswordUseCase;
    }

    public override void Configure()
    {
        Post("/api/auth/password-change");
        Policies("Bearer");
        Summary(s =>
        {
            s.Summary = "Change user password";
            s.Description = "Change the authenticated user's password and clear RequirePasswordChange flag if set";
        });
    }

    public override async Task HandleAsync(ChangePasswordRequest request, CancellationToken ct)
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                await SendUnauthorizedAsync(ct);
                return;
            }

            await _changePasswordUseCase.ExecuteAsync(request, userId, ct);
            await SendOkAsync(new { message = "Password changed successfully" }, ct);
        }
        catch (UnauthorizedAccessException ex)
        {
            ThrowError(ex.Message, 401);
        }
        catch (InvalidOperationException ex)
        {
            ThrowError(ex.Message, 400);
        }
    }
}
