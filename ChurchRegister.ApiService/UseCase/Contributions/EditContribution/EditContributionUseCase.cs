using ChurchRegister.Database.Data;
using Microsoft.EntityFrameworkCore;

namespace ChurchRegister.ApiService.UseCase.Contributions.EditContribution;

public class EditContributionUseCase : IEditContributionUseCase
{
    private readonly ChurchRegisterWebContext _context;
    private readonly ILogger<EditContributionUseCase> _logger;

    public EditContributionUseCase(
        ChurchRegisterWebContext context,
        ILogger<EditContributionUseCase> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task ExecuteAsync(int id, decimal amount, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Editing contribution {Id} to amount {Amount}", id, amount);

        // Validate amount
        if (amount <= 0)
        {
            throw new ArgumentException("Amount must be greater than zero", nameof(amount));
        }

        // Find contribution
        var contribution = await _context.ChurchMemberContributions.FindAsync(new object[] { id }, cancellationToken);
        if (contribution == null)
        {
            throw new KeyNotFoundException($"Contribution with ID {id} not found.");
        }

        // Validate that this is a manual one-off contribution (not from bank statement or envelope batch)
        if (contribution.HSBCBankCreditTransactionId.HasValue)
        {
            throw new InvalidOperationException("Cannot edit contributions from bank statements.");
        }

        if (contribution.EnvelopeContributionBatchId.HasValue)
        {
            throw new InvalidOperationException("Cannot edit contributions from envelope batches.");
        }

        if (!contribution.ManualContribution)
        {
            throw new InvalidOperationException("Only manual one-off contributions can be edited.");
        }

        // Update amount
        contribution.Amount = amount;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Updated contribution {Id} to amount {Amount}", id, amount);
    }
}
