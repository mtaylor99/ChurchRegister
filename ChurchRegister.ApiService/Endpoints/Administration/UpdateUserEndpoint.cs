using Microsoft.AspNetCore.Identity;
using FastEndpoints;
using ChurchRegister.Database.Data;
using ChurchRegister.ApiService.Models.Administration;

namespace ChurchRegister.ApiService.Endpoints.Administration;

/// <summary>
/// Endpoint for updating user information with audit logging
/// </summary>
public class UpdateUserEndpoint : Endpoint<UpdateUserRequest, UserProfileDto>
{
    private readonly UserManager<ChurchRegisterWebUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;

    public UpdateUserEndpoint(
        UserManager<ChurchRegisterWebUser> userManager,
        RoleManager<IdentityRole> roleManager)
    {
        _userManager = userManager;
        _roleManager = roleManager;
    }

    public override void Configure()
    {
        Put("/api/administration/users/{UserId}");
        Policies("Bearer");
        Roles("SystemAdministration");
        Description(x => x
            .WithName("UpdateUser")
            .WithSummary("Update user information and roles")
            .WithDescription("Updates user profile information and role assignments with audit logging")
            .WithTags("Administration"));
    }

    public override async Task HandleAsync(UpdateUserRequest req, CancellationToken ct)
    {
        try
        {
            // Find the user
            var user = await _userManager.FindByIdAsync(req.UserId);
            if (user == null)
            {
                ThrowError("User not found", 404);
                return;
            }

            // Validate roles exist
            var invalidRoles = new List<string>();
            foreach (var roleName in req.Roles)
            {
                var role = await _roleManager.FindByNameAsync(roleName);
                if (role == null)
                {
                    invalidRoles.Add(roleName);
                }
            }

            if (invalidRoles.Any())
            {
                ThrowError($"Invalid roles: {string.Join(", ", invalidRoles)}");
                return;
            }

            // Store original values for audit trail
            var originalFirstName = user.FirstName;
            var originalLastName = user.LastName;
            var originalJobTitle = user.JobTitle;
            var originalPhoneNumber = user.PhoneNumber;

            // Update user properties
            user.FirstName = req.FirstName;
            user.LastName = req.LastName;
            user.JobTitle = req.JobTitle;
            user.PhoneNumber = req.PhoneNumber;
            user.ModifiedDateTime = DateTime.UtcNow;
            user.ModifiedBy = User.Identity?.Name ?? "System";

            // Update the user
            var updateResult = await _userManager.UpdateAsync(user);
            if (!updateResult.Succeeded)
            {
                var errors = string.Join(", ", updateResult.Errors.Select(e => e.Description));
                ThrowError($"Failed to update user: {errors}");
                return;
            }

            // Get current roles
            var currentRoles = await _userManager.GetRolesAsync(user);

            // Remove user from all current roles
            if (currentRoles.Any())
            {
                var removeResult = await _userManager.RemoveFromRolesAsync(user, currentRoles);
                if (!removeResult.Succeeded)
                {
                    var errors = string.Join(", ", removeResult.Errors.Select(e => e.Description));
                    ThrowError($"Failed to remove existing roles: {errors}");
                    return;
                }
            }

            // Add user to new roles
            var addRolesResult = await _userManager.AddToRolesAsync(user, req.Roles);
            if (!addRolesResult.Succeeded)
            {
                // If role assignment fails, try to restore original roles
                if (currentRoles.Any())
                {
                    await _userManager.AddToRolesAsync(user, currentRoles);
                }

                var errors = string.Join(", ", addRolesResult.Errors.Select(e => e.Description));
                ThrowError($"Failed to assign new roles: {errors}");
                return;
            }

            // Get updated user with new roles
            var updatedRoles = await _userManager.GetRolesAsync(user);
            
            // Create response DTO
            var userProfile = new UserProfileDto
            {
                Id = user.Id,
                Email = user.Email ?? string.Empty,
                FirstName = user.FirstName,
                LastName = user.LastName,
                JobTitle = user.JobTitle,
                PhoneNumber = user.PhoneNumber,
                Status = user.AccountStatus,
                DateJoined = user.DateJoined,
                EmailConfirmed = user.EmailConfirmed,
                CreatedAt = user.CreatedDateTime,
                LastModified = user.ModifiedDateTime,
                ModifiedBy = user.ModifiedBy,
                Roles = updatedRoles.ToArray()
            };

            await SendOkAsync(userProfile, ct);
        }
        catch (Exception ex)
        {
            ThrowError($"Failed to update user: {ex.Message}");
        }
    }
}