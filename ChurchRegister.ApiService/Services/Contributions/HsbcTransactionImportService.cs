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
                // Check for duplicates
                var duplicateChecks = validTransactions
                    .Select(t => new
                    {
                        Date = t.Date.Date, // Compare date only
                        t.MoneyIn,
                        Description = t.Description?.Substring(0, Math.Min(t.Description.Length, 500)) ?? string.Empty
                    })
                    .ToList();

                var existingTransactions = await _context.HSBCBankCreditTransactions
                    .Where(t => !t.Deleted)
                    .Select(t => new
                    {
                        Date = t.Date.Date,
                        t.MoneyIn,
                        t.Description
                    })
                    .ToListAsync(cancellationToken);

                // Create hashset for efficient duplicate checking
                var existingSet = existingTransactions
                    .Select(t => $"{t.Date:yyyy-MM-dd}|{t.MoneyIn}|{t.Description}")
                    .ToHashSet();

                var newTransactions = new List<HSBCBankCreditTransaction>();

                foreach (var transaction in validTransactions)
                {
                    var key = $"{transaction.Date.Date:yyyy-MM-dd}|{transaction.MoneyIn}|{transaction.Description?.Substring(0, Math.Min(transaction.Description.Length, 500)) ?? string.Empty}";

                    if (existingSet.Contains(key))
                    {
                        result.DuplicatesSkipped++;
                        continue;
                    }

                    // Truncate fields to match database constraints
                    var description = transaction.Description?.Length > 500
                        ? transaction.Description[..500]
                        : transaction.Description;

                    var reference = transaction.Reference?.Length > 100
                        ? transaction.Reference[..100]
                        : transaction.Reference;

                    var entity = new HSBCBankCreditTransaction
                    {
                        Date = transaction.Date,
                        Description = description,
                        Reference = reference ?? string.Empty,
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
