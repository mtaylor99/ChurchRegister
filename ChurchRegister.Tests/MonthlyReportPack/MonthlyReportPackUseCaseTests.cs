using ChurchRegister.ApiService.Models.MonthlyReportPack;
using ChurchRegister.ApiService.Services.Email;
using ChurchRegister.ApiService.Services.MonthlyReportPack;
using ChurchRegister.ApiService.UseCase.MonthlyReportPack.GenerateMonthlyReportPack;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;

namespace ChurchRegister.ApiService.Tests.MonthlyReportPack;

public class MonthlyReportPackUseCaseTests
{
    private readonly Mock<IMonthlyReportPackService> _mockReportService;
    private readonly Mock<IEmailService> _mockEmailService;
    private readonly Mock<ILogger<GenerateMonthlyReportPackUseCase>> _mockLogger;
    private readonly EmailTemplateBuilder _emailTemplateBuilder;

    public MonthlyReportPackUseCaseTests()
    {
        _mockReportService = new Mock<IMonthlyReportPackService>();
        _mockEmailService = new Mock<IEmailService>();
        _mockLogger = new Mock<ILogger<GenerateMonthlyReportPackUseCase>>();

        // Build real EmailTemplateBuilder with mocked dependencies
        var configMock = new Mock<IConfiguration>();
        configMock.Setup(c => c["ChurchName"]).Returns("Test Church");

        var httpContextAccessorMock = new Mock<Microsoft.AspNetCore.Http.IHttpContextAccessor>();
        httpContextAccessorMock.Setup(h => h.HttpContext).Returns((Microsoft.AspNetCore.Http.HttpContext?)null);

        _emailTemplateBuilder = new EmailTemplateBuilder(configMock.Object, httpContextAccessorMock.Object);
    }

    private GenerateMonthlyReportPackUseCase CreateUseCase() =>
        new(_mockReportService.Object, _mockEmailService.Object, _emailTemplateBuilder, _mockLogger.Object);

    // ─── GenerateMonthlyReportPackUseCase ─────────────────────────────────────────

    [Fact]
    public async Task ExecuteAsync_WithSuccessfulReports_ReturnsResult()
    {
        // Arrange
        var expectedResult = new MonthlyReportPackResult
        {
            GeneratedDate = DateTime.UtcNow,
            GeneratedBy = "System",
            SuccessfulReports = new List<ReportFile>
            {
                new() { FileName = "attendance.pdf", FileData = new byte[] { 1, 2, 3 } }
            },
            FailedReports = new List<ReportFailure>()
        };

        _mockReportService
            .Setup(s => s.GenerateReportPackAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedResult);

        _mockEmailService
            .Setup(e => e.CreateEmailWithAttachments(It.IsAny<EmailTemplateData>()))
            .Verifiable();

        var useCase = CreateUseCase();

        // Act
        var result = await useCase.ExecuteAsync();

        // Assert
        result.Should().NotBeNull();
        result.SuccessfulReports.Should().HaveCount(1);
        result.SuccessfulReports.First().FileName.Should().Be("attendance.pdf");
        _mockReportService.Verify(s => s.GenerateReportPackAsync(It.IsAny<CancellationToken>()), Times.Once);
        _mockEmailService.Verify(e => e.CreateEmailWithAttachments(It.IsAny<EmailTemplateData>()), Times.Once);
    }

    [Fact]
    public async Task ExecuteAsync_WithNoReports_ReturnsEmptyResult()
    {
        // Arrange
        var emptyResult = new MonthlyReportPackResult
        {
            GeneratedDate = DateTime.UtcNow,
            GeneratedBy = "System",
            SuccessfulReports = new List<ReportFile>(),
            FailedReports = new List<ReportFailure>()
        };

        _mockReportService
            .Setup(s => s.GenerateReportPackAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(emptyResult);

        _mockEmailService
            .Setup(e => e.CreateEmailWithAttachments(It.IsAny<EmailTemplateData>()));

        var useCase = CreateUseCase();

        // Act
        var result = await useCase.ExecuteAsync();

        // Assert
        result.SuccessfulReports.Should().BeEmpty();
        result.FailedReports.Should().BeEmpty();
    }

    [Fact]
    public async Task ExecuteAsync_WithFailedReports_ReturnsResultWithFailures()
    {
        // Arrange
        var resultWithFailures = new MonthlyReportPackResult
        {
            GeneratedDate = DateTime.UtcNow,
            GeneratedBy = "System",
            SuccessfulReports = new List<ReportFile>
            {
                new() { FileName = "member-list.pdf", FileData = new byte[] { 10, 20 } }
            },
            FailedReports = new List<ReportFailure>
            {
                new() { ReportName = "contributions.pdf", ErrorMessage = "Data not available" }
            }
        };

        _mockReportService
            .Setup(s => s.GenerateReportPackAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(resultWithFailures);

        _mockEmailService
            .Setup(e => e.CreateEmailWithAttachments(It.IsAny<EmailTemplateData>()));

        var useCase = CreateUseCase();

        // Act
        var result = await useCase.ExecuteAsync();

        // Assert
        result.SuccessfulReports.Should().HaveCount(1);
        result.FailedReports.Should().HaveCount(1);
        result.FailedReports.First().ReportName.Should().Be("contributions.pdf");
    }

    [Fact]
    public async Task ExecuteAsync_WhenServiceThrows_PropagatesException()
    {
        // Arrange
        _mockReportService
            .Setup(s => s.GenerateReportPackAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Report generation failed"));

        var useCase = CreateUseCase();

        // Act & Assert
        await useCase.Invoking(u => u.ExecuteAsync())
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Report generation failed");
    }

    [Fact]
    public async Task ExecuteAsync_AlwaysCallsEmailService_EvenWithEmptyReports()
    {
        // Arrange
        _mockReportService
            .Setup(s => s.GenerateReportPackAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new MonthlyReportPackResult { GeneratedDate = DateTime.UtcNow, GeneratedBy = "System" });

        _mockEmailService
            .Setup(e => e.CreateEmailWithAttachments(It.IsAny<EmailTemplateData>()));

        var useCase = CreateUseCase();

        // Act
        await useCase.ExecuteAsync();

        // Assert
        _mockEmailService.Verify(e => e.CreateEmailWithAttachments(It.IsAny<EmailTemplateData>()), Times.Once);
    }
}
