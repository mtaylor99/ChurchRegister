using Azure;
using Azure.Communication.Email;
using ChurchRegister.ApiService.Configuration;
using ChurchRegister.ApiService.Services.ChurchMembers;
using ChurchRegister.ApiService.Services.Contributions;
using ChurchRegister.ApiService.Services.Security;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace ChurchRegister.ApiService.Tests.Security;

public class AzureEmailServiceTests
{
    private readonly Mock<ILogger<AzureEmailService>> _mockLogger;
    private readonly AzureEmailServiceConfiguration _configuration;

    public AzureEmailServiceTests()
    {
        _mockLogger = new Mock<ILogger<AzureEmailService>>();
        _configuration = new AzureEmailServiceConfiguration
        {
            ConnectionString = "endpoint=https://test.communication.azure.com/;accesskey=testkey",
            SenderEmail = "noreply@test.com",
            EnableEmailVerification = true
        };
    }

    [Fact]
    public void Constructor_WithValidConfiguration_CreatesService()
    {
        // Arrange
        var options = Options.Create(_configuration);

        // Act
        var service = new AzureEmailService(options, _mockLogger.Object);

        // Assert
        service.Should().NotBeNull();
    }

    [Fact]
    public void Constructor_WithEmptyConnectionString_LogsWarning()
    {
        // Arrange
        var emptyConfig = new AzureEmailServiceConfiguration
        {
            ConnectionString = "",
            SenderEmail = "test@test.com"
        };
        var options = Options.Create(emptyConfig);

        // Act
        var service = new AzureEmailService(options, _mockLogger.Object);

        // Assert
        service.Should().NotBeNull();
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("connection string is not configured")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task SendUserVerificationEmailAsync_WhenDisabled_ReturnsTrue()
    {
        // Arrange
        var disabledConfig = new AzureEmailServiceConfiguration
        {
            ConnectionString = "endpoint=https://test.communication.azure.com/;accesskey=testkey==",
            SenderEmail = "test@test.com",
            EnableEmailVerification = false
        };
        var options = Options.Create(disabledConfig);
        var service = new AzureEmailService(options, _mockLogger.Object);

        // Act
        var result = await service.SendUserVerificationEmailAsync("user@test.com", "Test", "http://link");

        // Assert
        result.Should().BeTrue();
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Email verification is disabled")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task SendUserVerificationEmailAsync_WithNullConnectionString_ReturnsFalse()
    {
        // Arrange
        var nullConfig = new AzureEmailServiceConfiguration
        {
            ConnectionString = null!,
            SenderEmail = "test@test.com",
            EnableEmailVerification = true
        };
        var options = Options.Create(nullConfig);
        var service = new AzureEmailService(options, _mockLogger.Object);

        // Act
        var result = await service.SendUserVerificationEmailAsync("user@test.com", "Test", "http://link");

        // Assert - Should return false since connection string is null (email disabled)
        result.Should().BeFalse();
    }
}
