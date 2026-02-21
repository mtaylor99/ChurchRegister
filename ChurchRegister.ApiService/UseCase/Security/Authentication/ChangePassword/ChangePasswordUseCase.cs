using ChurchRegister.ApiService.Models.Security;
using ChurchRegister.Database.Data;
using Microsoft.AspNetCore.Identity;

namespace ChurchRegister.ApiService.UseCase.Authentication.ChangePassword;

public class ChangePasswordUseCase : IChangePasswordUseCase
{
    private readonly UserManager<ChurchRegisterWebUser> _userManager;

    public ChangePasswordUseCase(UserManager<ChurchRegisterWebUser> userManager)
    {
        _userManager = userManager;
    }

    public async Task ExecuteAsync(ChangePasswordRequest request, string userId, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            throw new UnauthorizedAccessException("User not found");
        }

        // Verify current password
        var isPasswordValid = await _userManager.CheckPasswordAsync(user, request.CurrentPassword);
        if (!isPasswordValid)
        {
            throw new UnauthorizedAccessException("Current password is incorrect");
        }

        // Change password
        var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"Password change failed: {errors}");
        }
    }
}
