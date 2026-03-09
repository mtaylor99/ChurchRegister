using ChurchRegister.ApiService.Models;
using ChurchRegister.ApiService.Models.TrainingCertificates;
using ChurchRegister.ApiService.Services.TrainingCertificates;
using ChurchRegister.ApiService.UseCase.TrainingCertificates.CreateTrainingCertificate;
using ChurchRegister.ApiService.UseCase.TrainingCertificates.CreateTrainingCertificateType;
using ChurchRegister.ApiService.UseCase.TrainingCertificates.GetDashboardTrainingSummary;
using ChurchRegister.ApiService.UseCase.TrainingCertificates.GetTrainingCertificateById;
using ChurchRegister.ApiService.UseCase.TrainingCertificates.GetTrainingCertificates;
using ChurchRegister.ApiService.UseCase.TrainingCertificates.GetTrainingCertificateTypes;
using ChurchRegister.ApiService.UseCase.TrainingCertificates.UpdateTrainingCertificate;
using ChurchRegister.ApiService.UseCase.TrainingCertificates.UpdateTrainingCertificateType;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace ChurchRegister.ApiService.Tests.TrainingCertificates;

public class TrainingCertificateUseCaseTests
{
    private readonly Mock<ITrainingCertificateService> _mockService;
    private readonly Mock<ILogger<CreateTrainingCertificateUseCase>> _createLogger;
    private readonly Mock<ILogger<CreateTrainingCertificateTypeUseCase>> _createTypeLogger;
    private readonly Mock<ILogger<GetDashboardTrainingSummaryUseCase>> _dashboardLogger;
    private readonly Mock<ILogger<GetTrainingCertificateByIdUseCase>> _getByIdLogger;
    private readonly Mock<ILogger<GetTrainingCertificatesUseCase>> _getListLogger;
    private readonly Mock<ILogger<GetTrainingCertificateTypesUseCase>> _getTypesLogger;
    private readonly Mock<ILogger<UpdateTrainingCertificateUseCase>> _updateLogger;
    private readonly Mock<ILogger<UpdateTrainingCertificateTypeUseCase>> _updateTypeLogger;

    public TrainingCertificateUseCaseTests()
    {
        _mockService = new Mock<ITrainingCertificateService>();
        _createLogger = new Mock<ILogger<CreateTrainingCertificateUseCase>>();
        _createTypeLogger = new Mock<ILogger<CreateTrainingCertificateTypeUseCase>>();
        _dashboardLogger = new Mock<ILogger<GetDashboardTrainingSummaryUseCase>>();
        _getByIdLogger = new Mock<ILogger<GetTrainingCertificateByIdUseCase>>();
        _getListLogger = new Mock<ILogger<GetTrainingCertificatesUseCase>>();
        _getTypesLogger = new Mock<ILogger<GetTrainingCertificateTypesUseCase>>();
        _updateLogger = new Mock<ILogger<UpdateTrainingCertificateUseCase>>();
        _updateTypeLogger = new Mock<ILogger<UpdateTrainingCertificateTypeUseCase>>();
    }

    // ─── CreateTrainingCertificateUseCase ────────────────────────────────────

    [Fact]
    public async Task CreateTrainingCertificate_WithValidRequest_ReturnsCreatedDto()
    {
        // Arrange
        var request = new CreateTrainingCertificateRequest { ChurchMemberId = 1, TrainingCertificateTypeId = 2 };
        var expected = new TrainingCertificateDto { Id = 10, ChurchMemberId = 1, TrainingCertificateTypeId = 2 };

        _mockService
            .Setup(s => s.CreateTrainingCertificateAsync(request, "admin", It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        var useCase = new CreateTrainingCertificateUseCase(_mockService.Object, _createLogger.Object);

        // Act
        var result = await useCase.ExecuteAsync(request, "admin");

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(10);
        _mockService.Verify(s => s.CreateTrainingCertificateAsync(request, "admin", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateTrainingCertificate_WhenServiceThrows_PropagatesException()
    {
        // Arrange
        var request = new CreateTrainingCertificateRequest { ChurchMemberId = 1, TrainingCertificateTypeId = 2 };
        _mockService
            .Setup(s => s.CreateTrainingCertificateAsync(It.IsAny<CreateTrainingCertificateRequest>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Service error"));

        var useCase = new CreateTrainingCertificateUseCase(_mockService.Object, _createLogger.Object);

        // Act & Assert
        await useCase.Invoking(u => u.ExecuteAsync(request, "admin"))
            .Should().ThrowAsync<InvalidOperationException>();
    }

    // ─── GetTrainingCertificatesUseCase ──────────────────────────────────────

    [Fact]
    public async Task GetTrainingCertificates_WithQuery_ReturnsPagedResult()
    {
        // Arrange
        var query = new TrainingCertificateGridQuery { Page = 1, PageSize = 10 };
        var expected = new PagedResult<TrainingCertificateDto>
        {
            Items = new List<TrainingCertificateDto> { new() { Id = 1 }, new() { Id = 2 } },
            TotalCount = 2
        };

        _mockService
            .Setup(s => s.GetTrainingCertificatesAsync(query, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        var useCase = new GetTrainingCertificatesUseCase(_mockService.Object, _getListLogger.Object);

        // Act
        var result = await useCase.ExecuteAsync(query);

        // Assert
        result.Should().NotBeNull();
        result.TotalCount.Should().Be(2);
        result.Items.Should().HaveCount(2);
    }

    // ─── GetTrainingCertificateByIdUseCase ───────────────────────────────────

    [Fact]
    public async Task GetTrainingCertificateById_WithExistingId_ReturnsDto()
    {
        // Arrange
        var expected = new TrainingCertificateDto { Id = 5, ChurchMemberId = 1 };
        _mockService
            .Setup(s => s.GetTrainingCertificateByIdAsync(5, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        var useCase = new GetTrainingCertificateByIdUseCase(_mockService.Object, _getByIdLogger.Object);

        // Act
        var result = await useCase.ExecuteAsync(5);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(5);
    }

    [Fact]
    public async Task GetTrainingCertificateById_WithNonExistingId_ReturnsNull()
    {
        // Arrange
        _mockService
            .Setup(s => s.GetTrainingCertificateByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TrainingCertificateDto?)null);

        var useCase = new GetTrainingCertificateByIdUseCase(_mockService.Object, _getByIdLogger.Object);

        // Act
        var result = await useCase.ExecuteAsync(999);

        // Assert
        result.Should().BeNull();
    }

    // ─── UpdateTrainingCertificateUseCase ────────────────────────────────────

    [Fact]
    public async Task UpdateTrainingCertificate_WithValidRequest_ReturnsUpdatedDto()
    {
        // Arrange
        var request = new UpdateTrainingCertificateRequest { Id = 1, Status = "In Validity" };
        var expected = new TrainingCertificateDto { Id = 1, ChurchMemberId = 1, TrainingCertificateTypeId = 2 };

        _mockService
            .Setup(s => s.UpdateTrainingCertificateAsync(request, "editor", It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        var useCase = new UpdateTrainingCertificateUseCase(_mockService.Object, _updateLogger.Object);

        // Act
        var result = await useCase.ExecuteAsync(request, "editor");

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(1);
        _mockService.Verify(s => s.UpdateTrainingCertificateAsync(request, "editor", It.IsAny<CancellationToken>()), Times.Once);
    }

    // ─── GetTrainingCertificateTypesUseCase ──────────────────────────────────

    [Fact]
    public async Task GetTrainingCertificateTypes_WithNoFilter_ReturnsAllTypes()
    {
        // Arrange
        var types = new List<TrainingCertificateTypeDto>
        {
            new() { Id = 1, Type = "Safeguarding" },
            new() { Id = 2, Type = "First Aid" }
        };

        _mockService
            .Setup(s => s.GetTrainingCertificateTypesAsync(null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(types);

        var useCase = new GetTrainingCertificateTypesUseCase(_mockService.Object, _getTypesLogger.Object);

        // Act
        var result = await useCase.ExecuteAsync();

        // Assert
        result.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetTrainingCertificateTypes_WithActiveFilter_ReturnsFilteredTypes()
    {
        // Arrange
        var activeTypes = new List<TrainingCertificateTypeDto> { new() { Id = 1, Type = "Safeguarding" } };

        _mockService
            .Setup(s => s.GetTrainingCertificateTypesAsync("Active", It.IsAny<CancellationToken>()))
            .ReturnsAsync(activeTypes);

        var useCase = new GetTrainingCertificateTypesUseCase(_mockService.Object, _getTypesLogger.Object);

        // Act
        var result = await useCase.ExecuteAsync("Active");

        // Assert
        result.Should().HaveCount(1);
    }

    // ─── CreateTrainingCertificateTypeUseCase ────────────────────────────────

    [Fact]
    public async Task CreateTrainingCertificateType_WithValidRequest_ReturnsCreatedType()
    {
        // Arrange
        var request = new CreateTrainingCertificateTypeRequest { Type = "DBS Check", Status = "Active" };
        var expected = new TrainingCertificateTypeDto { Id = 3, Type = "DBS Check" };

        _mockService
            .Setup(s => s.CreateTrainingCertificateTypeAsync(request, "admin", It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        var useCase = new CreateTrainingCertificateTypeUseCase(_mockService.Object, _createTypeLogger.Object);

        // Act
        var result = await useCase.ExecuteAsync(request, "admin");

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(3);
        result.Type.Should().Be("DBS Check");
    }

    // ─── UpdateTrainingCertificateTypeUseCase ────────────────────────────────

    [Fact]
    public async Task UpdateTrainingCertificateType_WithValidRequest_ReturnsUpdatedType()
    {
        // Arrange
        var request = new UpdateTrainingCertificateTypeRequest { Id = 1, Type = "Safeguarding Updated", Status = "Active" };
        var expected = new TrainingCertificateTypeDto { Id = 1, Type = "Safeguarding Updated" };

        _mockService
            .Setup(s => s.UpdateTrainingCertificateTypeAsync(request, "admin", It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        var useCase = new UpdateTrainingCertificateTypeUseCase(_mockService.Object, _updateTypeLogger.Object);

        // Act
        var result = await useCase.ExecuteAsync(request, "admin");

        // Assert
        result.Type.Should().Be("Safeguarding Updated");
        _mockService.Verify(s => s.UpdateTrainingCertificateTypeAsync(request, "admin", It.IsAny<CancellationToken>()), Times.Once);
    }

    // ─── GetDashboardTrainingSummaryUseCase ──────────────────────────────────

    [Fact]
    public async Task GetDashboardTrainingSummary_ReturnsGroupedAlerts()
    {
        // Arrange
        var summaries = new List<TrainingCertificateGroupSummaryDto>
        {
            new() { TrainingType = "Safeguarding", MemberCount = 8, Status = "Red", Message = "Expired" },
            new() { TrainingType = "First Aid", MemberCount = 5, Status = "Amber", Message = "Expiring soon" }
        };

        _mockService
            .Setup(s => s.GetDashboardTrainingSummaryAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(summaries);

        var useCase = new GetDashboardTrainingSummaryUseCase(_mockService.Object, _dashboardLogger.Object);

        // Act
        var result = await useCase.ExecuteAsync();

        // Assert
        result.Should().HaveCount(2);
        result.First().TrainingType.Should().Be("Safeguarding");
    }
}
