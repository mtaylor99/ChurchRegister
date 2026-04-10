using ChurchRegister.ApiService.Models.Contributions;
using ChurchRegister.ApiService.Services.Contributions;
using ChurchRegister.ApiService.UseCase.Contributions.AssignTransaction;
using ChurchRegister.ApiService.UseCase.Contributions.ExcludeReference;
using ChurchRegister.ApiService.UseCase.Contributions.UploadHsbcStatement;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace ChurchRegister.ApiService.Tests.Contributions;

public class ContributionAdditionalUseCaseTests
{
    private readonly Mock<IHsbcUnmatchedTransactionService> _mockUnmatchedService;
    private readonly Mock<IHsbcCsvParser> _mockCsvParser;
    private readonly Mock<IHsbcTransactionImportService> _mockImportService;
    private readonly Mock<IContributionProcessingService> _mockProcessingService;

    public ContributionAdditionalUseCaseTests()
    {
        _mockUnmatchedService = new Mock<IHsbcUnmatchedTransactionService>();
        _mockCsvParser = new Mock<IHsbcCsvParser>();
        _mockImportService = new Mock<IHsbcTransactionImportService>();
        _mockProcessingService = new Mock<IContributionProcessingService>();
    }

    // ─── AssignTransactionUseCase ────────────────────────────────────────────

    [Fact]
    public async Task AssignTransaction_DelegatesToService()
    {
        // Arrange
        var expected = new AssignTransactionResponse(true, "Assigned", 1, false, 1);
        _mockUnmatchedService
            .Setup(s => s.AssignTransactionToMemberAsync(10, 5, null, "admin", It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        var mockLogger = new Mock<ILogger<AssignTransactionUseCase>>();
        var useCase = new AssignTransactionUseCase(_mockUnmatchedService.Object, mockLogger.Object);
        var request = new AssignTransactionRequest(5);

        // Act
        var result = await useCase.ExecuteAsync(10, request, "admin", CancellationToken.None);

        // Assert
        result.Should().Be(expected);
        result.Success.Should().BeTrue();
        result.ReProcessedMatchedCount.Should().Be(1);
        _mockUnmatchedService.Verify(
            s => s.AssignTransactionToMemberAsync(10, 5, null, "admin", It.IsAny<CancellationToken>()),
            Times.Once);
    }

    // ─── ExcludeReferenceUseCase ─────────────────────────────────────────────

    [Fact]
    public async Task ExcludeReference_DelegatesToService()
    {
        // Arrange
        var expected = new ExcludeReferenceResponse(true, "REF-001", "Reference excluded");
        _mockUnmatchedService
            .Setup(s => s.ExcludeReferenceAsync(7, "admin", It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        var useCase = new ExcludeReferenceUseCase(_mockUnmatchedService.Object);

        // Act
        var result = await useCase.ExecuteAsync(7, "admin", CancellationToken.None);

        // Assert
        result.Should().Be(expected);
        result.Success.Should().BeTrue();
        result.Reference.Should().Be("REF-001");
        _mockUnmatchedService.Verify(
            s => s.ExcludeReferenceAsync(7, "admin", It.IsAny<CancellationToken>()),
            Times.Once);
    }

    // ─── UploadHsbcStatementUseCase ──────────────────────────────────────────

    [Fact]
    public async Task UploadHsbcStatement_WithValidCsv_ReturnsSuccessResponse()
    {
        // Arrange
        var csvContent = "Date,Description,Money In\n01/01/2026,Offering REF001,50.00";
        var file = CreateFormFile(csvContent, "statement.csv");

        var parseResult = new HsbcParseResult
        {
            Transactions = new List<HsbcTransaction>
            {
                new() { Date = new DateTime(2026, 1, 1), Description = "Offering REF001", MoneyIn = 50.00m, Reference = "REF001" }
            }
        };

        _mockCsvParser
            .Setup(p => p.ParseAsync(It.IsAny<Stream>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(parseResult);

        _mockImportService
            .Setup(s => s.ImportTransactionsAsync(It.IsAny<List<HsbcTransaction>>(), "admin", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ImportResult { NewTransactions = 1, DuplicatesSkipped = 0, IgnoredNoMoneyIn = 0 });

        _mockProcessingService
            .Setup(s => s.ProcessHsbcTransactionsAsync("admin", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ContributionProcessingResult { Success = true, MatchedCount = 1, UnmatchedCount = 0, TotalAmount = 50.00m });

        var useCase = new UploadHsbcStatementUseCase(
            _mockCsvParser.Object,
            _mockImportService.Object,
            _mockProcessingService.Object,
            Mock.Of<ILogger<UploadHsbcStatementUseCase>>());

        // Act
        var result = await useCase.ExecuteAsync(file, "admin");

        // Assert
        result.Success.Should().BeTrue();
        result.Message.Should().Contain("1 new transaction");
        _mockCsvParser.Verify(p => p.ParseAsync(It.IsAny<Stream>(), It.IsAny<CancellationToken>()), Times.Once);
        _mockImportService.Verify(s => s.ImportTransactionsAsync(It.IsAny<List<HsbcTransaction>>(), "admin", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UploadHsbcStatement_WithInvalidFile_ThrowsArgumentException()
    {
        // Arrange
        var file = CreateFormFile("not csv", "statement.txt");

        var useCase = new UploadHsbcStatementUseCase(
            _mockCsvParser.Object,
            _mockImportService.Object,
            _mockProcessingService.Object,
            Mock.Of<ILogger<UploadHsbcStatementUseCase>>());

        // Act & Assert
        await useCase.Invoking(u => u.ExecuteAsync(file, "admin"))
            .Should().ThrowAsync<ArgumentException>()
            .WithMessage("*CSV*");
    }

    [Fact]
    public async Task UploadHsbcStatement_WithFailedParse_ReturnsFailureResponse()
    {
        // Arrange
        var file = CreateFormFile("bad data", "statement.csv");

        _mockCsvParser
            .Setup(p => p.ParseAsync(It.IsAny<Stream>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new HsbcParseResult
            {
                Errors = new List<string> { "Invalid format" }
            });

        var useCase = new UploadHsbcStatementUseCase(
            _mockCsvParser.Object,
            _mockImportService.Object,
            _mockProcessingService.Object,
            Mock.Of<ILogger<UploadHsbcStatementUseCase>>());

        // Act
        var result = await useCase.ExecuteAsync(file, "admin");

        // Assert
        result.Success.Should().BeFalse();
        result.Errors.Should().Contain("Invalid format");
    }

    [Fact]
    public async Task UploadHsbcStatement_WithNoTransactions_ReturnsFailure()
    {
        // Arrange
        var file = CreateFormFile("Date,Description,Money In", "statement.csv");

        _mockCsvParser
            .Setup(p => p.ParseAsync(It.IsAny<Stream>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new HsbcParseResult
            {
                Transactions = new List<HsbcTransaction>()
            });

        var useCase = new UploadHsbcStatementUseCase(
            _mockCsvParser.Object,
            _mockImportService.Object,
            _mockProcessingService.Object,
            Mock.Of<ILogger<UploadHsbcStatementUseCase>>());

        // Act
        var result = await useCase.ExecuteAsync(file, "admin");

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("No valid transactions");
    }

    private static IFormFile CreateFormFile(string content, string fileName)
    {
        var stream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(content));
        return new FormFile(stream, 0, stream.Length, "file", fileName);
    }
}
