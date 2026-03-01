using ChurchRegister.ApiService.Models.Districts;

namespace ChurchRegister.ApiService.UseCase.Districts.GetDistricts;

/// <summary>
/// Use case interface for retrieving all districts
/// </summary>
public interface IGetDistrictsUseCase
{
    /// <summary>
    /// Execute the use case to get all districts
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of all districts</returns>
    Task<List<DistrictDto>> ExecuteAsync(CancellationToken cancellationToken = default);
}
