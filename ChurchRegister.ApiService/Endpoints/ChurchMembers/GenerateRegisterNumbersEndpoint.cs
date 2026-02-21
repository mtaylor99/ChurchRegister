using FastEndpoints;
using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.ApiService.UseCase.ChurchMembers.GenerateRegisterNumbers;
using ChurchRegister.Database.Constants;
using ChurchRegister.Database.Data;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;

namespace ChurchRegister.ApiService.Endpoints.ChurchMembers;

/// <summary>
/// Endpoint for generating register numbers for a target year
/// </summary>
public class GenerateRegisterNumbersEndpoint : Endpoint<Models.ChurchMembers.GenerateRegisterNumbersRequest, GenerateRegisterNumbersResponse>
{
    private readonly IGenerateRegisterNumbersUseCase _useCase;
    private readonly UserManager<ChurchRegisterWebUser> _userManager;

    public GenerateRegisterNumbersEndpoint(
        IGenerateRegisterNumbersUseCase useCase,
        UserManager<ChurchRegisterWebUser> userManager)
    {
        _useCase = useCase;
        _userManager = userManager;
    }

    public override void Configure()
    {
        Post("/api/register-numbers/generate");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.FinancialAdministrator);
        Description(x => x
            .WithName("GenerateRegisterNumbers")
            .WithSummary("Generate register numbers for all active members")
            .WithDescription("Generates and persists register numbers for all active members for the target year")
            .WithTags("ChurchMembers"));
    }

    public override async Task HandleAsync(Models.ChurchMembers.GenerateRegisterNumbersRequest req, CancellationToken ct)
    {
        var result = await _useCase.ExecuteAsync(req, ct);
        
        // Update GeneratedBy with current user's full name
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!string.IsNullOrEmpty(userId))
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user != null)
            {
                result.GeneratedBy = $"{user.FirstName} {user.LastName}";
            }
            else
            {
                result.GeneratedBy = User.Identity?.Name ?? "System";
            }
        }
        else
        {
            result.GeneratedBy = "System";
        }
        
        await SendOkAsync(result, ct);
    }
}
