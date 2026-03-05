using ChurchRegister.ApiService.Exceptions;
using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.ApiService.Models.PastoralCare;
using ChurchRegister.ApiService.Services.ChurchMembers;
using ChurchRegister.ApiService.Services.PastoralCare;
using ChurchRegister.ApiService.UseCase.ChurchMembers.ExportPastoralCareReport;
using ChurchRegister.ApiService.UseCase.ChurchMembers.GenerateRegisterNumbers;
using ChurchRegister.ApiService.UseCase.ChurchMembers.PreviewRegisterNumbers;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace ChurchRegister.ApiService.Tests.ChurchMembers;

public class ChurchMemberAdditionalUseCaseTests
{
    private readonly Mock<IRegisterNumberService> _mockRegisterService;
    private readonly Mock<IChurchMemberService> _mockMemberService;
    private readonly Mock<IPastoralCarePdfService> _mockPdfService;

    public ChurchMemberAdditionalUseCaseTests()
    {
        _mockRegisterService = new Mock<IRegisterNumberService>();
        _mockMemberService = new Mock<IChurchMemberService>();
        _mockPdfService = new Mock<IPastoralCarePdfService>();
    }

    // ─── GenerateRegisterNumbersUseCase ──────────────────────────────────────

    [Fact]
    public async Task GenerateRegisterNumbers_WithValidRequest_ReturnsResponse()
    {
        // Arrange
        var expected = new GenerateRegisterNumbersResponse
        {
            Year = 2026,
            TotalMembersAssigned = 50,
            TotalNonMembersAssigned = 10,
            GeneratedDateTime = DateTime.UtcNow
        };

        _mockRegisterService
            .Setup(s => s.HasBeenGeneratedForYearAsync(2026, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _mockRegisterService
            .Setup(s => s.GenerateForYearAsync(2026, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        var useCase = new GenerateRegisterNumbersUseCase(
            _mockRegisterService.Object,
            Mock.Of<ILogger<GenerateRegisterNumbersUseCase>>());

        var request = new GenerateRegisterNumbersRequest { TargetYear = 2026, ConfirmGeneration = true };

        // Act
        var result = await useCase.ExecuteAsync(request);

        // Assert
        result.Year.Should().Be(2026);
        result.TotalMembersAssigned.Should().Be(50);
        result.TotalNonMembersAssigned.Should().Be(10);
        _mockRegisterService.Verify(s => s.GenerateForYearAsync(2026, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GenerateRegisterNumbers_WhenAlreadyGenerated_ThrowsValidationException()
    {
        // Arrange
        _mockRegisterService
            .Setup(s => s.HasBeenGeneratedForYearAsync(2026, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var useCase = new GenerateRegisterNumbersUseCase(
            _mockRegisterService.Object,
            Mock.Of<ILogger<GenerateRegisterNumbersUseCase>>());

        var request = new GenerateRegisterNumbersRequest { TargetYear = 2026, ConfirmGeneration = true };

        // Act & Assert
        await useCase.Invoking(u => u.ExecuteAsync(request))
            .Should().ThrowAsync<ValidationException>()
            .WithMessage("*already been generated*");
    }

    [Fact]
    public async Task GenerateRegisterNumbers_WithoutConfirmation_ThrowsArgumentException()
    {
        // Arrange
        var useCase = new GenerateRegisterNumbersUseCase(
            _mockRegisterService.Object,
            Mock.Of<ILogger<GenerateRegisterNumbersUseCase>>());

        var request = new GenerateRegisterNumbersRequest { TargetYear = 2026, ConfirmGeneration = false };

        // Act & Assert
        await useCase.Invoking(u => u.ExecuteAsync(request))
            .Should().ThrowAsync<ArgumentException>()
            .WithMessage("*confirmed*");
    }

    [Theory]
    [InlineData(1999)]
    [InlineData(2101)]
    public async Task GenerateRegisterNumbers_WithInvalidYear_ThrowsArgumentException(int year)
    {
        // Arrange
        var useCase = new GenerateRegisterNumbersUseCase(
            _mockRegisterService.Object,
            Mock.Of<ILogger<GenerateRegisterNumbersUseCase>>());

        var request = new GenerateRegisterNumbersRequest { TargetYear = year, ConfirmGeneration = true };

        // Act & Assert
        await useCase.Invoking(u => u.ExecuteAsync(request))
            .Should().ThrowAsync<ArgumentException>();
    }

    // ─── PreviewRegisterNumbersUseCase ───────────────────────────────────────

    [Fact]
    public async Task PreviewRegisterNumbers_WithValidYear_ReturnsPreview()
    {
        // Arrange
        var expected = new PreviewRegisterNumbersResponse
        {
            Year = 2026,
            TotalMembers = 45,
            TotalNonMembers = 8,
            PreviewGenerated = DateTime.UtcNow,
            Members = new List<RegisterNumberAssignment>
            {
                new() { RegisterNumber = 1, MemberId = 1, MemberName = "Alice Smith" }
            }
        };

        _mockRegisterService
            .Setup(s => s.PreviewForYearAsync(2026, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        var useCase = new PreviewRegisterNumbersUseCase(
            _mockRegisterService.Object,
            Mock.Of<ILogger<PreviewRegisterNumbersUseCase>>());

        // Act
        var result = await useCase.ExecuteAsync(2026);

        // Assert
        result.Year.Should().Be(2026);
        result.TotalMembers.Should().Be(45);
        result.Members.Should().HaveCount(1);
    }

    [Theory]
    [InlineData(1999)]
    [InlineData(2101)]
    public async Task PreviewRegisterNumbers_WithInvalidYear_ThrowsArgumentException(int year)
    {
        // Arrange
        var useCase = new PreviewRegisterNumbersUseCase(
            _mockRegisterService.Object,
            Mock.Of<ILogger<PreviewRegisterNumbersUseCase>>());

        // Act & Assert
        await useCase.Invoking(u => u.ExecuteAsync(year))
            .Should().ThrowAsync<ArgumentException>();
    }

    // ─── ExportPastoralCareReportUseCase ─────────────────────────────────────

    [Fact]
    public async Task ExportPastoralCareReport_ReturnsNonEmptyPdfBytes()
    {
        // Arrange
        var reportData = new PastoralCareReportDto
        {
            TotalMembers = 15,
            Districts = new[]
            {
                new PastoralCareDistrictDto
                {
                    DistrictName = "District 1",
                    DeaconName = "John Doe",
                    Members = new[]
                    {
                        new PastoralCareMemberDto { FirstName = "Alice", LastName = "Smith" }
                    }
                }
            }
        };

        _mockMemberService
            .Setup(s => s.GetPastoralCareReportDataAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(reportData);

        _mockPdfService
            .Setup(s => s.GeneratePastoralCareReportAsync(reportData, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new byte[] { 0x25, 0x50, 0x44, 0x46 }); // %PDF header

        var useCase = new ExportPastoralCareReportUseCase(
            _mockMemberService.Object,
            _mockPdfService.Object,
            Mock.Of<ILogger<ExportPastoralCareReportUseCase>>());

        // Act
        var result = await useCase.ExecuteAsync();

        // Assert
        result.Should().NotBeEmpty();
        result.Length.Should().BeGreaterThan(0);
        _mockMemberService.Verify(s => s.GetPastoralCareReportDataAsync(It.IsAny<CancellationToken>()), Times.Once);
        _mockPdfService.Verify(s => s.GeneratePastoralCareReportAsync(reportData, It.IsAny<CancellationToken>()), Times.Once);
    }
}
