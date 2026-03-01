using ChurchRegister.ApiService.Models;
using ChurchRegister.ApiService.Models.DataProtection;

namespace ChurchRegister.ApiService.UseCase.DataProtection.UpdateDataProtection;

/// <summary>
/// Use case for updating data protection consent information for a church member
/// </summary>
public interface IUpdateDataProtectionUseCase
{
    /// <summary>
    /// Updates data protection consent information for a specific church member
    /// </summary>
    /// <param name="memberId">The ID of the church member</param>
    /// <param name="request">The consent preferences to update</param>
    /// <param name="username">The username of the user making the update</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated data protection consent information</returns>
    Task<DataProtectionDto?> ExecuteAsync(
        int memberId,
        UpdateDataProtectionRequest request,
        string username,
        CancellationToken cancellationToken = default);
}
