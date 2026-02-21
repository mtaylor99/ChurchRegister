using ChurchRegister.Database.Data;
using ChurchRegister.Database.Entities;
using ChurchRegister.ApiService.Models.Contributions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ChurchRegister.ApiService.Services.Contributions;

public class ContributionProcessingService : IContributionProcessingService
{
    private readonly ChurchRegisterWebContext _context;
    private readonly ILogger<ContributionProcessingService> _logger;

    public ContributionProcessingService(
        ChurchRegisterWebContext context,
        ILogger<ContributionProcessingService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<ContributionProcessingResult> ProcessHsbcTransactionsAsync(
        string uploadedBy,
        CancellationToken cancellationToken = default)
    {
        var result = new ContributionProcessingResult
        {
            Success = false
        };

        try
        {
            _logger.LogInformation("Starting HSBC transaction processing for user: {UploadedBy}", uploadedBy);

            // Get all unprocessed HSBC transactions
            var unprocessedTransactions = await _context.HSBCBankCreditTransactions
                .Where(t => !t.IsProcessed && !t.Deleted)
                .ToListAsync(cancellationToken);

            _logger.LogInformation("Found {Count} unprocessed transactions", unprocessedTransactions.Count);

            if (unprocessedTransactions.Count == 0)
            {
                result.Success = true;
                return result;
            }

            // Get all active church members with bank references
            var activeMembers = await _context.ChurchMembers
                .Where(m => m.BankReference != null && m.BankReference != "")
                .Select(m => new { m.Id, BankReference = m.BankReference!.ToLower().Trim() })
                .ToListAsync(cancellationToken);

            _logger.LogInformation("Found {Count} members with bank references", activeMembers.Count);

            // Check for existing contributions to prevent duplicates
            var existingTransactionIds = await _context.ChurchMemberContributions
                .Where(c => c.HSBCBankCreditTransactionId != null)
                .Select(c => c.HSBCBankCreditTransactionId!.Value)
                .ToHashSetAsync(cancellationToken);

            var matchedTransactions = new List<HSBCBankCreditTransaction>();
            var contributionsToAdd = new List<ChurchMemberContributions>();
            var unmatchedReferences = new List<string>();
            decimal totalAmount = 0;

            foreach (var transaction in unprocessedTransactions)
            {
                // Skip if already has a contribution record (duplicate prevention)
                if (existingTransactionIds.Contains(transaction.Id))
                {
                    _logger.LogWarning("Transaction {TransactionId} already has a contribution record, skipping", transaction.Id);
                    continue;
                }

                // Normalize the transaction reference for matching
                var normalizedReference = transaction.Reference?.Trim().ToLower();

                if (string.IsNullOrWhiteSpace(normalizedReference))
                {
                    unmatchedReferences.Add("[EMPTY]");
                    continue;
                }

                // Try to match with a church member
                var matchedMember = activeMembers.FirstOrDefault(m => m.BankReference == normalizedReference);

                if (matchedMember != null)
                {
                    // Create contribution record
                    var contribution = new ChurchMemberContributions
                    {
                        ChurchMemberId = matchedMember.Id,
                        Amount = transaction.MoneyIn,
                        Date = transaction.Date,
                        TransactionRef = transaction.Reference!,
                        Description = transaction.Description,
                        ContributionTypeId = 2, // Transfer
                        HSBCBankCreditTransactionId = transaction.Id,
                        CreatedBy = uploadedBy,
                        CreatedDateTime = DateTime.UtcNow
                    };

                    contributionsToAdd.Add(contribution);
                    matchedTransactions.Add(transaction);
                    totalAmount += transaction.MoneyIn;

                    _logger.LogDebug("Matched transaction {TransactionId} with member {MemberId} for amount {Amount}",
                        transaction.Id, matchedMember.Id, transaction.MoneyIn);
                }
                else
                {
                    unmatchedReferences.Add(transaction.Reference!);
                    _logger.LogDebug("No match found for reference: {Reference}", transaction.Reference);
                }
            }

            // Add all contribution records in a single batch
            if (contributionsToAdd.Count > 0)
            {
                await _context.ChurchMemberContributions.AddRangeAsync(contributionsToAdd, cancellationToken);
            }

            // Mark matched transactions as processed
            foreach (var transaction in matchedTransactions)
            {
                transaction.IsProcessed = true;
            }

            // Save all changes in a single transaction
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "Processing complete. Matched: {Matched}, Unmatched: {Unmatched}, Total Amount: {Amount}",
                matchedTransactions.Count, unmatchedReferences.Count, totalAmount);

            result.Success = true;
            result.TotalProcessed = unprocessedTransactions.Count;
            result.MatchedCount = matchedTransactions.Count;
            result.UnmatchedCount = unmatchedReferences.Count;
            result.TotalAmount = totalAmount;
            result.UnmatchedReferences = unmatchedReferences.Distinct().ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing HSBC transactions");
            result.Success = false;
            result.Errors.Add($"Processing error: {ex.Message}");
        }

        return result;
    }
}
