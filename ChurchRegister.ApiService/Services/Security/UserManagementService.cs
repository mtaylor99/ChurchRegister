using ChurchRegister.Database.Data;
using ChurchRegister.Database.Enums;
using ChurchRegister.ApiService.Models;
using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.ApiService.Models.Security;
using ChurchRegister.ApiService.Models.Attendance;
using ChurchRegister.ApiService.Models.Dashboard;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Text;

namespace ChurchRegister.ApiService.Services.Security;

/// <summary>
/// Comprehensive user management service providing business logic for user operations
/// </summary>
public class UserManagementService : IUserManagementService
{
    private readonly UserManager<ChurchRegisterWebUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly ChurchRegisterWebContext _context;
    private readonly ILogger<UserManagementService> _logger;

    public UserManagementService(
        UserManager<ChurchRegisterWebUser> userManager,
        RoleManager<IdentityRole> roleManager,
        ChurchRegisterWebContext context,
        ILogger<UserManagementService> logger)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _context = context;
        _logger = logger;
    }

    public async Task<PagedResult<UserProfileDto>> GetUsersAsync(UserGridQuery query, CancellationToken cancellationToken = default)
    {
        // Validate pagination parameters (validation also exists at model level via [Range] attribute)
        Helpers.ValidationHelpers.RequireValidPageNumber(query.Page);
        Helpers.ValidationHelpers.RequireValidPageSize(query.PageSize);
        
        var usersQuery = _context.Users.AsQueryable();

        // Apply search filter
        if (!string.IsNullOrWhiteSpace(query.SearchTerm))
        {
            var searchTerm = query.SearchTerm.ToLower();
            usersQuery = usersQuery.Where(u =>
                u.FirstName.ToLower().Contains(searchTerm) ||
                u.LastName.ToLower().Contains(searchTerm) ||
                u.Email!.ToLower().Contains(searchTerm) ||
                (u.JobTitle != null && u.JobTitle.ToLower().Contains(searchTerm)));
        }

        // Apply status filter
        if (query.StatusFilter.HasValue)
        {
            usersQuery = usersQuery.Where(u => u.AccountStatus == query.StatusFilter.Value);
        }

        // Apply role filter
        if (!string.IsNullOrWhiteSpace(query.RoleFilter))
        {
            var usersInRole = await _userManager.GetUsersInRoleAsync(query.RoleFilter);
            var userIds = usersInRole.Select(u => u.Id).ToList();
            usersQuery = usersQuery.Where(u => userIds.Contains(u.Id));
        }

        // Get total count before pagination
        var totalCount = await usersQuery.CountAsync(cancellationToken);

        // Apply sorting
        usersQuery = query.SortDirection?.ToLower() == "desc"
            ? ApplySortingDescending(usersQuery, query.SortBy)
            : ApplySortingAscending(usersQuery, query.SortBy);

        // Apply pagination
        var users = await usersQuery
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(cancellationToken);

        // Map to DTOs with roles
        var userDtos = new List<UserProfileDto>();
        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            userDtos.Add(MapToUserProfileDto(user, roles));
        }

        return new PagedResult<UserProfileDto>
        {
            Items = userDtos,
            TotalCount = totalCount,
            PageSize = query.PageSize,
            CurrentPage = query.Page
        };
    }

    public async Task<UserProfileDto?> GetUserByIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return null;

        var roles = await _userManager.GetRolesAsync(user);
        return MapToUserProfileDto(user, roles);
    }

    public async Task<CreateUserResponse> CreateUserAsync(CreateUserRequest request, string createdBy, CancellationToken cancellationToken = default)
    {
        var user = new ChurchRegisterWebUser
        {
            UserName = request.Email,
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            JobTitle = request.JobTitle,
            PhoneNumber = request.PhoneNumber,
            DateJoined = DateTime.UtcNow,
            AccountStatus = UserAccountStatus.Invited,
            CreatedDateTime = DateTime.UtcNow,
            CreatedBy = createdBy,
            ModifiedBy = createdBy
        };

        // Create user without password - they will set it via invitation
        var result = await _userManager.CreateAsync(user);
        if (!result.Succeeded)
        {
            throw new InvalidOperationException($"Failed to create user: {string.Join(", ", result.Errors.Select(e => e.Description))}");
        }

        // Assign roles with hierarchy validation
        var validatedRoles = await ValidateAndExpandRolesAsync(request.Roles, cancellationToken);
        await _userManager.AddToRolesAsync(user, validatedRoles);

        // Send invitation email if requested
        var invitationSent = false;
        if (request.SendInvitationEmail)
        {
            invitationSent = await SendInvitationEmailAsync(user, cancellationToken);
        }

        // Log the action
        await LogUserManagementActionAsync(user.Id, "CreateUser", createdBy, 
            $"Created user with roles: {string.Join(", ", validatedRoles)}", cancellationToken);

        var roles = await _userManager.GetRolesAsync(user);
        return new CreateUserResponse
        {
            UserId = user.Id,
            Message = invitationSent ? "User invited successfully" : "User created successfully",
            EmailVerificationSent = invitationSent,
            User = MapToUserProfileDto(user, roles)
        };
    }

    public async Task<UserProfileDto> UpdateUserAsync(UpdateUserRequest request, string modifiedBy, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(request.UserId);
        if (user == null)
        {
            throw new ArgumentException($"User with ID {request.UserId} not found");
        }

        // Update user properties
        user.FirstName = request.FirstName;
        user.LastName = request.LastName;
        user.JobTitle = request.JobTitle;
        user.PhoneNumber = request.PhoneNumber;
        user.ModifiedDateTime = DateTime.UtcNow;
        user.ModifiedBy = modifiedBy;

        var updateResult = await _userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            throw new InvalidOperationException($"Failed to update user: {string.Join(", ", updateResult.Errors.Select(e => e.Description))}");
        }

        // Update roles if provided
        if (request.Roles?.Any() == true)
        {
            var currentRoles = await _userManager.GetRolesAsync(user);
            var validatedRoles = await ValidateAndExpandRolesAsync(request.Roles, cancellationToken);
            
            await _userManager.RemoveFromRolesAsync(user, currentRoles);
            await _userManager.AddToRolesAsync(user, validatedRoles);
        }

        // Log the action
        await LogUserManagementActionAsync(user.Id, "UpdateUser", modifiedBy, 
            $"Updated user information", cancellationToken);

        var roles = await _userManager.GetRolesAsync(user);
        return MapToUserProfileDto(user, roles);
    }

    public async Task<UserProfileDto> UpdateUserStatusAsync(UpdateUserStatusRequest request, string modifiedBy, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(request.UserId);
        if (user == null)
        {
            throw new ArgumentException($"User with ID {request.UserId} not found");
        }

        var previousStatus = user.AccountStatus;
        user.AccountStatus = request.Action switch
        {
            UserStatusAction.Activate => UserAccountStatus.Active,
            UserStatusAction.Deactivate => UserAccountStatus.Inactive,
            UserStatusAction.Lock => UserAccountStatus.Locked,
            UserStatusAction.Unlock => UserAccountStatus.Active,
            _ => throw new ArgumentException($"Invalid status action: {request.Action}")
        };

        user.ModifiedDateTime = DateTime.UtcNow;
        user.ModifiedBy = modifiedBy;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            throw new InvalidOperationException($"Failed to update user status: {string.Join(", ", result.Errors.Select(e => e.Description))}");
        }

        // Log the action
        await LogUserManagementActionAsync(user.Id, $"UpdateStatus_{request.Action}", modifiedBy, 
            $"Changed status from {previousStatus} to {user.AccountStatus}. Reason: {request.Reason}", cancellationToken);

        var roles = await _userManager.GetRolesAsync(user);
        return MapToUserProfileDto(user, roles);
    }

    public async Task<UserProfileDto> AssignUserRolesAsync(AssignUserRolesRequest request, string modifiedBy, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(request.UserId);
        if (user == null)
        {
            throw new ArgumentException($"User with ID {request.UserId} not found");
        }

        var currentRoles = await _userManager.GetRolesAsync(user);
        var validatedRoles = await ValidateAndExpandRolesAsync(request.Roles, cancellationToken);

        await _userManager.RemoveFromRolesAsync(user, currentRoles);
        await _userManager.AddToRolesAsync(user, validatedRoles);

        // Log the action
        await LogUserManagementActionAsync(user.Id, "AssignRoles", modifiedBy, 
            $"Changed roles from [{string.Join(", ", currentRoles)}] to [{string.Join(", ", validatedRoles)}]", cancellationToken);

        var updatedRoles = await _userManager.GetRolesAsync(user);
        return MapToUserProfileDto(user, updatedRoles);
    }

    public async Task<IEnumerable<SystemRoleDto>> GetSystemRolesAsync(CancellationToken cancellationToken = default)
    {
        var roles = await _roleManager.Roles.ToListAsync(cancellationToken);
        return roles.Select(r => new SystemRoleDto
        {
            Id = r.Id,
            Name = r.Name!,
            DisplayName = r.Name!,
            Description = GetRoleDescription(r.Name!),
            Category = GetRoleCategory(r.Name!),
            IsHighPrivilege = IsHighPrivilegeRole(r.Name!)
        });
    }

    public string GenerateUserAvatar(string firstName, string lastName)
    {
        var initials = $"{firstName.FirstOrDefault()}{lastName.FirstOrDefault()}".ToUpper();
        return initials;
    }

    public async Task<IEnumerable<string>> ValidateAndExpandRolesAsync(IEnumerable<string> roles, CancellationToken cancellationToken = default)
    {
        var validRoles = new HashSet<string>();
        var allRoles = await _roleManager.Roles.Select(r => r.Name!).ToListAsync(cancellationToken);

        foreach (var role in roles)
        {
            if (allRoles.Contains(role))
            {
                validRoles.Add(role);
                
                // Add hierarchy rules - SystemAdministration includes all roles
                if (role == "SystemAdministration")
                {
                    foreach (var r in allRoles)
                    {
                        validRoles.Add(r);
                    }
                }
            }
        }

        return validRoles;
    }

    public async Task<bool> SendEmailVerificationAsync(ChurchRegisterWebUser user, CancellationToken cancellationToken = default)
    {
        try
        {
            var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            // In a real implementation, you would send an email with a verification link
            // For now, just mark as successful
            _logger.LogInformation("Email verification sent to {Email}", user.Email);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email verification to {Email}", user.Email);
            return false;
        }
    }

    public Task<bool> SendWelcomeEmailAsync(ChurchRegisterWebUser user, string? temporaryPassword = null, CancellationToken cancellationToken = default)
    {
        try
        {
            // In a real implementation, you would send a welcome email
            _logger.LogInformation("Welcome email sent to {Email}", user.Email);
            return Task.FromResult(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send welcome email to {Email}", user.Email);
            return Task.FromResult(false);
        }
    }

    public async Task<bool> SendInvitationEmailAsync(ChurchRegisterWebUser user, CancellationToken cancellationToken = default)
    {
        try
        {
            // Generate invitation token that combines email confirmation with setup
            var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            
            // In a real implementation, you would:
            // 1. Create invitation URL with token and user ID
            // 2. Send email with personalized invitation message
            // 3. Include link to setup page where user verifies email and sets password
            
            var invitationUrl = $"https://yourapp.com/setup-account?userId={user.Id}&token={Uri.EscapeDataString(token)}";
            
            _logger.LogInformation("Invitation email sent to {Email} with setup URL", user.Email);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send invitation email to {Email}", user.Email);
            return false;
        }
    }

    public async Task<bool> ResendInvitationAsync(string userId, CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                _logger.LogWarning("User with ID {UserId} not found for invitation resend", userId);
                return false;
            }

            if (user.AccountStatus != UserAccountStatus.Invited)
            {
                _logger.LogWarning("Cannot resend invitation to user {UserId} with status {Status}", userId, user.AccountStatus);
                return false;
            }

            // Resend the invitation email
            var emailSent = await SendInvitationEmailAsync(user, cancellationToken);
            
            if (emailSent)
            {
                _logger.LogInformation("Invitation email resent successfully to user {UserId} ({Email})", userId, user.Email);
            }

            return emailSent;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to resend invitation to user {UserId}", userId);
            return false;
        }
    }

    public async Task LogUserManagementActionAsync(string userId, string action, string performedBy, string? details = null, CancellationToken cancellationToken = default)
    {
        // In a real implementation, you would save to an audit log table
        _logger.LogInformation("User Management Action - User: {UserId}, Action: {Action}, Performed By: {PerformedBy}, Details: {Details}", 
            userId, action, performedBy, details);
        
        await Task.CompletedTask; // Placeholder for actual audit logging
    }

    private UserProfileDto MapToUserProfileDto(ChurchRegisterWebUser user, IEnumerable<string> roles)
    {
        return new UserProfileDto
        {
            Id = user.Id,
            Email = user.Email!,
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
            Roles = roles.ToArray(),
            Avatar = GenerateUserAvatar(user.FirstName, user.LastName),
            LastLogin = null // Not available in current entity
        };
    }

    private static IQueryable<ChurchRegisterWebUser> ApplySortingAscending(IQueryable<ChurchRegisterWebUser> query, string? sortBy)
    {
        return sortBy?.ToLower() switch
        {
            "firstname" => query.OrderBy(u => u.FirstName),
            "lastname" => query.OrderBy(u => u.LastName),
            "email" => query.OrderBy(u => u.Email),
            "jobtitle" => query.OrderBy(u => u.JobTitle),
            "datejoined" => query.OrderBy(u => u.DateJoined),
            "status" => query.OrderBy(u => u.AccountStatus),
            _ => query.OrderBy(u => u.FirstName)
        };
    }

    private static IQueryable<ChurchRegisterWebUser> ApplySortingDescending(IQueryable<ChurchRegisterWebUser> query, string? sortBy)
    {
        return sortBy?.ToLower() switch
        {
            "firstname" => query.OrderByDescending(u => u.FirstName),
            "lastname" => query.OrderByDescending(u => u.LastName),
            "email" => query.OrderByDescending(u => u.Email),
            "jobtitle" => query.OrderByDescending(u => u.JobTitle),
            "datejoined" => query.OrderByDescending(u => u.DateJoined),
            "status" => query.OrderByDescending(u => u.AccountStatus),
            _ => query.OrderByDescending(u => u.FirstName)
        };
    }

    private static string GenerateTemporaryPassword()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
        var random = new Random();
        var password = new StringBuilder();
        
        // Ensure at least one of each character type
        password.Append(chars[random.Next(0, 26)]); // Uppercase
        password.Append(chars[random.Next(26, 52)]); // Lowercase
        password.Append(chars[random.Next(52, 62)]); // Number
        password.Append(chars[random.Next(62, chars.Length)]); // Special char
        
        // Fill remaining positions
        for (int i = 4; i < 12; i++)
        {
            password.Append(chars[random.Next(chars.Length)]);
        }
        
        return password.ToString();
    }

    private static string GetRoleDescription(string roleName)
    {
        return roleName switch
        {
            "SystemAdministration" => "Full system administration access with all privileges",
            "FinancialAdministration" => "Manage financial records, donations, and budgets",
            "AttendanceAdministration" => "Manage attendance tracking and reporting",
            "MembershipAdministration" => "Manage church membership and member information",
            "EventsAdministration" => "Manage church events and activities",
            "CommunicationAdministration" => "Manage communications and announcements",
            _ => $"Standard {roleName} role access"
        };
    }

    private static string GetRoleCategory(string roleName)
    {
        return roleName switch
        {
            "SystemAdministration" => "System",
            "FinancialAdministration" => "Financial",
            "AttendanceAdministration" => "Operations",
            "MembershipAdministration" => "Membership",
            "EventsAdministration" => "Events",
            "CommunicationAdministration" => "Communications",
            _ => "General"
        };
    }

    private static bool IsHighPrivilegeRole(string roleName)
    {
        return roleName == "SystemAdministration";
    }
}