using ChurchRegister.ApiService.Models.Contributions;
using ChurchRegister.ApiService.Services.Contributions;
using ChurchRegister.ApiService.UseCase.Contributions.GetContributionHistory;
using ChurchRegister.ApiService.UseCase.Contributions.GetEnvelopeBatchDetails;
using ChurchRegister.ApiService.UseCase.Contributions.GetEnvelopeBatchList;
using ChurchRegister.ApiService.UseCase.Contributions.SubmitEnvelopeBatch;
using ChurchRegister.ApiService.UseCase.Contributions.ValidateRegisterNumber;
using ChurchRegister.Database.Data;
using ChurchRegister.Database.Entities;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;

namespace ChurchRegister.ApiService.Tests.Contributions;

public class ContributionUseCaseTests : IDisposable
{
    private readonly ChurchRegisterWebContext _context;
    private readonly Mock<IEnvelopeContributionService> _mockEnvelopeService;
    private readonly Mock<ILogger<GetContributionHistoryUseCase>> _getHistoryLogger;
    private readonly Mock<ILogger<GetEnvelopeBatchDetailsUseCase>> _getBatchDetailsLogger;
    private readonly Mock<ILogger<GetEnvelopeBatchListUseCase>> _getBatchListLogger;
    private readonly Mock<ILogger<SubmitEnvelopeBatchUseCase>> _submitBatchLogger;
    private readonly Mock<ILogger<ValidateRegisterNumberUseCase>> _validateRegisterLogger;

    public ContributionUseCaseTests()
    {
        var options = new DbContextOptionsBuilder<ChurchRegisterWebContext>()
            .UseInMemoryDatabase($"ContributionTests_{Guid.NewGuid()}")
            .Options;

        _context = new ChurchRegisterWebContext(options);
        _mockEnvelopeService = new Mock<IEnvelopeContributionService>();
        _getHistoryLogger = new Mock<ILogger<GetContributionHistoryUseCase>>();
        _getBatchDetailsLogger = new Mock<ILogger<GetEnvelopeBatchDetailsUseCase>>();
        _getBatchListLogger = new Mock<ILogger<GetEnvelopeBatchListUseCase>>();
        _submitBatchLogger = new Mock<ILogger<SubmitEnvelopeBatchUseCase>>();
        _validateRegisterLogger = new Mock<ILogger<ValidateRegisterNumberUseCase>>();

        SeedBaseData();
    }

    private void SeedBaseData()
    {
        _context.ChurchMemberStatuses.Add(
            new ChurchMemberStatus { Id = 1, Name = "Active", CreatedBy = "system", CreatedDateTime = DateTime.UtcNow }
        );
        _context.ContributionTypes.Add(
            new ContributionType { Id = 1, Type = "Weekly Offering", CreatedBy = "system", CreatedDateTime = DateTime.UtcNow }
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
        _context.SaveChanges();
    }

    // ─── GetContributionHistoryUseCase (uses DbContext directly) ─────────────

    [Fact]
    public async Task GetContributionHistory_WithNonExistentMember_ThrowsArgumentException()
    {
        // Arrange
        var useCase = new GetContributionHistoryUseCase(_context, _getHistoryLogger.Object);

        // Act & Assert
        await useCase.Invoking(u => u.ExecuteAsync(999, null, null))
            .Should().ThrowAsync<ArgumentException>()
            .WithMessage("*999*");
    }

    [Fact]
    public async Task GetContributionHistory_WithExistingMemberAndNoContributions_ReturnsEmptyList()
    {
        // Arrange
        _context.ChurchMembers.Add(new ChurchMember
        {
            Id = 1,
            FirstName = "Alice",
            LastName = "Smith",
            ChurchMemberStatusId = 1,
            MemberSince = DateTime.UtcNow.AddYears(-1),
            CreatedBy = "system",
            CreatedDateTime = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        var useCase = new GetContributionHistoryUseCase(_context, _getHistoryLogger.Object);

        // Act
        var result = await useCase.ExecuteAsync(1, null, null);

        // Assert
        result.Should().NotBeNull();
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetContributionHistory_WithContributions_ReturnsHistoryList()
    {
        // Arrange
        _context.ChurchMembers.Add(new ChurchMember
        {
            Id = 2,
            FirstName = "Bob",
            LastName = "Jones",
            ChurchMemberStatusId = 1,
            MemberSince = DateTime.UtcNow.AddYears(-2),
            CreatedBy = "system",
            CreatedDateTime = DateTime.UtcNow
        });

        _context.ChurchMemberContributions.AddRange(
            new ChurchMemberContributions
            {
                ChurchMemberId = 2,
                Amount = 50.00m,
                Date = DateTime.UtcNow.AddDays(-30),
                TransactionRef = "REF001",
                ContributionTypeId = 1,
                CreatedBy = "system",
                CreatedDateTime = DateTime.UtcNow
            },
            new ChurchMemberContributions
            {
                ChurchMemberId = 2,
                Amount = 25.00m,
                Date = DateTime.UtcNow.AddDays(-7),
                TransactionRef = "REF002",
                ContributionTypeId = 1,
                CreatedBy = "system",
                CreatedDateTime = DateTime.UtcNow
            }
        );
        await _context.SaveChangesAsync();

        var useCase = new GetContributionHistoryUseCase(_context, _getHistoryLogger.Object);

        // Act
        var result = await useCase.ExecuteAsync(2, null, null);

        // Assert
        result.Should().HaveCount(2);
        result.Should().BeInDescendingOrder(c => c.Date);
    }

    [Fact]
    public async Task GetContributionHistory_WithDateRange_ReturnsFilteredResults()
    {
        // Arrange
        _context.ChurchMembers.Add(new ChurchMember
        {
            Id = 3,
            FirstName = "Carol",
            LastName = "Brown",
            ChurchMemberStatusId = 1,
            MemberSince = DateTime.UtcNow.AddYears(-1),
            CreatedBy = "system",
            CreatedDateTime = DateTime.UtcNow
        });

        var startDate = DateTime.UtcNow.AddDays(-20);
        var endDate = DateTime.UtcNow;

        _context.ChurchMemberContributions.AddRange(
            new ChurchMemberContributions
            {
                ChurchMemberId = 3,
                Amount = 100.00m,
                Date = DateTime.UtcNow.AddDays(-10), // within range
                TransactionRef = "REF003",
                ContributionTypeId = 1,
                CreatedBy = "system",
                CreatedDateTime = DateTime.UtcNow
            },
            new ChurchMemberContributions
            {
                ChurchMemberId = 3,
                Amount = 50.00m,
                Date = DateTime.UtcNow.AddDays(-60), // outside range
                TransactionRef = "REF004",
                ContributionTypeId = 1,
                CreatedBy = "system",
                CreatedDateTime = DateTime.UtcNow
            }
        );
        await _context.SaveChangesAsync();

        var useCase = new GetContributionHistoryUseCase(_context, _getHistoryLogger.Object);

        // Act
        var result = await useCase.ExecuteAsync(3, startDate, endDate);

        // Assert
        result.Should().HaveCount(1);
        result.First().TransactionRef.Should().Be("REF003");
    }

    // ─── GetEnvelopeBatchDetailsUseCase ──────────────────────────────────────

    [Fact]
    public async Task GetEnvelopeBatchDetails_WithValidBatchId_ReturnsBatchDetails()
    {
        // Arrange
        var expected = new GetBatchDetailsResponse { BatchId = 1 };
        _mockEnvelopeService
            .Setup(s => s.GetBatchDetailsAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        var useCase = new GetEnvelopeBatchDetailsUseCase(_mockEnvelopeService.Object, _getBatchDetailsLogger.Object);

        // Act
        var result = await useCase.ExecuteAsync(1);

        // Assert
        result.Should().NotBeNull();
        result.BatchId.Should().Be(1);
        _mockEnvelopeService.Verify(s => s.GetBatchDetailsAsync(1, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetEnvelopeBatchDetails_WhenBatchNotFound_ThrowsKeyNotFoundException()
    {
        // Arrange
        _mockEnvelopeService
            .Setup(s => s.GetBatchDetailsAsync(999, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new KeyNotFoundException("Batch not found"));

        var useCase = new GetEnvelopeBatchDetailsUseCase(_mockEnvelopeService.Object, _getBatchDetailsLogger.Object);

        // Act & Assert
        await useCase.Invoking(u => u.ExecuteAsync(999))
            .Should().ThrowAsync<KeyNotFoundException>();
    }

    // ─── GetEnvelopeBatchListUseCase ─────────────────────────────────────────

    [Fact]
    public async Task GetEnvelopeBatchList_WithDefaultParams_ReturnsBatchList()
    {
        // Arrange
        var expected = new GetBatchListResponse { TotalCount = 2 };
        _mockEnvelopeService
            .Setup(s => s.GetBatchListAsync(null, null, 1, 10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        var useCase = new GetEnvelopeBatchListUseCase(_mockEnvelopeService.Object, _getBatchListLogger.Object);

        // Act
        var result = await useCase.ExecuteAsync(null, null, 1, 10);

        // Assert
        result.Should().NotBeNull();
        result.TotalCount.Should().Be(2);
    }

    // ─── SubmitEnvelopeBatchUseCase ───────────────────────────────────────────

    [Fact]
    public async Task SubmitEnvelopeBatch_WithValidRequest_ReturnsSubmitResponse()
    {
        // Arrange
        var request = new SubmitEnvelopeBatchRequest
        {
            CollectionDate = DateOnly.FromDateTime(DateTime.Today.AddDays(-1)),
            Envelopes = new List<EnvelopeEntry> { new EnvelopeEntry { RegisterNumber = 1, Amount = 50.00m } }
        };
        var expected = new SubmitEnvelopeBatchResponse { BatchId = 5, EnvelopeCount = 3, TotalAmount = 150.00m };
        _mockEnvelopeService
            .Setup(s => s.SubmitBatchAsync(request, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        var useCase = new SubmitEnvelopeBatchUseCase(_mockEnvelopeService.Object, _submitBatchLogger.Object);

        // Act
        var result = await useCase.ExecuteAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.BatchId.Should().Be(5);
        result.EnvelopeCount.Should().Be(3);
    }

    // ─── ValidateRegisterNumberUseCase ───────────────────────────────────────

    [Fact]
    public async Task ValidateRegisterNumber_WithInvalidNumber_ThrowsArgumentException()
    {
        // Arrange
        var useCase = new ValidateRegisterNumberUseCase(_mockEnvelopeService.Object, _validateRegisterLogger.Object);

        // Act & Assert
        await useCase.Invoking(u => u.ExecuteAsync(0, 2024))
            .Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task ValidateRegisterNumber_WithValidNumberAndYear_ReturnsResponse()
    {
        // Arrange
        var expected = new ValidateRegisterNumberResponse { Valid = true };
        _mockEnvelopeService
            .Setup(s => s.ValidateRegisterNumberAsync(42, 2024, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        var useCase = new ValidateRegisterNumberUseCase(_mockEnvelopeService.Object, _validateRegisterLogger.Object);

        // Act
        var result = await useCase.ExecuteAsync(42, 2024);

        // Assert
        result.Valid.Should().BeTrue();
    }

    [Fact]
    public async Task ValidateRegisterNumber_WithInvalidYear_ThrowsArgumentException()
    {
        // Arrange
        var useCase = new ValidateRegisterNumberUseCase(_mockEnvelopeService.Object, _validateRegisterLogger.Object);

        // Act & Assert
        await useCase.Invoking(u => u.ExecuteAsync(1, 1999))
            .Should().ThrowAsync<ArgumentException>();
    }

    public void Dispose() => _context.Dispose();
}
