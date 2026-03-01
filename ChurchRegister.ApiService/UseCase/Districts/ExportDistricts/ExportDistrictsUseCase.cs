using ChurchRegister.ApiService.Services.Districts;

namespace ChurchRegister.ApiService.UseCase.Districts.ExportDistricts;

/// <summary>
/// Use case for exporting districts as PDF
/// </summary>
public class ExportDistrictsUseCase : IExportDistrictsUseCase
{
    private readonly IDistrictService _districtService;
    private readonly DistrictPdfService _pdfService;
    private readonly ILogger<ExportDistrictsUseCase> _logger;

    public ExportDistrictsUseCase(
        IDistrictService districtService,
        DistrictPdfService pdfService,
        ILogger<ExportDistrictsUseCase> logger)
    {
        _districtService = districtService;
        _pdfService = pdfService;
        _logger = logger;
    }

    public async Task<byte[]> ExecuteAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Generating district export PDF");

        // Get districts data
        var districts = await _districtService.GetDistrictsForExportAsync();

        _logger.LogInformation("Exporting {Count} districts with assigned deacons", districts.Count);

        // Generate PDF
        var pdfBytes = _pdfService.GenerateDistrictReport(districts);

        _logger.LogInformation("District export PDF generated successfully ({Size} bytes)", pdfBytes.Length);

        return pdfBytes;
    }
}
