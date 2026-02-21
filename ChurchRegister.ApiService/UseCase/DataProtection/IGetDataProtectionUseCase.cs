using ChurchRegister.ApiService.Models;
using ChurchRegister.ApiService.Models.DataProtection;

namespace ChurchRegister.ApiService.UseCase.DataProtection;

/// <summary>
/// Use case for retrieving data protection consent information for a church member
/// </summary>
public interface IGetDataProtectionUseCase
{
    /// <summary>
    /// Retrieves data protection consent information for a specific church member
    /// </summary>
    /// <param name="memberId">The ID of the church member</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Data protection consent information</returns>
    Task<DataProtectionDto?> ExecuteAsync(int memberId, CancellationToken cancellationToken = default);
}
