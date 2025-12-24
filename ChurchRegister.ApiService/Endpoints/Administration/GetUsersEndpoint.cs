using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using FastEndpoints;
using ChurchRegister.Database.Data;
using ChurchRegister.ApiService.Models.Administration;
using ChurchRegister.Database.Enums;

namespace ChurchRegister.ApiService.Endpoints.Administration;

/// <summary>
/// Endpoint for retrieving users with pagination, search, and filtering
/// </summary>
public class GetUsersEndpoint : Endpoint<UserGridQuery, PagedResult<UserProfileDto>>
{
    private readonly ChurchRegisterWebContext _context;
    private readonly UserManager<ChurchRegisterWebUser> _userManager;

    public GetUsersEndpoint(ChurchRegisterWebContext context, UserManager<ChurchRegisterWebUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    public override void Configure()
    {
        Get("/api/administration/users");
        Policies("Bearer");
        Roles("SystemAdministration");
        Description(x => x
            .WithName("GetUsers")
            .WithSummary("Get users with pagination, search, and filtering")
            .WithDescription("Retrieves a paginated list of users with optional search and filtering capabilities")
            .WithTags("Administration"));
    }

    public override async Task HandleAsync(UserGridQuery req, CancellationToken ct)
    {
        try
        {
            var query = _context.Users.AsQueryable();

            // Apply search filter
            if (!string.IsNullOrWhiteSpace(req.SearchTerm))
            {
                var searchTerm = req.SearchTerm.ToLower().Trim();
                query = query.Where(u => 
                    u.FirstName.ToLower().Contains(searchTerm) ||
                    u.LastName.ToLower().Contains(searchTerm) ||
                    (u.Email != null && u.Email.ToLower().Contains(searchTerm)) ||
                    (u.JobTitle != null && u.JobTitle.ToLower().Contains(searchTerm)));
            }

            // Apply status filter
            if (req.StatusFilter.HasValue)
            {
                query = query.Where(u => u.AccountStatus == req.StatusFilter.Value);
            }

            // Apply role filter
            if (!string.IsNullOrWhiteSpace(req.RoleFilter))
            {
                var role = await _context.Roles.FirstOrDefaultAsync(r => r.Name == req.RoleFilter, ct);
                if (role != null)
                {
                    var roleUsers = await _context.UserRoles
                        .Where(ur => ur.RoleId == role.Id)
                        .Select(ur => ur.UserId)
                        .ToListAsync(ct);

                    query = query.Where(u => roleUsers.Contains(u.Id));
                }
            }

            // Get total count before pagination
            var totalCount = await query.CountAsync(ct);

            // Apply sorting
            query = req.SortDirection?.ToLower() == "desc"
                ? ApplySortingDescending(query, req.SortBy ?? "Email")
                : ApplySortingAscending(query, req.SortBy ?? "Email");

            // Apply pagination
            var users = await query
                .Skip((req.Page - 1) * req.PageSize)
                .Take(req.PageSize)
                .ToListAsync(ct);

            // Convert to DTOs with role information
            var userDtos = new List<UserProfileDto>();
            
            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);
                
                userDtos.Add(new UserProfileDto
                {
                    Id = user.Id,
                    Email = user.Email ?? string.Empty,
                    FirstName = user.FirstName ?? string.Empty,
                    LastName = user.LastName ?? string.Empty,
                    JobTitle = user.JobTitle,
                    PhoneNumber = user.PhoneNumber,
                    Status = user.AccountStatus,
                    DateJoined = user.DateJoined,
                    EmailConfirmed = user.EmailConfirmed,
                    CreatedAt = user.CreatedDateTime,
                    LastModified = user.ModifiedDateTime,
                    ModifiedBy = user.ModifiedBy,
                    Roles = roles.ToArray()
                });
            }

            var result = new PagedResult<UserProfileDto>
            {
                Items = userDtos,
                TotalCount = totalCount,
                CurrentPage = req.Page,
                PageSize = req.PageSize
            };

            await SendOkAsync(result, ct);
        }
        catch (Exception ex)
        {
            ThrowError($"Failed to retrieve users: {ex.Message}");
        }
    }

    private static IQueryable<ChurchRegisterWebUser> ApplySortingAscending(IQueryable<ChurchRegisterWebUser> query, string sortField)
    {
        return sortField.ToLower() switch
        {
            "firstname" => query.OrderBy(u => u.FirstName),
            "lastname" => query.OrderBy(u => u.LastName),
            "email" => query.OrderBy(u => u.Email),
            "jobtitle" => query.OrderBy(u => u.JobTitle),
            "accountstatus" => query.OrderBy(u => u.AccountStatus),
            "datejoined" => query.OrderBy(u => u.DateJoined),
            "createddatetime" => query.OrderBy(u => u.CreatedDateTime),
            _ => query.OrderBy(u => u.Email)
        };
    }

    private static IQueryable<ChurchRegisterWebUser> ApplySortingDescending(IQueryable<ChurchRegisterWebUser> query, string sortField)
    {
        return sortField.ToLower() switch
        {
            "firstname" => query.OrderByDescending(u => u.FirstName),
            "lastname" => query.OrderByDescending(u => u.LastName),
            "email" => query.OrderByDescending(u => u.Email),
            "jobtitle" => query.OrderByDescending(u => u.JobTitle),
            "accountstatus" => query.OrderByDescending(u => u.AccountStatus),
            "datejoined" => query.OrderByDescending(u => u.DateJoined),
            "createddatetime" => query.OrderByDescending(u => u.CreatedDateTime),
            _ => query.OrderByDescending(u => u.Email)
        };
    }
}