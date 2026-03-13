using FastEndpoints;
using ChurchRegister.ApiService.UseCase.Contributions.DeleteContribution;
using ChurchRegister.Database.Constants;

namespace ChurchRegister.ApiService.Endpoints.Contributions;

/// <summary>
/// Request model for deleting a contribution
/// </summary>
public class DeleteContributionRequest
{
    /// <summary>
    /// Contribution ID
    /// </summary>
    public int Id { get; set; }
}

/// <summary>
/// Endpoint for deleting a contribution
/// </summary>
public class DeleteContributionEndpoint : Endpoint<DeleteContributionRequest>
{
    private readonly IDeleteContributionUseCase _useCase;
    private readonly ILogger<DeleteContributionEndpoint> _logger;

    public DeleteContributionEndpoint(
        IDeleteContributionUseCase useCase,
        ILogger<DeleteContributionEndpoint> logger)
    {
        _useCase = useCase;
        _logger = logger;
    }

    public override void Configure()
    {
        Delete("/api/contributions/{Id}");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration,
              SystemRoles.FinancialContributor,
              SystemRoles.FinancialAdministrator);
        Description(x => x
            .WithName("DeleteContribution")
            .WithSummary("Delete a contribution")
            .WithDescription("Permanently deletes a manual one-off contribution. Bank statement and envelope batch contributions cannot be deleted.")
            .WithTags("Contributions"));
    }

    public override async Task HandleAsync(DeleteContributionRequest req, CancellationToken ct)
    {
        try
        {
            await _useCase.ExecuteAsync(req.Id, ct);
            await Send.NoContentAsync(ct);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Contribution {Id} not found", req.Id);
            await Send.NotFoundAsync(ct);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Cannot delete contribution {Id}: {Message}", req.Id, ex.Message);
            await Send.ResponseAsync(new { error = ex.Message }, 400, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting contribution {Id}", req.Id);
            await Send.ResponseAsync(new { error = "An error occurred while deleting the contribution" }, 500, ct);
        }
    }
}
