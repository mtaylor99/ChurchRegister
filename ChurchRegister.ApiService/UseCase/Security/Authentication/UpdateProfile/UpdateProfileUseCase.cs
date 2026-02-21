using Microsoft.AspNetCore.Identity;
using ChurchRegister.Database.Data;
using ChurchRegister.ApiService.Models.Security;

namespace ChurchRegister.ApiService.UseCase.Authentication.UpdateProfile;

public class UpdateProfileUseCase : IUpdateProfileUseCase
{
    private readonly UserManager<ChurchRegisterWebUser> _userManager;

    public UpdateProfileUseCase(UserManager<ChurchRegisterWebUser> userManager)
    {
        _userManager = userManager;
    }

    public async Task<ChurchRegisterWebUser> ExecuteAsync(UpdateProfileRequest request, string userId, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(userId);
        
        if (user == null)
        {
            throw new InvalidOperationException("User not found");
        }

        // Update profile fields if provided
        if (!string.IsNullOrWhiteSpace(request.FirstName))
        {
            user.FirstName = request.FirstName.Trim();
        }

        if (!string.IsNullOrWhiteSpace(request.LastName))
        {
            user.LastName = request.LastName.Trim();
        }

        // Update the modified timestamp
        user.ModifiedDateTime = DateTime.UtcNow;
        user.ModifiedBy = user.Email ?? "System";

        var result = await _userManager.UpdateAsync(user);

        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"Failed to update profile: {errors}");
        }

        return user;
    }
}
