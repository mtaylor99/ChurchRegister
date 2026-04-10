using ChurchRegister.ApiService.Models;
using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.ApiService.Models.Districts;
using ChurchRegister.ApiService.Models.Security;
using ChurchRegister.ApiService.Models.Attendance;
using ChurchRegister.ApiService.Models.Dashboard;
using ChurchRegister.ApiService.Models.PastoralCare;

namespace ChurchRegister.ApiService.Services.ChurchMembers;

/// <summary>
/// Service interface for comprehensive church member management operations
/// Provides business logic layer for member CRUD operations, role management, and status updates
/// </summary>
public interface IChurchMemberService
{
    /// <summary>
    /// Get paginated church members with search and filtering
    /// </summary>
    Task<PagedResult<ChurchMemberDto>> GetChurchMembersAsync(ChurchMemberGridQuery query, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get church member by ID with full details
    /// </summary>
    Task<ChurchMemberDetailDto?> GetChurchMemberByIdAsync(int memberId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Create a new church member with role assignment
    /// </summary>
    Task<CreateChurchMemberResponse> CreateChurchMemberAsync(CreateChurchMemberRequest request, string createdBy, CancellationToken cancellationToken = default);

    /// <summary>
    /// Update church member information with audit logging
    /// </summary>
    Task<ChurchMemberDetailDto> UpdateChurchMemberAsync(UpdateChurchMemberRequest request, string modifiedBy, CancellationToken cancellationToken = default);

    /// <summary>
    /// Update church member status with optional note
    /// </summary>
    Task<ChurchMemberDetailDto> UpdateChurchMemberStatusAsync(int memberId, UpdateChurchMemberStatusRequest request, string modifiedBy, CancellationToken cancellationToken = default);

    /// <summary>
    /// Delete church member (hard delete - for members entered in error)
    /// </summary>
    Task DeleteChurchMemberAsync(int memberId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get all available church member role types
    /// </summary>
    Task<IEnumerable<ChurchMemberRoleDto>> GetRolesAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Get all available church member statuses
    /// </summary>
    Task<IEnumerable<ChurchMemberStatusDto>> GetStatusesAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Assign a district to a church member
    /// </summary>
    Task<ChurchMemberDetailDto> AssignDistrictAsync(int memberId, AssignDistrictRequest request, string modifiedBy, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get pastoral care report data for members requiring pastoral care, grouped by district
    /// </summary>
    Task<PastoralCareReportDto> GetPastoralCareReportDataAsync(CancellationToken cancellationToken = default);
}
