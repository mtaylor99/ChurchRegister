using ChurchRegister.ApiService.UseCase.ChurchMembers.ExportRegisterNumbers;
using ChurchRegister.Database.Constants;
using FastEndpoints;

namespace ChurchRegister.ApiService.Endpoints.ChurchMembers;

public class ExportRegisterNumbersEndpoint : EndpointWithoutRequest
{
    private readonly IExportRegisterNumbersUseCase _useCase;

    public ExportRegisterNumbersEndpoint(IExportRegisterNumbersUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Get("/api/register-numbers/export/{year}");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.FinancialAdministrator);
        Description(x => x
            .WithName("ExportRegisterNumbers")
            .WithSummary("Export register number preview as Excel")
            .WithDescription("Generates a single-sheet Excel workbook with the Baptised, Non-Baptised and Non-Member register number grids side by side.")
            .Produces<byte[]>(200, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
            .WithTags("ChurchMembers"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var year = Route<int>("year");
        var excelBytes = await _useCase.ExecuteAsync(year, ct);

        await Send.BytesAsync(
            bytes: excelBytes,
            fileName: $"Register-Numbers-{year}.xlsx",
            contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            cancellation: ct);
    }
}
