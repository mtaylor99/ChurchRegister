using ChurchRegister.Database.Data;
using ChurchRegister.ApiService.Models;
using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.ApiService.Models.Security;
using ChurchRegister.ApiService.Models.Attendance;
using ChurchRegister.ApiService.Models.Dashboard;
using Microsoft.AspNetCore.Identity;

namespace ChurchRegister.ApiService.Services.Security;

/// <summary>
/// Service interface for comprehensive user management operations
/// Provides business logic layer for user CRUD operations, role management, and audit logging
/// </summary>
public interface IUserManagementService
{
    /// <summary>
    /// Get paginated users with search and filtering
    /// </summary>
    Task<PagedResult<UserProfileDto>> GetUsersAsync(UserGridQuery query, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get user by ID
    /// </summary>
    Task<UserProfileDto?> GetUserByIdAsync(string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Create a new user with role assignment and email verification
    /// </summary>
    Task<CreateUserResponse> CreateUserAsync(CreateUserRequest request, string createdBy, CancellationToken cancellationToken = default);

    /// <summary>
    /// Update user information with audit logging
    /// </summary>
    Task<UserProfileDto> UpdateUserAsync(UpdateUserRequest request, string modifiedBy, CancellationToken cancellationToken = default);

    /// <summary>
    /// Update user account status (Active, Inactive, Locked)
    /// </summary>
    Task<UserProfileDto> UpdateUserStatusAsync(UpdateUserStatusRequest request, string modifiedBy, CancellationToken cancellationToken = default);

    /// <summary>
    /// Assign roles to a user with hierarchy enforcement
    /// </summary>
    Task<UserProfileDto> AssignUserRolesAsync(AssignUserRolesRequest request, string modifiedBy, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get all available system roles
    /// </summary>
    Task<IEnumerable<SystemRoleDto>> GetSystemRolesAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Generate avatar initials from user's first and last name
    /// </summary>
    string GenerateUserAvatar(string firstName, string lastName);

    /// <summary>
    /// Validate role hierarchy and auto-assign lower-level roles
    /// </summary>
    Task<IEnumerable<string>> ValidateAndExpandRolesAsync(IEnumerable<string> roles, CancellationToken cancellationToken = default);

    /// <summary>
    /// Send email verification to user
    /// </summary>
    Task<bool> SendEmailVerificationAsync(ChurchRegisterWebUser user, CancellationToken cancellationToken = default);

    /// <summary>
    /// Send welcome email with account details
    /// </summary>
    Task<bool> SendWelcomeEmailAsync(ChurchRegisterWebUser user, string? temporaryPassword = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Send invitation email with account setup link
    /// </summary>
    Task<bool> SendInvitationEmailAsync(ChurchRegisterWebUser user, CancellationToken cancellationToken = default);

    /// <summary>
    /// Resend invitation email to an existing user by user ID
    /// </summary>
    Task<bool> ResendInvitationAsync(string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Audit user management action
    /// </summary>
    Task LogUserManagementActionAsync(string userId, string action, string performedBy, string? details = null, CancellationToken cancellationToken = default);
}