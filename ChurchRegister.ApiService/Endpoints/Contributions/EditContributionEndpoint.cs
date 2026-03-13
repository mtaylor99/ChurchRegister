using FastEndpoints;
using ChurchRegister.ApiService.UseCase.Contributions.EditContribution;
using ChurchRegister.Database.Constants;

namespace ChurchRegister.ApiService.Endpoints.Contributions;

/// <summary>
/// Request model for editing a contribution
/// </summary>
public class EditContributionRequest
{
    /// <summary>
    /// Contribution ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// New amount for the contribution
    /// </summary>
    public decimal Amount { get; set; }
}

/// <summary>
/// Endpoint for editing a contribution amount
/// </summary>
public class EditContributionEndpoint : Endpoint<EditContributionRequest>
{
    private readonly IEditContributionUseCase _useCase;
    private readonly ILogger<EditContributionEndpoint> _logger;

    public EditContributionEndpoint(
        IEditContributionUseCase useCase,
        ILogger<EditContributionEndpoint> logger)
    {
        _useCase = useCase;
        _logger = logger;
    }

    public override void Configure()
    {
        Put("/api/contributions/{Id}");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration,
              SystemRoles.FinancialContributor,
              SystemRoles.FinancialAdministrator);
        Description(x => x
            .WithName("EditContribution")
            .WithSummary("Edit a contribution amount")
            .WithDescription("Updates the amount of a manual one-off contribution. Bank statement and envelope batch contributions cannot be edited.")
            .WithTags("Contributions"));
    }

    public override async Task HandleAsync(EditContributionRequest req, CancellationToken ct)
    {
        try
        {
            await _useCase.ExecuteAsync(req.Id, req.Amount, ct);
            await Send.NoContentAsync(ct);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Contribution {Id} not found", req.Id);
            await Send.NotFoundAsync(ct);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Cannot edit contribution {Id}: {Message}", req.Id, ex.Message);
            await Send.ResponseAsync(new { error = ex.Message }, 400, ct);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid amount for contribution {Id}", req.Id);
            await Send.ResponseAsync(new { error = ex.Message }, 400, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error editing contribution {Id}", req.Id);
            await Send.ResponseAsync(new { error = "An error occurred while editing the contribution" }, 500, ct);
        }
    }
}
