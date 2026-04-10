using ChurchRegister.ApiService.UseCase.ChurchMembers.ExportEnvelopeNumbers;
using ChurchRegister.Database.Constants;
using FastEndpoints;

namespace ChurchRegister.ApiService.Endpoints.ChurchMembers;

/// <summary>
/// GET /api/church-members/export/envelope-numbers?year={year}
/// Returns Envelope Number Review Excel workbook. Always HTTP 200; blank New Number if not yet generated.
/// </summary>
public class ExportEnvelopeNumbersEndpoint : EndpointWithoutRequest
{
    private readonly IExportEnvelopeNumbersUseCase _useCase;

    public ExportEnvelopeNumbersEndpoint(IExportEnvelopeNumbersUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Get("/api/church-members/export/envelope-numbers");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.ChurchMembersViewer, SystemRoles.ChurchMembersContributor, SystemRoles.ChurchMembersAdministrator);
        Description(x => x
            .WithName("ExportEnvelopeNumbers")
            .WithSummary("Export envelope number review as Excel")
            .WithDescription("Generates an Excel workbook containing active envelope recipients with current and new register numbers for the given year.")
            .Produces<byte[]>(200, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
            .WithTags("ChurchMembers"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var yearParam = Query<string?>("year", isRequired: false);

        var year = int.TryParse(yearParam, out var parsedYear)
            ? parsedYear
            : DateTime.UtcNow.Year + 1;

        var excelBytes = await _useCase.ExecuteAsync(year, ct);

        await Send.BytesAsync(
            bytes: excelBytes,
            fileName: $"Envelope-Numbers-{year}.xlsx",
            contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            cancellation: ct);
    }
}
