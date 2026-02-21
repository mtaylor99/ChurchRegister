using FastEndpoints;
using ChurchRegister.ApiService.Services.ChurchMembers;
using ChurchRegister.ApiService.Models.ChurchMembers;

namespace ChurchRegister.ApiService.Endpoints.ChurchMembers;

/// <summary>
/// Endpoint to check register number generation status for a specific year
/// </summary>
public class CheckRegisterNumberStatusEndpoint : EndpointWithoutRequest<CheckGenerationStatusResponse>
{
    private readonly IRegisterNumberService _registerNumberService;

    public CheckRegisterNumberStatusEndpoint(IRegisterNumberService registerNumberService)
    {
        _registerNumberService = registerNumberService;
    }

    public override void Configure()
    {
        Get("/api/register-numbers/status/{year}");
        AllowAnonymous(); // Or configure with appropriate authorization
        Description(b => b
            .WithName("CheckRegisterNumberStatus")
            .WithDisplayName("Check Register Number Generation Status")
            .WithSummary("Check if register numbers have been generated for a specific year")
            .Produces<CheckGenerationStatusResponse>(200)
            .Produces(404));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var year = Route<int>("year");

        if (year < 2000 || year > 2100)
        {
            await SendErrorsAsync(404, ct);
            return;
        }

        var status = await _registerNumberService.GetGenerationStatusAsync(year, ct);

        await SendOkAsync(status, ct);
    }
}
