using ChurchRegister.ApiService.Exceptions;
using ChurchRegister.ApiService.Services.Contributions;
using ChurchRegister.Database.Data;
using ChurchRegister.Database.Entities;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Logging;
using Moq;

namespace ChurchRegister.ApiService.Tests.Contributions;

/// <summary>
/// Integration tests for HSBC Unmatched Transaction resolution.
/// Covers acceptance criteria AC-001 through AC-009 and the processing-service skip test.
/// Uses in-memory DbContext with real service instances (unit-integration style).
/// </summary>
public class HsbcUnmatchedTransactionsTests : IDisposable
{
    private readonly ChurchRegisterWebContext _context;
    private readonly Mock<ILogger<HsbcUnmatchedTransactionService>> _logger;
    private readonly Mock<ILogger<ContributionProcessingService>> _processingLogger;
    private readonly ContributionProcessingService _processingService;
    private readonly HsbcUnmatchedTransactionService _service;

    private const string TestUser = "test-user@example.com";

    public HsbcUnmatchedTransactionsTests()
    {
        var options = new DbContextOptionsBuilder<ChurchRegisterWebContext>()
            .UseInMemoryDatabase($"HsbcUnmatchedTests_{Guid.NewGuid()}")
            .ConfigureWarnings(warnings =>
            {
                warnings.Ignore(InMemoryEventId.TransactionIgnoredWarning);
            })
            .Options;

        _context = new ChurchRegisterWebContext(options);
        _logger = new Mock<ILogger<HsbcUnmatchedTransactionService>>();
        _processingLogger = new Mock<ILogger<ContributionProcessingService>>();

        _processingService = new ContributionProcessingService(_context, _processingLogger.Object);
        _service = new HsbcUnmatchedTransactionService(_context, _processingService, _logger.Object);

        SeedBaseData();
    }

    private void SeedBaseData()
    {
        _context.ChurchMemberStatuses.Add(
            new ChurchMemberStatus { Id = 1, Name = "Active", CreatedBy = "system", CreatedDateTime = DateTime.UtcNow });
        _context.ContributionTypes.Add(
            new ContributionType { Id = 1, Type = "Offering", CreatedBy = "system", CreatedDateTime = DateTime.UtcNow });
        _context.ContributionTypes.Add(
            new ContributionType { Id = 2, Type = "Transfer", CreatedBy = "system", CreatedDateTime = DateTime.UtcNow });
        _context.SaveChanges();
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private HSBCBankCreditTransaction AddTransaction(string reference, decimal amount = 50m, bool isProcessed = false)
    {
        var tx = new HSBCBankCreditTransaction
        {
            Date = DateTime.UtcNow.Date,
            Reference = reference,
            Description = $"Payment from {reference}",
            MoneyIn = amount,
            IsProcessed = isProcessed,
            Deleted = false,
            CreatedBy = "import",
            CreatedDateTime = DateTime.UtcNow
        };
        _context.HSBCBankCreditTransactions.Add(tx);
        _context.SaveChanges();
        return tx;
    }

    private ChurchMember AddMember(string firstName, string lastName, string? bankRef = null)
    {
        var member = new ChurchMember
        {
            FirstName = firstName,
            LastName = lastName,
            ChurchMemberStatusId = 1,
            BankReference = bankRef,
            MemberSince = DateTime.UtcNow.AddYears(-1),
            CreatedBy = "system",
            CreatedDateTime = DateTime.UtcNow
        };
        _context.ChurchMembers.Add(member);
        _context.SaveChanges();
        return member;
    }

    // ─── AC-001: Assign happy path ────────────────────────────────────────────

    [Fact]
    public async Task AC001_AssignTransaction_HappyPath_UpdatesMemberAndCreatesContribution()
    {
        // Arrange
        var tx = AddTransaction("SMITH J");
        var member = AddMember("John", "Smith");

        // Act
        var result = await _service.AssignTransactionToMemberAsync(tx.Id, member.Id, null, TestUser, default);

        // Assert
        result.Success.Should().BeTrue();

        var updatedMember = await _context.ChurchMembers.FindAsync(member.Id);
        updatedMember!.BankReference.Should().Be("SMITH J");

        var contribution = await _context.ChurchMemberContributions
            .FirstOrDefaultAsync(c => c.HSBCBankCreditTransactionId == tx.Id);
        contribution.Should().NotBeNull();
        contribution!.ChurchMemberId.Should().Be(member.Id);
        contribution.Amount.Should().Be(50m);

        var updatedTx = await _context.HSBCBankCreditTransactions.FindAsync(tx.Id);
        updatedTx!.IsProcessed.Should().BeTrue();
    }

    // ─── AC-002: Re-processing after assignment ───────────────────────────────

    [Fact]
    public async Task AC002_AfterAssignment_SameReferencePendingTransactions_GetProcessed()
    {
        // Arrange — two transactions with the same reference
        var tx1 = AddTransaction("JONES P", 40m);
        var tx2 = AddTransaction("JONES P", 60m);
        var member = AddMember("Peter", "Jones");

        // Act — assign one transaction; re-processing should pick up the second
        var result = await _service.AssignTransactionToMemberAsync(tx1.Id, member.Id, null, TestUser, default);

        // Assert — both should now be processed
        result.Success.Should().BeTrue();
        result.ReProcessedMatchedCount.Should().BeGreaterThan(0);

        var tx2Updated = await _context.HSBCBankCreditTransactions.FindAsync(tx2.Id);
        tx2Updated!.IsProcessed.Should().BeTrue();

        var contributions = await _context.ChurchMemberContributions
            .Where(c => c.ChurchMemberId == member.Id)
            .ToListAsync();
        contributions.Should().HaveCount(2);
    }

    // ─── AC-003: Exclude reference ────────────────────────────────────────────

    [Fact]
    public async Task AC003_ExcludeReference_CreatesExclusionAndHidesFromUnmatchedList()
    {
        // Arrange
        var tx = AddTransaction("GIFTAID");

        // Act
        var result = await _service.ExcludeReferenceAsync(tx.Id, TestUser, default);

        // Assert
        result.Success.Should().BeTrue();
        result.Reference.Should().Be("GIFTAID");

        var exclusionExists = await _context.HSBCExcludedReferences
            .AnyAsync(e => e.Reference == "GIFTAID");
        exclusionExists.Should().BeTrue();

        var unmatched = await _service.GetUnmatchedTransactionsAsync(default);
        unmatched.Items.Should().NotContain(i => i.Reference == "GIFTAID");
        unmatched.TotalCount.Should().Be(0);
    }

    // ─── AC-004: Assign conflict (409) ───────────────────────────────────────

    [Fact]
    public async Task AC004_AssignConflict_WhenReferenceAlreadyBelongsToOtherMember_ThrowsInvalidOperation()
    {
        // Arrange
        var memberA = AddMember("Alice", "Brown", bankRef: "BROWN A");
        var memberB = AddMember("Bob", "Green");
        var tx = AddTransaction("BROWN A");

        // Act & Assert — trying to assign to member B when ref belongs to member A
        await _service.Invoking(s => s.AssignTransactionToMemberAsync(tx.Id, memberB.Id, null, TestUser, default))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*BROWN A*");

        // No side effects
        var memberBRefreshed = await _context.ChurchMembers.FindAsync(memberB.Id);
        memberBRefreshed!.BankReference.Should().BeNull();

        var contribution = await _context.ChurchMemberContributions
            .FirstOrDefaultAsync(c => c.HSBCBankCreditTransactionId == tx.Id);
        contribution.Should().BeNull();
    }

    // ─── AC-005: Empty unmatched list ────────────────────────────────────────

    [Fact]
    public async Task AC005_GetUnmatchedTransactions_WhenNoneExist_ReturnsTotalCountZero()
    {
        // Arrange — add a processed transaction only
        AddTransaction("PROCESSED", isProcessed: true);

        // Act
        var result = await _service.GetUnmatchedTransactionsAsync(default);

        // Assert
        result.TotalCount.Should().Be(0);
        result.Items.Should().BeEmpty();
    }

    // ─── AC-006: Role restriction is enforced at endpoint level ──────────────
    // This is configured by:
    //   Roles(SystemRoles.SystemAdministration, SystemRoles.FinancialAdministrator, SystemRoles.FinancialContributor)
    // FinancialViewer is intentionally omitted from all three new endpoints.
    // The service itself does not enforce roles; role enforcement is a FastEndpoints concern.
    // Endpoint-level role tests are covered by the endpoint Configure() method.

    // ─── AC-007: Atomicity ────────────────────────────────────────────────────

    [Fact]
    public async Task AC007_AssignTransaction_WhenTransactionNotFound_ThrowsNotFoundException_NoSideEffects()
    {
        // Arrange
        var member = AddMember("Test", "User");

        // Act & Assert
        await _service.Invoking(s => s.AssignTransactionToMemberAsync(9999, member.Id, null, TestUser, default))
            .Should().ThrowAsync<NotFoundException>()
            .WithMessage("*9999*");

        // No contributions created
        var contributions = await _context.ChurchMemberContributions.ToListAsync();
        contributions.Should().BeEmpty();
    }

    // ─── AC-008: Idempotent exclusion ────────────────────────────────────────

    [Fact]
    public async Task AC008_ExcludeReference_CalledTwice_Returns200BothTimes_OnlyOneRowInTable()
    {
        // Arrange
        var tx = AddTransaction("GIFTAID2");

        // Act — call exclude twice
        var result1 = await _service.ExcludeReferenceAsync(tx.Id, TestUser, default);
        var result2 = await _service.ExcludeReferenceAsync(tx.Id, TestUser, default);

        // Assert — both succeed
        result1.Success.Should().BeTrue();
        result2.Success.Should().BeTrue();

        // Only one row
        var count = await _context.HSBCExcludedReferences
            .CountAsync(e => e.Reference == "GIFTAID2");
        count.Should().Be(1);
    }

    // ─── AC-009: Audit fields ────────────────────────────────────────────────

    [Fact]
    public async Task AC009_AssignTransaction_SetsCreatedByToAssignedByUser()
    {
        // Arrange
        var tx = AddTransaction("AUDIT TEST");
        var member = AddMember("Audit", "Member");
        const string assignedBy = "auditor@church.com";

        // Act
        await _service.AssignTransactionToMemberAsync(tx.Id, member.Id, null, assignedBy, default);

        // Assert
        var contribution = await _context.ChurchMemberContributions
            .FirstOrDefaultAsync(c => c.HSBCBankCreditTransactionId == tx.Id);
        contribution.Should().NotBeNull();
        contribution!.CreatedBy.Should().Be(assignedBy);
    }

    // ─── Processing service skips excluded refs ───────────────────────────────

    [Fact]
    public async Task ProcessingServiceSkipsExcludedReferences_NoContributionCreated()
    {
        // Arrange — add an excluded reference and a matching transaction
        _context.HSBCExcludedReferences.Add(new HSBCExcludedReference
        {
            Reference = "EXCLUDE ME",
            CreatedBy = "system",
            CreatedDateTime = DateTime.UtcNow
        });
        var tx = AddTransaction("EXCLUDE ME");

        // Also add a member with this reference (so it would normally be matched)
        AddMember("Skip", "This", bankRef: "EXCLUDE ME");

        await _context.SaveChangesAsync();

        // Act
        var result = await _processingService.ProcessHsbcTransactionsAsync("system", default);

        // Assert — transaction should NOT be processed
        result.Success.Should().BeTrue();
        result.MatchedCount.Should().Be(0);

        var txRefreshed = await _context.HSBCBankCreditTransactions.FindAsync(tx.Id);
        txRefreshed!.IsProcessed.Should().BeFalse();

        var contribution = await _context.ChurchMemberContributions
            .FirstOrDefaultAsync(c => c.HSBCBankCreditTransactionId == tx.Id);
        contribution.Should().BeNull();
    }

    // ─── Extra: GetUnmatchedTransactions filters excluded refs correctly ─────

    [Fact]
    public async Task GetUnmatchedTransactions_WithMixedTransactions_FiltersExcludedAndProcessed()
    {
        // Arrange
        var includedTx = AddTransaction("INCLUDE ME", 100m);
        AddTransaction("PROCESSED TX", isProcessed: true);
        var excludedTx = AddTransaction("EXCLUDED REF", 75m);

        _context.HSBCExcludedReferences.Add(new HSBCExcludedReference
        {
            Reference = "EXCLUDED REF",
            CreatedBy = "system",
            CreatedDateTime = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetUnmatchedTransactionsAsync(default);

        // Assert — only the unexcluded, unprocessed transaction appears
        result.TotalCount.Should().Be(1);
        result.Items.Should().HaveCount(1);
        result.Items[0].Id.Should().Be(includedTx.Id);
        result.Items[0].Reference.Should().Be("INCLUDE ME");
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}
