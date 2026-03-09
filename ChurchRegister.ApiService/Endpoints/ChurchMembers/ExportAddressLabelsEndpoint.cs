using ChurchRegister.ApiService.UseCase.ChurchMembers.ExportAddressLabels;
using ChurchRegister.Database.Constants;
using FastEndpoints;

namespace ChurchRegister.ApiService.Endpoints.ChurchMembers;

/// <summary>
/// GET /api/church-members/export/address-labels
/// Returns Avery L7163 address label PDF — one label per unique address.
/// </summary>
public class ExportAddressLabelsEndpoint : EndpointWithoutRequest
{
    private readonly IExportAddressLabelsUseCase _useCase;

    public ExportAddressLabelsEndpoint(IExportAddressLabelsUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Get("/api/church-members/export/address-labels");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.ChurchMembersViewer, SystemRoles.ChurchMembersContributor, SystemRoles.ChurchMembersAdministrator);
        Description(x => x
            .WithName("ExportAddressLabels")
            .WithSummary("Export address labels as PDF")
            .WithDescription("Generates an Avery L7163 PDF containing one address label per unique address, with combined names for co-residents.")
            .Produces<byte[]>(200, "application/pdf")
            .WithTags("ChurchMembers"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var pdfBytes = await _useCase.ExecuteAsync(ct);

        await Send.BytesAsync(
            bytes: pdfBytes,
            fileName: $"Address-Labels-{DateTime.Now:yyyy-MM-dd}.pdf",
            contentType: "application/pdf",
            cancellation: ct);
    }
}
