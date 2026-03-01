using ChurchRegister.ApiService.Models.DataProtection;
using ChurchRegister.ApiService.Services.DataProtection;
using ChurchRegister.ApiService.UseCase.DataProtection.GetDataProtection;
using ChurchRegister.ApiService.UseCase.DataProtection.UpdateDataProtection;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace ChurchRegister.ApiService.Tests.DataProtection;

public class DataProtectionUseCaseTests
{
    private readonly Mock<IDataProtectionService> _mockService;
    private readonly Mock<ILogger<GetDataProtectionUseCase>> _getLogger;
    private readonly Mock<ILogger<UpdateDataProtectionUseCase>> _updateLogger;

    public DataProtectionUseCaseTests()
    {
        _mockService = new Mock<IDataProtectionService>();
        _getLogger = new Mock<ILogger<GetDataProtectionUseCase>>();
        _updateLogger = new Mock<ILogger<UpdateDataProtectionUseCase>>();
    }

    // ─── GetDataProtectionUseCase ────────────────────────────────────────────

    [Fact]
    public async Task GetDataProtection_WithValidMemberId_ReturnsDto()
    {
        // Arrange
        var expected = new DataProtectionDto { ChurchMemberId = 5, AllowNameInCommunications = true };
        _mockService.Setup(s => s.GetDataProtectionAsync(5)).ReturnsAsync(expected);

        var useCase = new GetDataProtectionUseCase(_mockService.Object, _getLogger.Object);

        // Act
        var result = await useCase.ExecuteAsync(5);

        // Assert
        result.Should().NotBeNull();
        result!.ChurchMemberId.Should().Be(5);
        result.AllowNameInCommunications.Should().BeTrue();
    }

    [Fact]
    public async Task GetDataProtection_WithInvalidMemberId_ThrowsArgumentException()
    {
        // Arrange
        var useCase = new GetDataProtectionUseCase(_mockService.Object, _getLogger.Object);

        // Act & Assert
        await useCase.Invoking(u => u.ExecuteAsync(0))
            .Should().ThrowAsync<ArgumentException>();

        _mockService.Verify(s => s.GetDataProtectionAsync(It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task GetDataProtection_WhenNotFound_ReturnsNull()
    {
        // Arrange
        _mockService.Setup(s => s.GetDataProtectionAsync(999)).ReturnsAsync((DataProtectionDto?)null);

        var useCase = new GetDataProtectionUseCase(_mockService.Object, _getLogger.Object);

        // Act
        var result = await useCase.ExecuteAsync(999);

        // Assert
        result.Should().BeNull();
    }

    // ─── UpdateDataProtectionUseCase ─────────────────────────────────────────

    [Fact]
    public async Task UpdateDataProtection_WithValidRequest_ReturnsUpdatedDto()
    {
        // Arrange
        var request = new UpdateDataProtectionRequest
        {
            AllowNameInCommunications = true,
            AllowHealthStatusInCommunications = false,
            AllowPhotoInCommunications = true,
            AllowPhotoInSocialMedia = false,
            GroupPhotos = true,
            PermissionForMyChildren = false
        };
        var expected = new DataProtectionDto { ChurchMemberId = 3, AllowNameInCommunications = true };
        _mockService.Setup(s => s.UpdateDataProtectionAsync(3, request, "admin")).ReturnsAsync(expected);

        var useCase = new UpdateDataProtectionUseCase(_mockService.Object, _updateLogger.Object);

        // Act
        var result = await useCase.ExecuteAsync(3, request, "admin");

        // Assert
        result.Should().NotBeNull();
        result!.ChurchMemberId.Should().Be(3);
        _mockService.Verify(s => s.UpdateDataProtectionAsync(3, request, "admin"), Times.Once);
    }

    [Fact]
    public async Task UpdateDataProtection_WithInvalidMemberId_ThrowsArgumentException()
    {
        // Arrange
        var request = new UpdateDataProtectionRequest();
        var useCase = new UpdateDataProtectionUseCase(_mockService.Object, _updateLogger.Object);

        // Act & Assert
        await useCase.Invoking(u => u.ExecuteAsync(-1, request, "admin"))
            .Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task UpdateDataProtection_WithEmptyUsername_ThrowsArgumentException()
    {
        // Arrange
        var request = new UpdateDataProtectionRequest();
        var useCase = new UpdateDataProtectionUseCase(_mockService.Object, _updateLogger.Object);

        // Act & Assert
        await useCase.Invoking(u => u.ExecuteAsync(1, request, ""))
            .Should().ThrowAsync<ArgumentException>();
    }
}
