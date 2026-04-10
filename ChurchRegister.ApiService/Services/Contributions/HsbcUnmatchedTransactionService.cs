using ChurchRegister.ApiService.Exceptions;
using ChurchRegister.ApiService.Models.Contributions;
using ChurchRegister.Database.Data;
using ChurchRegister.Database.Entities;
using Microsoft.EntityFrameworkCore;

namespace ChurchRegister.ApiService.Services.Contributions;

public class HsbcUnmatchedTransactionService : IHsbcUnmatchedTransactionService
{
    private readonly ChurchRegisterWebContext _context;
    private readonly IContributionProcessingService _processingService;
    private readonly ILogger<HsbcUnmatchedTransactionService> _logger;

    public HsbcUnmatchedTransactionService(
        ChurchRegisterWebContext context,
        IContributionProcessingService processingService,
        ILogger<HsbcUnmatchedTransactionService> logger)
    {
        _context = context;
        _processingService = processingService;
        _logger = logger;
    }

    // ── TASK-016 ─────────────────────────────────────────────────────────────
    public async Task<GetUnmatchedTransactionsResponse> GetUnmatchedTransactionsAsync(CancellationToken ct)
    {
        var excludedRefs = await _context.HSBCExcludedReferences
            .Select(e => e.Reference.ToLower().Trim())
            .ToHashSetAsync(ct);

        var items = await _context.HSBCBankCreditTransactions
            .Where(t => !t.IsProcessed && !t.Deleted)
            .OrderByDescending(t => t.Date)
            .ToListAsync(ct);

        var dtos = items
            .Where(t => !string.IsNullOrWhiteSpace(t.Reference)
                        && !excludedRefs.Contains(t.Reference.ToLower().Trim()))
            .Select(t => new UnmatchedTransactionDto(
                t.Id,
                t.Date,
                t.Reference!,
                t.Description,
                t.MoneyIn))
            .ToList();

        return new GetUnmatchedTransactionsResponse(dtos.Count, dtos);
    }

    // ── TASK-017 ─────────────────────────────────────────────────────────────
    public async Task<AssignTransactionResponse> AssignTransactionToMemberAsync(
        int transactionId,
        int churchMemberId,
        int? secondaryChurchMemberId,
        string assignedBy,
        CancellationToken ct)
    {
        // (1) Load transaction
        var transaction = await _context.HSBCBankCreditTransactions
            .FirstOrDefaultAsync(t => t.Id == transactionId && !t.Deleted, ct);

        if (transaction == null || transaction.IsProcessed)
            throw new NotFoundException($"Transaction {transactionId} not found or already processed.");

        // (2) Validate: primary ≠ secondary member ID
        if (secondaryChurchMemberId.HasValue && churchMemberId == secondaryChurchMemberId.Value)
            throw new ValidationException("Cannot assign the same member twice to a shared reference.");

        // (3) Load primary member
        var primaryMember = await _context.ChurchMembers
            .FirstOrDefaultAsync(m => m.Id == churchMemberId && m.ChurchMemberStatusId == 1, ct);

        if (primaryMember == null)
            throw new NotFoundException($"Member {churchMemberId} not found.");

        var reference = transaction.Reference!.Trim();
        var normalizedRef = reference.ToLower();

        // (4) Check if primary member already has a different bank reference
        if (!string.IsNullOrEmpty(primaryMember.BankReference) &&
            !primaryMember.BankReference.Equals(reference, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                $"Member {primaryMember.FirstName} {primaryMember.LastName} already has bank reference '{primaryMember.BankReference}'.");
        }

        ChurchMember? secondaryMember = null;
        bool isSharedReference = false;

        // (5) If secondary member provided, load and validate
        if (secondaryChurchMemberId.HasValue)
        {
            secondaryMember = await _context.ChurchMembers
                .FirstOrDefaultAsync(m => m.Id == secondaryChurchMemberId.Value && m.ChurchMemberStatusId == 1, ct);

            if (secondaryMember == null)
                throw new NotFoundException($"Secondary member {secondaryChurchMemberId.Value} not found.");

            // Check if secondary member already has a different bank reference
            if (!string.IsNullOrEmpty(secondaryMember.BankReference) &&
                !secondaryMember.BankReference.Equals(reference, StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    $"Member {secondaryMember.FirstName} {secondaryMember.LastName} already has bank reference '{secondaryMember.BankReference}'.");
            }

            isSharedReference = true;
        }

        // (6) Check for conflicts - other members with same reference
        var existingMembers = await _context.ChurchMembers
            .Where(m => m.BankReference != null &&
                       m.BankReference.ToLower().Trim() == normalizedRef &&
                       m.ChurchMemberStatusId == 1)
            .ToListAsync(ct);

        // Filter out the members we are currently assigning
        var conflictingMembers = existingMembers
            .Where(m => m.Id != churchMemberId &&
                       (!secondaryChurchMemberId.HasValue || m.Id != secondaryChurchMemberId.Value))
            .ToList();

        if (conflictingMembers.Any())
        {
            var conflict = conflictingMembers.First();
            throw new InvalidOperationException(
                $"Bank reference '{reference}' is already assigned to {conflict.FirstName} {conflict.LastName}.");
        }

        int contributionsCreated = 0;

        // (7) Atomic save with transaction
        using var dbTransaction = await _context.Database.BeginTransactionAsync(ct);
        try
        {
            if (isSharedReference && secondaryMember != null)
            {
                // Shared reference: split contribution 50/50
                primaryMember.BankReference = reference;
                secondaryMember.BankReference = reference;

                // Calculate split with penny rounding
                var splitAmount = Math.Round(transaction.MoneyIn / 2, 2);
                var remainder = transaction.MoneyIn - splitAmount;

                // First contribution
                var contribution1 = new ChurchMemberContributions
                {
                    ChurchMemberId = churchMemberId,
                    Amount = splitAmount,
                    Date = transaction.Date,
                    TransactionRef = $"{reference}-M1",
                    Description = transaction.Description,
                    ContributionTypeId = 2, // Transfer
                    HSBCBankCreditTransactionId = transaction.Id,
                    CreatedBy = assignedBy,
                    CreatedDateTime = DateTime.UtcNow
                };

                // Second contribution (gets remainder to handle penny rounding)
                var contribution2 = new ChurchMemberContributions
                {
                    ChurchMemberId = secondaryChurchMemberId.Value,
                    Amount = remainder,
                    Date = transaction.Date,
                    TransactionRef = $"{reference}-M2",
                    Description = transaction.Description,
                    ContributionTypeId = 2, // Transfer
                    HSBCBankCreditTransactionId = transaction.Id,
                    CreatedBy = assignedBy,
                    CreatedDateTime = DateTime.UtcNow
                };

                await _context.ChurchMemberContributions.AddAsync(contribution1, ct);
                await _context.ChurchMemberContributions.AddAsync(contribution2, ct);
                contributionsCreated = 2;

                _logger.LogInformation(
                    "Assigned shared transaction {TransactionId} (ref: {Reference}) to members {PrimaryId} and {SecondaryId} with split amounts {Amount1} and {Amount2} by {User}",
                    transactionId, reference, churchMemberId, secondaryChurchMemberId.Value, splitAmount, remainder, assignedBy);
            }
            else
            {
                // Single member reference (backward compatible)
                primaryMember.BankReference = reference;

                var contribution = new ChurchMemberContributions
                {
                    ChurchMemberId = churchMemberId,
                    Amount = transaction.MoneyIn,
                    Date = transaction.Date,
                    TransactionRef = reference,
                    Description = transaction.Description,
                    ContributionTypeId = 2, // Transfer
                    HSBCBankCreditTransactionId = transaction.Id,
                    CreatedBy = assignedBy,
                    CreatedDateTime = DateTime.UtcNow
                };

                await _context.ChurchMemberContributions.AddAsync(contribution, ct);
                contributionsCreated = 1;

                _logger.LogInformation(
                    "Assigned transaction {TransactionId} (ref: {Reference}) to member {MemberId} by {User}",
                    transactionId, reference, churchMemberId, assignedBy);
            }

            transaction.IsProcessed = true;
            await _context.SaveChangesAsync(ct);
            await dbTransaction.CommitAsync(ct);
        }
        catch
        {
            await dbTransaction.RollbackAsync(ct);
            throw;
        }

        // (8) Re-process remaining unmatched transactions for the same reference
        var processingResult = await _processingService.ProcessHsbcTransactionsAsync(assignedBy, ct);

        return new AssignTransactionResponse(
            true,
            isSharedReference
                ? $"Transaction assigned to 2 members with 50/50 split. Bank reference '{reference}' saved."
                : $"Transaction assigned to member. Bank reference '{reference}' saved.",
            processingResult.MatchedCount,
            isSharedReference,
            contributionsCreated);
    }

    // ── TASK-018 ─────────────────────────────────────────────────────────────
    public async Task<ExcludeReferenceResponse> ExcludeReferenceAsync(
        int transactionId,
        string excludedBy,
        CancellationToken ct)
    {
        // (1) Load transaction
        var transaction = await _context.HSBCBankCreditTransactions
            .FirstOrDefaultAsync(t => t.Id == transactionId && !t.Deleted, ct);

        if (transaction == null)
            throw new NotFoundException($"Transaction {transactionId} not found.");

        // (2) Normalise reference
        var reference = transaction.Reference?.Trim() ?? string.Empty;

        // (3) Idempotent — only insert if not already excluded
        var alreadyExists = await _context.HSBCExcludedReferences
            .AnyAsync(e => e.Reference == reference, ct);

        if (!alreadyExists)
        {
            _context.HSBCExcludedReferences.Add(new HSBCExcludedReference
            {
                Reference = reference,
                CreatedBy = excludedBy,
                CreatedDateTime = DateTime.UtcNow
            });
            await _context.SaveChangesAsync(ct);
            _logger.LogInformation("Excluded reference '{Reference}' by {User}", reference, excludedBy);
        }
        else
        {
            _logger.LogInformation("Reference '{Reference}' was already excluded (idempotent)", reference);
        }

        return new ExcludeReferenceResponse(
            true,
            reference,
            alreadyExists
                ? "Reference was already excluded."
                : $"Reference '{reference}' has been excluded from future processing.");
    }
}
