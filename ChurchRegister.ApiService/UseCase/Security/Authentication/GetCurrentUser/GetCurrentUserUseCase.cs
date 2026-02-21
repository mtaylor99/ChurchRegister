using ChurchRegister.ApiService.Models.Security;
using ChurchRegister.Database.Data;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;

namespace ChurchRegister.ApiService.UseCase.Authentication.GetCurrentUser;

public class GetCurrentUserUseCase : IGetCurrentUserUseCase
{
    private readonly UserManager<ChurchRegisterWebUser> _userManager;

    public GetCurrentUserUseCase(UserManager<ChurchRegisterWebUser> userManager)
    {
        _userManager = userManager;
    }

    public async Task<UserDto> ExecuteAsync(ClaimsPrincipal user, CancellationToken cancellationToken = default)
    {
        if (user?.Identity?.IsAuthenticated != true)
        {
            throw new UnauthorizedAccessException("User is not authenticated");
        }
        
        var currentUser = await _userManager.GetUserAsync(user);
        if (currentUser == null)
        {
            throw new UnauthorizedAccessException("User not found");
        }
        
        var roles = await _userManager.GetRolesAsync(currentUser);
        var claims = await _userManager.GetClaimsAsync(currentUser);
        var permissions = claims.Where(c => c.Type == "permission").Select(c => c.Value).ToArray();
        
        return new UserDto
        {
            Id = currentUser.Id,
            Email = currentUser.Email!,
            DisplayName = currentUser.UserName ?? "",
            FirstName = currentUser.UserName?.Split(' ').FirstOrDefault() ?? "",
            LastName = currentUser.UserName?.Contains(' ') == true ? currentUser.UserName.Split(' ').LastOrDefault() ?? "" : "",
            Roles = roles.ToArray(),
            Permissions = permissions,
            Avatar = !string.IsNullOrWhiteSpace(currentUser.FirstName) && !string.IsNullOrWhiteSpace(currentUser.LastName) 
                ? $"{currentUser.FirstName[0]}{currentUser.LastName[0]}".ToUpper() 
                : null,
            IsActive = true,
            EmailConfirmed = currentUser.EmailConfirmed,
            LastLogin = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }
}