using ChurchRegister.ApiService.UseCase.Contributions.EditContribution;
using ChurchRegister.ApiService.UseCase.Contributions.DeleteContribution;
using ChurchRegister.Database.Data;
using ChurchRegister.Database.Entities;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;

namespace ChurchRegister.Tests.Contributions;

public class ContributionEditDeleteUseCaseTests : IDisposable
{
    private readonly ChurchRegisterWebContext _context;
    private readonly Mock<ILogger<EditContributionUseCase>> _editLogger;
    private readonly Mock<ILogger<DeleteContributionUseCase>> _deleteLogger;

    public ContributionEditDeleteUseCaseTests()
    {
        var options = new DbContextOptionsBuilder<ChurchRegisterWebContext>()
            .UseInMemoryDatabase($"ContributionEditDeleteTests_{Guid.NewGuid()}")
            .Options;

        _context = new ChurchRegisterWebContext(options);
        _editLogger = new Mock<ILogger<EditContributionUseCase>>();
        _deleteLogger = new Mock<ILogger<DeleteContributionUseCase>>();

        SeedBaseData();
    }

    private void SeedBaseData()
    {
        _context.ChurchMemberStatuses.Add(
            new ChurchMemberStatus { Id = 1, Name = "Active", CreatedBy = "system", CreatedDateTime = DateTime.UtcNow }
        );
        _context.ContributionTypes.AddRange(
            new ContributionType { Id = 1, Type = "Cash", CreatedBy = "system", CreatedDateTime = DateTime.UtcNow },
            new ContributionType { Id = 2, Type = "Transfer", CreatedBy = "system", CreatedDateTime = DateTime.UtcNow }
        );
        _context.Users.Add(new ChurchRegisterWebUser
        {
            Id = "system",
            UserName = "system",
            FirstName = "System",
            LastName = "User",
            CreatedBy = "system",
            CreatedDateTime = DateTime.UtcNow
        });
        _context.ChurchMembers.Add(new ChurchMember
        {
            Id = 1,
            FirstName = "Test",
            LastName = "Member",
            ChurchMemberStatusId = 1,
            MemberSince = DateTime.UtcNow.AddYears(-1),
            CreatedBy = "system",
            CreatedDateTime = DateTime.UtcNow
        });
        _context.SaveChanges();
    }

    // ─────────────────────────────────────────────────────────────────────
    // EditContributionUseCase Tests
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task EditContribution_WithValidAmount_UpdatesSuccessfully()
    {
        // Arrange
        var contribution = new ChurchMemberContributions
        {
            ChurchMemberId = 1,
            Amount = 50.00m,
            Date = DateTime.UtcNow,
            TransactionRef = "MANUAL001",
            ContributionTypeId = 1,
            ManualContribution = true,
            CreatedBy = "system",
            CreatedDateTime = DateTime.UtcNow
        };
        _context.ChurchMemberContributions.Add(contribution);
        await _context.SaveChangesAsync();

        var useCase = new EditContributionUseCase(_context, _editLogger.Object);

        // Act
        await useCase.ExecuteAsync(contribution.Id, 75.50m);

        // Assert
        var updated = await _context.ChurchMemberContributions.FindAsync(contribution.Id);
        updated.Should().NotBeNull();
        updated!.Amount.Should().Be(75.50m);
    }

    [Fact]
    public async Task EditContribution_WithNonExistentId_ThrowsKeyNotFoundException()
    {
        // Arrange
        var useCase = new EditContributionUseCase(_context, _editLogger.Object);

        // Act & Assert
        await useCase.Invoking(u => u.ExecuteAsync(999, 100.00m))
            .Should().ThrowAsync<KeyNotFoundException>()
            .WithMessage("*999*");
    }

    [Fact]
    public async Task EditContribution_WithZeroAmount_ThrowsArgumentException()
    {
        // Arrange
        var contribution = new ChurchMemberContributions
        {
            ChurchMemberId = 1,
            Amount = 50.00m,
            Date = DateTime.UtcNow,
            TransactionRef = "MANUAL002",
            ContributionTypeId = 1,
            ManualContribution = true,
            CreatedBy = "system",
            CreatedDateTime = DateTime.UtcNow
        };
        _context.ChurchMemberContributions.Add(contribution);
        await _context.SaveChangesAsync();

        var useCase = new EditContributionUseCase(_context, _editLogger.Object);

        // Act & Assert
        await useCase.Invoking(u => u.ExecuteAsync(contribution.Id, 0))
            .Should().ThrowAsync<ArgumentException>()
            .WithMessage("*greater than zero*");
    }

    [Fact]
    public async Task EditContribution_WithNegativeAmount_ThrowsArgumentException()
    {
        // Arrange
        var contribution = new ChurchMemberContributions
        {
            ChurchMemberId = 1,
            Amount = 50.00m,
            Date = DateTime.UtcNow,
            TransactionRef = "MANUAL003",
            ContributionTypeId = 1,
            ManualContribution = true,
            CreatedBy = "system",
            CreatedDateTime = DateTime.UtcNow
        };
        _context.ChurchMemberContributions.Add(contribution);
        await _context.SaveChangesAsync();

        var useCase = new EditContributionUseCase(_context, _editLogger.Object);

        // Act & Assert
        await useCase.Invoking(u => u.ExecuteAsync(contribution.Id, -10.00m))
            .Should().ThrowAsync<ArgumentException>()
            .WithMessage("*greater than zero*");
    }

    [Fact]
    public async Task EditContribution_WithBankStatementContribution_ThrowsInvalidOperationException()
    {
        // Arrange
        var contribution = new ChurchMemberContributions
        {
            ChurchMemberId = 1,
            Amount = 50.00m,
            Date = DateTime.UtcNow,
            TransactionRef = "BANK001",
            ContributionTypeId = 2,
            HSBCBankCreditTransactionId = 123, // From bank statement
            ManualContribution = false,
            CreatedBy = "system",
            CreatedDateTime = DateTime.UtcNow
        };
        _context.ChurchMemberContributions.Add(contribution);
        await _context.SaveChangesAsync();

        var useCase = new EditContributionUseCase(_context, _editLogger.Object);

        // Act & Assert
        await useCase.Invoking(u => u.ExecuteAsync(contribution.Id, 75.00m))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*bank statement*");
    }

    [Fact]
    public async Task EditContribution_WithEnvelopeBatchContribution_ThrowsInvalidOperationException()
    {
        // Arrange
        var batch = new EnvelopeContributionBatch
        {
            BatchDate = DateOnly.FromDateTime(DateTime.UtcNow),
            TotalAmount = 100.00m,
            EnvelopeCount = 2,
            CreatedBy = "system",
            CreatedDateTime = DateTime.UtcNow
        };
        _context.Add(batch);
        await _context.SaveChangesAsync();

        var contribution = new ChurchMemberContributions
        {
            ChurchMemberId = 1,
            Amount = 50.00m,
            Date = DateTime.UtcNow,
            TransactionRef = "ENV001",
            ContributionTypeId = 1,
            EnvelopeContributionBatchId = batch.Id, // From envelope batch
            ManualContribution = false,
            CreatedBy = "system",
            CreatedDateTime = DateTime.UtcNow
        };
        _context.ChurchMemberContributions.Add(contribution);
        await _context.SaveChangesAsync();

        var useCase = new EditContributionUseCase(_context, _editLogger.Object);

        // Act & Assert
        await useCase.Invoking(u => u.ExecuteAsync(contribution.Id, 75.00m))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*envelope batch*");
    }

    [Fact]
    public async Task EditContribution_WithNonManualContribution_ThrowsInvalidOperationException()
    {
        // Arrange
        var contribution = new ChurchMemberContributions
        {
            ChurchMemberId = 1,
            Amount = 50.00m,
            Date = DateTime.UtcNow,
            TransactionRef = "AUTO001",
            ContributionTypeId = 1,
            ManualContribution = false, // Not manual
            CreatedBy = "system",
            CreatedDateTime = DateTime.UtcNow
        };
        _context.ChurchMemberContributions.Add(contribution);
        await _context.SaveChangesAsync();

        var useCase = new EditContributionUseCase(_context, _editLogger.Object);

        // Act & Assert
        await useCase.Invoking(u => u.ExecuteAsync(contribution.Id, 75.00m))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*manual one-off*");
    }

    // ─────────────────────────────────────────────────────────────────────
    // DeleteContributionUseCase Tests
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task DeleteContribution_WithValidManualContribution_DeletesSuccessfully()
    {
        // Arrange
        var contribution = new ChurchMemberContributions
        {
            ChurchMemberId = 1,
            Amount = 50.00m,
            Date = DateTime.UtcNow,
            TransactionRef = "MANUAL004",
            ContributionTypeId = 1,
            ManualContribution = true,
            CreatedBy = "system",
            CreatedDateTime = DateTime.UtcNow
        };
        _context.ChurchMemberContributions.Add(contribution);
        await _context.SaveChangesAsync();

        var useCase = new DeleteContributionUseCase(_context, _deleteLogger.Object);

        // Act
        await useCase.ExecuteAsync(contribution.Id);

        // Assert
        var deleted = await _context.ChurchMemberContributions.FindAsync(contribution.Id);
        deleted.Should().BeNull();
    }

    [Fact]
    public async Task DeleteContribution_WithNonExistentId_ThrowsKeyNotFoundException()
    {
        // Arrange
        var useCase = new DeleteContributionUseCase(_context, _deleteLogger.Object);

        // Act & Assert
        await useCase.Invoking(u => u.ExecuteAsync(999))
            .Should().ThrowAsync<KeyNotFoundException>()
            .WithMessage("*999*");
    }

    [Fact]
    public async Task DeleteContribution_WithBankStatementContribution_ThrowsInvalidOperationException()
    {
        // Arrange
        var contribution = new ChurchMemberContributions
        {
            ChurchMemberId = 1,
            Amount = 50.00m,
            Date = DateTime.UtcNow,
            TransactionRef = "BANK002",
            ContributionTypeId = 2,
            HSBCBankCreditTransactionId = 456, // From bank statement
            ManualContribution = false,
            CreatedBy = "system",
            CreatedDateTime = DateTime.UtcNow
        };
        _context.ChurchMemberContributions.Add(contribution);
        await _context.SaveChangesAsync();

        var useCase = new DeleteContributionUseCase(_context, _deleteLogger.Object);

        // Act & Assert
        await useCase.Invoking(u => u.ExecuteAsync(contribution.Id))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*bank statement*");
    }

    [Fact]
    public async Task DeleteContribution_WithEnvelopeBatchContribution_ThrowsInvalidOperationException()
    {
        // Arrange
        var batch = new EnvelopeContributionBatch
        {
            BatchDate = DateOnly.FromDateTime(DateTime.UtcNow),
            TotalAmount = 100.00m,
            EnvelopeCount = 2,
            CreatedBy = "system",
            CreatedDateTime = DateTime.UtcNow
        };
        _context.Add(batch);
        await _context.SaveChangesAsync();

        var contribution = new ChurchMemberContributions
        {
            ChurchMemberId = 1,
            Amount = 50.00m,
            Date = DateTime.UtcNow,
            TransactionRef = "ENV002",
            ContributionTypeId = 1,
            EnvelopeContributionBatchId = batch.Id, // From envelope batch
            ManualContribution = false,
            CreatedBy = "system",
            CreatedDateTime = DateTime.UtcNow
        };
        _context.ChurchMemberContributions.Add(contribution);
        await _context.SaveChangesAsync();

        var useCase = new DeleteContributionUseCase(_context, _deleteLogger.Object);

        // Act & Assert
        await useCase.Invoking(u => u.ExecuteAsync(contribution.Id))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*envelope batch*");
    }

    [Fact]
    public async Task DeleteContribution_WithNonManualContribution_ThrowsInvalidOperationException()
    {
        // Arrange
        var contribution = new ChurchMemberContributions
        {
            ChurchMemberId = 1,
            Amount = 50.00m,
            Date = DateTime.UtcNow,
            TransactionRef = "AUTO002",
            ContributionTypeId = 1,
            ManualContribution = false, // Not manual
            CreatedBy = "system",
            CreatedDateTime = DateTime.UtcNow
        };
        _context.ChurchMemberContributions.Add(contribution);
        await _context.SaveChangesAsync();

        var useCase = new DeleteContributionUseCase(_context, _deleteLogger.Object);

        // Act & Assert
        await useCase.Invoking(u => u.ExecuteAsync(contribution.Id))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*manual one-off*");
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}
