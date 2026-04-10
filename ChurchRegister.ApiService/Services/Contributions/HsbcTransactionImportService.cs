using ChurchRegister.ApiService.Models.Contributions;
using ChurchRegister.Database.Data;
using ChurchRegister.Database.Entities;
using Microsoft.EntityFrameworkCore;

namespace ChurchRegister.ApiService.Services.Contributions;

/// <summary>
/// Implementation of HSBC transaction import service with duplicate detection
/// </summary>
public class HsbcTransactionImportService : IHsbcTransactionImportService
{
    private readonly ChurchRegisterWebContext _context;

    public HsbcTransactionImportService(ChurchRegisterWebContext context)
    {
        _context = context;
    }

    public async Task<ImportResult> ImportTransactionsAsync(
        List<HsbcTransaction> transactions,
        string uploadedBy,
        CancellationToken cancellationToken = default)
    {
        var result = new ImportResult
        {
            TotalProcessed = transactions.Count,
            Success = true
        };

        try
        {
            // Filter out transactions with no MoneyIn
            var validTransactions = transactions.Where(t => t.MoneyIn > 0).ToList();
            result.IgnoredNoMoneyIn = transactions.Count - validTransactions.Count;

            if (!validTransactions.Any())
            {
                result.Success = true;
                return result;
            }

            // Start database transaction
            using var dbTransaction = await _context.Database.BeginTransactionAsync(cancellationToken);

            try
            {
                // Check for duplicates - using Date + Reference + MoneyIn for more precise matching
                // Also skip transactions that are already processed as an extra safeguard
                var duplicateChecks = validTransactions
                    .Select(t => new
                    {
                        Date = t.Date.Date, // Compare date only
                        t.MoneyIn,
                        Reference = t.Reference?.Substring(0, Math.Min(t.Reference?.Length ?? 0, 100)) ?? string.Empty
                    })
                    .ToList();

                var existingTransactions = await _context.HSBCBankCreditTransactions
                    .Where(t => !t.Deleted)
                    .Select(t => new
                    {
                        Date = t.Date.Date,
                        t.MoneyIn,
                        Reference = t.Reference ?? string.Empty, // Normalize null to empty string
                        t.IsProcessed
                    })
                    .ToListAsync(cancellationToken);

                // Create hashset for efficient duplicate checking
                // Include Reference in the key for more precise duplicate detection
                // Use invariant formatting for decimal to ensure consistent matching
                var existingSet = existingTransactions
                    .Select(t => $"{t.Date:yyyy-MM-dd}|{t.Reference}|{t.MoneyIn:F2}")
                    .ToHashSet();

                // Also track processed transaction keys to reject re-uploads of already processed items
                var processedSet = existingTransactions
                    .Where(t => t.IsProcessed)
                    .Select(t => $"{t.Date:yyyy-MM-dd}|{t.Reference}|{t.MoneyIn:F2}")
                    .ToHashSet();

                var newTransactions = new List<HSBCBankCreditTransaction>();

                foreach (var transaction in validTransactions)
                {
                    // Truncate reference for key generation to match database constraints
                    var truncatedReference = transaction.Reference?.Length > 100
                        ? transaction.Reference[..100]
                        : transaction.Reference ?? string.Empty;

                    // Use F2 format for decimal to match the format in existingSet (2 decimal places)
                    var key = $"{transaction.Date.Date:yyyy-MM-dd}|{truncatedReference}|{transaction.MoneyIn:F2}";

                    // Skip if this exact transaction already exists in the database
                    if (existingSet.Contains(key))
                    {
                        result.DuplicatesSkipped++;
                        continue;
                    }

                    // Extra safeguard: Skip if this transaction was already processed
                    // This prevents re-uploading already-matched contributions
                    if (processedSet.Contains(key))
                    {
                        result.DuplicatesSkipped++;
                        continue;
                    }

                    // Truncate description to match database constraints
                    var description = transaction.Description?.Length > 500
                        ? transaction.Description[..500]
                        : transaction.Description;

                    var entity = new HSBCBankCreditTransaction
                    {
                        Date = transaction.Date,
                        Description = description,
                        Reference = truncatedReference,
                        MoneyIn = transaction.MoneyIn,
                        CreatedBy = uploadedBy,
                        CreatedDateTime = DateTime.UtcNow,
                        Deleted = false
                    };

                    newTransactions.Add(entity);
                    existingSet.Add(key); // Add to set to prevent duplicates within the same batch
                }

                if (newTransactions.Any())
                {
                    await _context.HSBCBankCreditTransactions.AddRangeAsync(newTransactions, cancellationToken);
                    await _context.SaveChangesAsync(cancellationToken);
                }

                result.NewTransactions = newTransactions.Count;

                await dbTransaction.CommitAsync(cancellationToken);
            }
            catch (Exception)
            {
                await dbTransaction.RollbackAsync(cancellationToken);
                throw;
            }

            return result;
        }
        catch (Exception ex)
        {
            result.Success = false;
            result.Errors.Add($"Error importing transactions: {ex.Message}");
            return result;
        }
    }
}
