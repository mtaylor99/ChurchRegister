using FastEndpoints;
using ChurchRegister.ApiService.UseCase.Districts.ExportDistrictsMemberList;

namespace ChurchRegister.ApiService.Endpoints.Districts;

/// <summary>
/// Endpoint for exporting a per-district member list as PDF
/// </summary>
public class ExportDistrictsMemberListEndpoint : EndpointWithoutRequest
{
    private readonly IExportDistrictsMemberListUseCase _useCase;

    public ExportDistrictsMemberListEndpoint(IExportDistrictsMemberListUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Get("/api/districts/export-members-list");
        Policies("Bearer");
        Description(x => x
            .WithName("ExportDistrictsMemberList")
            .WithSummary("Export districts member list as PDF")
            .WithDescription("Generates a printable PDF listing active members grouped by district. Each district starts on a new page. Includes an unassigned members page at the end if applicable.")
            .Produces<byte[]>(200, "application/pdf")
            .WithTags("Districts"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var pdfBytes = await _useCase.ExecuteAsync(ct);

        var fileName = $"Districts-Members-List-{DateTime.UtcNow:yyyy-MM-dd}.pdf";

        await Send.BytesAsync(
            bytes: pdfBytes,
            fileName: fileName,
            contentType: "application/pdf",
            cancellation: ct);
    }
}
