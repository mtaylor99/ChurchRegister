using FastEndpoints;
using ChurchRegister.ApiService.UseCase.ChurchMembers.ExportPastoralCareReport;
using ChurchRegister.Database.Constants;

namespace ChurchRegister.ApiService.Endpoints.ChurchMembers;

/// <summary>
/// Endpoint for exporting pastoral care report as PDF
/// </summary>
public class ExportPastoralCareReportEndpoint : EndpointWithoutRequest
{
    private readonly IExportPastoralCareReportUseCase _useCase;

    public ExportPastoralCareReportEndpoint(IExportPastoralCareReportUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Get("/api/church-members/pastoral-care/export");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.ChurchMembersContributor, SystemRoles.ChurchMembersAdministrator);
        Description(x => x
            .WithName("ExportPastoralCareReport")
            .WithSummary("Export pastoral care report as PDF")
            .WithDescription("Generates a PDF report containing members requiring pastoral care, grouped by district with deacon information")
            .Produces<byte[]>(200, "application/pdf")
            .WithTags("ChurchMembers"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var pdfBytes = await _useCase.ExecuteAsync(ct);

        var fileName = $"Pastoral-Care-Report-{DateTime.Now:yyyy-MM-dd}.pdf";

        await SendBytesAsync(
            bytes: pdfBytes,
            fileName: fileName,
            contentType: "application/pdf",
            cancellation: ct);
    }
}
