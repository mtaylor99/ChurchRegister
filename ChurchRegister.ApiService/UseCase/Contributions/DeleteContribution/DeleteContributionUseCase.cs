using ChurchRegister.Database.Data;
using Microsoft.EntityFrameworkCore;

namespace ChurchRegister.ApiService.UseCase.Contributions.DeleteContribution;

public class DeleteContributionUseCase : IDeleteContributionUseCase
{
    private readonly ChurchRegisterWebContext _context;
    private readonly ILogger<DeleteContributionUseCase> _logger;

    public DeleteContributionUseCase(
        ChurchRegisterWebContext context,
        ILogger<DeleteContributionUseCase> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task ExecuteAsync(int id, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Deleting contribution {Id}", id);

        // Find contribution
        var contribution = await _context.ChurchMemberContributions.FindAsync(new object[] { id }, cancellationToken);
        if (contribution == null)
        {
            throw new KeyNotFoundException($"Contribution with ID {id} not found.");
        }

        // Validate that this is a manual one-off contribution (not from bank statement or envelope batch)
        if (contribution.HSBCBankCreditTransactionId.HasValue)
        {
            throw new InvalidOperationException("Cannot delete contributions from bank statements.");
        }

        if (contribution.EnvelopeContributionBatchId.HasValue)
        {
            throw new InvalidOperationException("Cannot delete contributions from envelope batches.");
        }

        if (!contribution.ManualContribution)
        {
            throw new InvalidOperationException("Only manual one-off contributions can be deleted.");
        }

        // Hard delete
        _context.ChurchMemberContributions.Remove(contribution);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Deleted contribution {Id}", id);
    }
}
