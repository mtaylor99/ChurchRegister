using FastEndpoints;
using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.ApiService.UseCase.ChurchMembers.PreviewRegisterNumbers;
using ChurchRegister.Database.Constants;

namespace ChurchRegister.ApiService.Endpoints.ChurchMembers;

/// <summary>
/// Endpoint for previewing register number assignments for a target year
/// </summary>
public class PreviewRegisterNumbersEndpoint : EndpointWithoutRequest<PreviewRegisterNumbersResponse>
{
    private readonly IPreviewRegisterNumbersUseCase _useCase;

    public PreviewRegisterNumbersEndpoint(IPreviewRegisterNumbersUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Get("/api/register-numbers/preview/{year}");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.FinancialAdministrator);
        Description(x => x
            .WithName("PreviewRegisterNumbers")
            .WithSummary("Preview register number assignments for a target year")
            .WithDescription("Generates a preview of register number assignments without saving to database")
            .WithTags("ChurchMembers"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var year = Route<int>("year");
        var result = await _useCase.ExecuteAsync(year, ct);
        await SendOkAsync(result, ct);
    }
}
