using ChurchRegister.ApiService.Models.Districts;
using ChurchRegister.ApiService.Models.ChurchMembers;

namespace ChurchRegister.ApiService.Services.Districts;

/// <summary>
/// Service interface for district operations
/// </summary>
public interface IDistrictService
{
    /// <summary>
    /// Get all districts with deacon, officer, and member count information
    /// </summary>
    /// <returns>List of all districts with assignments</returns>
    Task<List<DistrictDto>> GetAllDistrictsAsync();

    /// <summary>
    /// Get all active church members with Deacon role
    /// </summary>
    /// <returns>List of active deacons</returns>
    Task<List<ChurchMemberSummaryDto>> GetActiveDeaconsAsync();

    /// <summary>
    /// Get all active church members with District Officer role
    /// </summary>
    /// <param name="excludeMemberId">Optional member ID to exclude from results</param>
    /// <returns>List of active district officers</returns>
    Task<List<ChurchMemberSummaryDto>> GetActiveDistrictOfficersAsync(int? excludeMemberId = null);

    /// <summary>
    /// Assign a deacon to a district
    /// </summary>
    /// <param name="districtId">District ID</param>
    /// <param name="deaconId">Deacon member ID (null to unassign)</param>
    /// <returns>Updated district DTO</returns>
    Task<DistrictDto> AssignDeaconAsync(int districtId, int? deaconId);

    /// <summary>
    /// Assign a district officer to a district
    /// </summary>
    /// <param name="districtId">District ID</param>
    /// <param name="districtOfficerId">District officer member ID (null to unassign)</param>
    /// <returns>Updated district DTO</returns>
    Task<DistrictDto> AssignDistrictOfficerAsync(int districtId, int? districtOfficerId);

    /// <summary>
    /// Get districts export data for PDF generation
    /// Only includes districts with assigned deacon and their active members
    /// </summary>
    /// <returns>List of districts with member details for export</returns>
    Task<List<DistrictExportDto>> GetDistrictsForExportAsync();
}
