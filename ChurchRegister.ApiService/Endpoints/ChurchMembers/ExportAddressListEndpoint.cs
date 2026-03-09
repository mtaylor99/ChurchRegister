using ChurchRegister.ApiService.UseCase.ChurchMembers.ExportAddressList;
using ChurchRegister.Database.Constants;
using FastEndpoints;

namespace ChurchRegister.ApiService.Endpoints.ChurchMembers;

public class ExportAddressListEndpoint : EndpointWithoutRequest
{
    private readonly IExportAddressListUseCase _useCase;

    public ExportAddressListEndpoint(IExportAddressListUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Get("/api/church-members/export/address-list");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.ChurchMembersViewer, SystemRoles.ChurchMembersContributor, SystemRoles.ChurchMembersAdministrator);
        Description(x => x
            .WithName("ExportAddressList")
            .WithSummary("Export address list as Excel")
            .WithDescription("Generates an Excel workbook listing active members grouped by address with combined names and address details.")
            .Produces<byte[]>(200, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
            .WithTags("ChurchMembers"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var excelBytes = await _useCase.ExecuteAsync(ct);

        await Send.BytesAsync(
            bytes: excelBytes,
            fileName: $"Address-List-{DateTime.Now:yyyy-MM-dd}.xlsx",
            contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            cancellation: ct);
    }
}
