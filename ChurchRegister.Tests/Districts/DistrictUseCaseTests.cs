using ChurchRegister.ApiService.Models.Districts;
using ChurchRegister.ApiService.Services.Districts;
using ChurchRegister.ApiService.UseCase.Districts.GetDistricts;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace ChurchRegister.ApiService.Tests.Districts;

public class DistrictUseCaseTests
{
    private readonly Mock<IDistrictService> _mockService;
    private readonly Mock<ILogger<GetDistrictsUseCase>> _getLogger;

    public DistrictUseCaseTests()
    {
        _mockService = new Mock<IDistrictService>();
        _getLogger = new Mock<ILogger<GetDistrictsUseCase>>();
    }

    // ─── GetDistrictsUseCase ─────────────────────────────────────────────────

    [Fact]
    public async Task GetDistricts_ReturnsAllDistricts()
    {
        // Arrange
        var districts = new List<DistrictDto>
        {
            new() { Id = 1, Name = "North District" },
            new() { Id = 2, Name = "South District" },
            new() { Id = 3, Name = "East District" }
        };
        _mockService.Setup(s => s.GetAllDistrictsAsync()).ReturnsAsync(districts);

        var useCase = new GetDistrictsUseCase(_mockService.Object, _getLogger.Object);

        // Act
        var result = await useCase.ExecuteAsync();

        // Assert
        result.Should().HaveCount(3);
        result.Should().ContainSingle(d => d.Name == "North District");
    }

    [Fact]
    public async Task GetDistricts_WhenNoDistricts_ReturnsEmptyList()
    {
        // Arrange
        _mockService.Setup(s => s.GetAllDistrictsAsync()).ReturnsAsync(new List<DistrictDto>());

        var useCase = new GetDistrictsUseCase(_mockService.Object, _getLogger.Object);

        // Act
        var result = await useCase.ExecuteAsync();

        // Assert
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetDistricts_CallsServiceExactlyOnce()
    {
        // Arrange
        _mockService.Setup(s => s.GetAllDistrictsAsync()).ReturnsAsync(new List<DistrictDto>());

        var useCase = new GetDistrictsUseCase(_mockService.Object, _getLogger.Object);

        // Act
        await useCase.ExecuteAsync();

        // Assert
        _mockService.Verify(s => s.GetAllDistrictsAsync(), Times.Once);
    }

    [Fact]
    public async Task GetDistricts_WhenServiceThrows_PropagatesException()
    {
        // Arrange
        _mockService
            .Setup(s => s.GetAllDistrictsAsync())
            .ThrowsAsync(new InvalidOperationException("Database error"));

        var useCase = new GetDistrictsUseCase(_mockService.Object, _getLogger.Object);

        // Act & Assert
        await useCase.Invoking(u => u.ExecuteAsync())
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Database error");
    }
}
