using FastEndpoints;
using ChurchRegister.ApiService.UseCase.Districts;
using ChurchRegister.Database.Constants;

namespace ChurchRegister.ApiService.Endpoints.Districts;

/// <summary>
/// Endpoint for exporting districts with members as PDF
/// </summary>
public class ExportDistrictsEndpoint : EndpointWithoutRequest
{
    private readonly IExportDistrictsUseCase _useCase;

    public ExportDistrictsEndpoint(IExportDistrictsUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Get("/api/districts/export");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.ChurchMembersViewer, SystemRoles.ChurchMembersContributor, SystemRoles.ChurchMembersAdministrator);
        Description(x => x
            .WithName("ExportDistricts")
            .WithSummary("Export districts as PDF")
            .WithDescription("Generates a PDF report containing districts with assigned deacons and their active members. Each district starts on a new page.")
            .Produces<byte[]>(200, "application/pdf")
            .WithTags("Districts"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var pdfBytes = await _useCase.ExecuteAsync(ct);
        
        var fileName = $"Districts-Report-{DateTime.Now:yyyy-MM-dd}.pdf";
        
        await SendBytesAsync(
            bytes: pdfBytes,
            fileName: fileName,
            contentType: "application/pdf",
            cancellation: ct);
    }
}
