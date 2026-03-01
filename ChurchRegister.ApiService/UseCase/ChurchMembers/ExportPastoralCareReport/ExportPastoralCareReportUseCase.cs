using ChurchRegister.ApiService.Services.ChurchMembers;
using ChurchRegister.ApiService.Services.PastoralCare;

namespace ChurchRegister.ApiService.UseCase.ChurchMembers.ExportPastoralCareReport;

/// <summary>
/// Use case for exporting pastoral care report as PDF
/// </summary>
public class ExportPastoralCareReportUseCase : IExportPastoralCareReportUseCase
{
    private readonly IChurchMemberService _churchMemberService;
    private readonly IPastoralCarePdfService _pdfService;
    private readonly ILogger<ExportPastoralCareReportUseCase> _logger;

    public ExportPastoralCareReportUseCase(
        IChurchMemberService churchMemberService,
        IPastoralCarePdfService pdfService,
        ILogger<ExportPastoralCareReportUseCase> logger)
    {
        _churchMemberService = churchMemberService;
        _pdfService = pdfService;
        _logger = logger;
    }

    public async Task<byte[]> ExecuteAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Generating pastoral care report PDF");

        // Get pastoral care report data
        var reportData = await _churchMemberService.GetPastoralCareReportDataAsync(cancellationToken);

        _logger.LogInformation("Exporting pastoral care report with {DistrictCount} districts and {MemberCount} members",
            reportData.Districts.Length, reportData.TotalMembers);

        // Generate PDF
        var pdfBytes = await _pdfService.GeneratePastoralCareReportAsync(reportData, cancellationToken);

        _logger.LogInformation("Pastoral care report PDF generated successfully ({Size} bytes)", pdfBytes.Length);

        return pdfBytes;
    }
}
