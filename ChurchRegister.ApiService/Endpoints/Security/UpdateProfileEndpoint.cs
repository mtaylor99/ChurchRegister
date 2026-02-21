using FastEndpoints;
using ChurchRegister.ApiService.Models.Security;
using ChurchRegister.ApiService.UseCase.Authentication.UpdateProfile;
using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using ChurchRegister.Database.Data;
using Microsoft.Extensions.DependencyInjection;

namespace ChurchRegister.ApiService.Endpoints.Security;

public class UpdateProfileEndpoint : Endpoint<UpdateProfileRequest, UserDto>
{
    private readonly IUpdateProfileUseCase _updateProfileUseCase;

    public UpdateProfileEndpoint(IUpdateProfileUseCase updateProfileUseCase)
    {
        _updateProfileUseCase = updateProfileUseCase;
    }

    public override void Configure()
    {
        Put("/api/auth/profile");
        Policies("Bearer");
        Summary(s =>
        {
            s.Summary = "Update user profile";
            s.Description = "Update the authenticated user's profile information (name, avatar)";
        });
    }

    public override async Task HandleAsync(UpdateProfileRequest request, CancellationToken ct)
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                await SendUnauthorizedAsync(ct);
                return;
            }

            var updatedUser = await _updateProfileUseCase.ExecuteAsync(request, userId, ct);

            // Get user roles and permissions
            var userManager = HttpContext.RequestServices.GetRequiredService<UserManager<ChurchRegisterWebUser>>();
            var roles = await userManager.GetRolesAsync(updatedUser);
            var claims = await userManager.GetClaimsAsync(updatedUser);
            var permissions = claims.Where(c => c.Type == "permission").Select(c => c.Value).ToArray();

            // Map to UserDto
            var userDto = new UserDto
            {
                Id = updatedUser.Id,
                Email = updatedUser.Email ?? string.Empty,
                FirstName = updatedUser.FirstName,
                LastName = updatedUser.LastName,
                DisplayName = updatedUser.FullName,
                Avatar = $"{updatedUser.FirstName[0]}{updatedUser.LastName[0]}".ToUpper(),
                EmailConfirmed = updatedUser.EmailConfirmed,
                IsActive = updatedUser.AccountStatus == Database.Enums.UserAccountStatus.Active,
                Roles = roles.ToArray(),
                Permissions = permissions,
                LastLogin = DateTime.UtcNow, // This should come from a proper tracking mechanism
                CreatedAt = updatedUser.CreatedDateTime,
                UpdatedAt = updatedUser.ModifiedDateTime ?? updatedUser.CreatedDateTime
            };

            await SendOkAsync(userDto, ct);
        }
        catch (InvalidOperationException ex)
        {
            ThrowError(ex.Message, 400);
        }
    }
}
