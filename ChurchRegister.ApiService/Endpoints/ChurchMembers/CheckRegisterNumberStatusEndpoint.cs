using FastEndpoints;
using ChurchRegister.ApiService.Services.ChurchMembers;
using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.Database.Data;
using Microsoft.AspNetCore.Identity;

namespace ChurchRegister.ApiService.Endpoints.ChurchMembers;

/// <summary>
/// Endpoint to check register number generation status for a specific year
/// </summary>
public class CheckRegisterNumberStatusEndpoint : EndpointWithoutRequest<CheckGenerationStatusResponse>
{
    private readonly IRegisterNumberService _registerNumberService;
    private readonly UserManager<ChurchRegisterWebUser> _userManager;

    public CheckRegisterNumberStatusEndpoint(
        IRegisterNumberService registerNumberService,
        UserManager<ChurchRegisterWebUser> userManager)
    {
        _registerNumberService = registerNumberService;
        _userManager = userManager;
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
            await Send.ErrorsAsync(404, ct);
            return;
        }

        var status = await _registerNumberService.GetGenerationStatusAsync(year, ct);

        // Resolve user ID to a friendly display name
        if (!string.IsNullOrEmpty(status.GeneratedBy))
        {
            var user = await _userManager.FindByIdAsync(status.GeneratedBy);
            if (user != null)
                status.GeneratedBy = $"{user.FirstName} {user.LastName}".Trim();
        }

        await Send.OkAsync(status, ct);
    }
}
