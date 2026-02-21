using ChurchRegister.ApiService.Models.DataProtection;

namespace ChurchRegister.ApiService.Services.DataProtection;

/// <summary>
/// Service interface for data protection consent management operations
/// Provides business logic for managing GDPR-compliant consent preferences
/// </summary>
public interface IDataProtectionService
{
    /// <summary>
    /// Get data protection consent record for a church member
    /// </summary>
    /// <param name="churchMemberId">Church member identifier</param>
    /// <returns>Data protection consent record</returns>
    /// <exception cref="NotFoundException">Thrown when data protection record not found</exception>
    Task<DataProtectionDto> GetDataProtectionAsync(int churchMemberId);

    /// <summary>
    /// Update data protection consent preferences for a church member
    /// </summary>
    /// <param name="churchMemberId">Church member identifier</param>
    /// <param name="request">Updated consent preferences</param>
    /// <param name="modifiedBy">Username of user making the change</param>
    /// <returns>Updated data protection consent record</returns>
    /// <exception cref="NotFoundException">Thrown when data protection record not found</exception>
    Task<DataProtectionDto> UpdateDataProtectionAsync(int churchMemberId, UpdateDataProtectionRequest request, string modifiedBy);
}
