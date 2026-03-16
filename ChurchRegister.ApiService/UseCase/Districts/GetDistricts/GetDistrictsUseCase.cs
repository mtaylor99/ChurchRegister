using ChurchRegister.ApiService.Models.Districts;
using ChurchRegister.ApiService.Services.Districts;

namespace ChurchRegister.ApiService.UseCase.Districts.GetDistricts;

/// <summary>
/// Use case for retrieving all districts
/// </summary>
public class GetDistrictsUseCase : IGetDistrictsUseCase
{
    private readonly IDistrictService _districtService;
    private readonly ILogger<GetDistrictsUseCase> _logger;

    public GetDistrictsUseCase(IDistrictService districtService, ILogger<GetDistrictsUseCase> logger)
    {
        _districtService = districtService;
        _logger = logger;
    }

    public async Task<List<DistrictDto>> ExecuteAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Retrieving all districts");

        var districts = await _districtService.GetAllDistrictsAsync();

        _logger.LogInformation("Retrieved {Count} districts", districts.Count);

        return districts;
    }
}
