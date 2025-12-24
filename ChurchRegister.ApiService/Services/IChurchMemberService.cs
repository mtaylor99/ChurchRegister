using ChurchRegister.ApiService.Models.Administration;

namespace ChurchRegister.ApiService.Services;

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
    /// Get all available church member role types
    /// </summary>
    Task<IEnumerable<ChurchMemberRoleDto>> GetRolesAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Get all available church member statuses
    /// </summary>
    Task<IEnumerable<ChurchMemberStatusDto>> GetStatusesAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Get dashboard statistics for church members
    /// </summary>
    Task<DashboardStatisticsResponse> GetDashboardStatisticsAsync(CancellationToken cancellationToken = default);
}
