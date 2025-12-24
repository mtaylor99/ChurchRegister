using Microsoft.AspNetCore.Identity;
using FastEndpoints;
using ChurchRegister.Database.Data;
using ChurchRegister.ApiService.Models.Administration;
using ChurchRegister.Database.Enums;

namespace ChurchRegister.ApiService.Endpoints.Administration;

/// <summary>
/// Endpoint for updating user account status (Lock/Unlock/Activate/Deactivate)
/// </summary>
public class UpdateUserStatusEndpoint : Endpoint<UpdateUserStatusRequest, UserProfileDto>
{
    private readonly UserManager<ChurchRegisterWebUser> _userManager;

    public UpdateUserStatusEndpoint(UserManager<ChurchRegisterWebUser> userManager)
    {
        _userManager = userManager;
    }

    public override void Configure()
    {
        Patch("/api/administration/users/{UserId}/status");
        Policies("Bearer");
        Roles("SystemAdministration");
        Description(x => x
            .WithName("UpdateUserStatus")
            .WithSummary("Update user account status")
            .WithDescription("Lock, unlock, activate, or deactivate a user account with audit logging")
            .WithTags("Administration"));
    }

    public override async Task HandleAsync(UpdateUserStatusRequest req, CancellationToken ct)
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

            // Prevent self-modification
            var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (currentUserId == req.UserId)
            {
                ThrowError("You cannot modify your own account status");
                return;
            }

            // Store original status for audit trail
            var originalStatus = user.AccountStatus;
            var originalLockoutEnd = user.LockoutEnd;

            // Apply the requested action
            switch (req.Action)
            {
                case UserStatusAction.Activate:
                    user.AccountStatus = UserAccountStatus.Active;
                    user.LockoutEnd = null;
                    user.LockoutEnabled = true;
                    break;

                case UserStatusAction.Deactivate:
                    user.AccountStatus = UserAccountStatus.Inactive;
                    user.LockoutEnd = null;
                    break;

                case UserStatusAction.Lock:
                    user.AccountStatus = UserAccountStatus.Locked;
                    user.LockoutEnd = DateTimeOffset.UtcNow.AddYears(100); // Essentially permanent until manually unlocked
                    user.LockoutEnabled = true;
                    break;

                case UserStatusAction.Unlock:
                    user.AccountStatus = UserAccountStatus.Active;
                    user.LockoutEnd = null;
                    user.LockoutEnabled = true;
                    break;

                default:
                    ThrowError("Invalid action specified");
                    return;
            }

            // Update audit fields
            user.ModifiedDateTime = DateTime.UtcNow;
            user.ModifiedBy = User.Identity?.Name ?? "System";

            // Update the user
            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                ThrowError($"Failed to update user status: {errors}");
                return;
            }

            // Get user roles for response
            var userRoles = await _userManager.GetRolesAsync(user);

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
                Roles = userRoles.ToArray()
            };

            await SendOkAsync(userProfile, ct);
        }
        catch (Exception ex)
        {
            ThrowError($"Failed to update user status: {ex.Message}");
        }
    }
}