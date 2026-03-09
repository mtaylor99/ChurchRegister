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
        string assignedBy,
        CancellationToken ct)
    {
        // (1) Load transaction
        var transaction = await _context.HSBCBankCreditTransactions
            .FirstOrDefaultAsync(t => t.Id == transactionId && !t.Deleted, ct);

        if (transaction == null || transaction.IsProcessed)
            throw new ArgumentException($"Transaction {transactionId} not found or already processed.");

        // (2) Load member
        var member = await _context.ChurchMembers
            .FirstOrDefaultAsync(m => m.Id == churchMemberId, ct);

        if (member == null)
            throw new ArgumentException($"Member {churchMemberId} not found.");

        var reference = transaction.Reference!.Trim();
        var normalizedRef = reference.ToLower();

        // (3) Conflict check — another active member already has this reference
        var conflict = await _context.ChurchMembers
            .FirstOrDefaultAsync(m =>
                m.Id != churchMemberId &&
                m.BankReference != null &&
                m.BankReference.ToLower().Trim() == normalizedRef,
                ct);

        if (conflict != null)
            throw new InvalidOperationException(
                $"Bank reference '{reference}' is already assigned to {conflict.FirstName} {conflict.LastName}.");

        // (4) Atomic save: update member, insert contribution, mark transaction processed
        member.BankReference = reference;

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
        transaction.IsProcessed = true;

        await _context.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Assigned transaction {TransactionId} (ref: {Reference}) to member {MemberId} by {User}",
            transactionId, reference, churchMemberId, assignedBy);

        // (5) Re-process remaining unmatched transactions for the same reference
        var processingResult = await _processingService.ProcessHsbcTransactionsAsync(assignedBy, ct);

        return new AssignTransactionResponse(
            true,
            $"Transaction assigned to member. Bank reference '{reference}' saved.",
            processingResult.MatchedCount);
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
            throw new ArgumentException($"Transaction {transactionId} not found.");

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
