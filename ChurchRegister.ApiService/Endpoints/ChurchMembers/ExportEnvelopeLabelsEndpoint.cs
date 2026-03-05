using ChurchRegister.ApiService.UseCase.ChurchMembers.ExportEnvelopeLabels;
using ChurchRegister.Database.Constants;
using FastEndpoints;

namespace ChurchRegister.ApiService.Endpoints.ChurchMembers;

/// <summary>
/// GET /api/church-members/export/envelope-labels?year={year}
/// Returns Avery L7163 envelope label PDF for active envelope recipients in the given year.
/// </summary>
public class ExportEnvelopeLabelsEndpoint : EndpointWithoutRequest
{
    private readonly IExportEnvelopeLabelsUseCase _useCase;

    public ExportEnvelopeLabelsEndpoint(IExportEnvelopeLabelsUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Get("/api/church-members/export/envelope-labels");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.ChurchMembersViewer, SystemRoles.ChurchMembersContributor, SystemRoles.ChurchMembersAdministrator);
        Description(x => x
            .WithName("ExportEnvelopeLabels")
            .WithSummary("Export envelope labels as PDF")
            .WithDescription("Generates an Avery L7163 PDF containing envelope labels for active envelope recipients ordered by register number for the given year.")
            .Produces<byte[]>(200, "application/pdf")
            .WithTags("ChurchMembers"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var yearParam = Query<string?>("year", isRequired: false);

        var year = int.TryParse(yearParam, out var parsedYear)
            ? parsedYear
            : DateTime.UtcNow.Year + 1;

        var pdfBytes = await _useCase.ExecuteAsync(year, ct);

        await Send.BytesAsync(
            bytes: pdfBytes,
            fileName: $"Envelope-Labels-{year}.pdf",
            contentType: "application/pdf",
            cancellation: ct);
    }
}
