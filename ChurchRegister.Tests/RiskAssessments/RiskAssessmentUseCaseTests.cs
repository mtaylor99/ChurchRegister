using ChurchRegister.ApiService.Models.RiskAssessments;
using ChurchRegister.ApiService.Services.RiskAssessments;
using ChurchRegister.ApiService.UseCase.RiskAssessments.CreateRiskAssessment;
using ChurchRegister.ApiService.UseCase.RiskAssessments.GetRiskAssessments;
using ChurchRegister.ApiService.UseCase.RiskAssessments.GetRiskAssessmentById;
using ChurchRegister.ApiService.UseCase.RiskAssessments.ApproveRiskAssessment;
using ChurchRegister.ApiService.UseCase.RiskAssessments.StartReview;
using ChurchRegister.ApiService.UseCase.RiskAssessments.GetDashboardRiskAssessmentSummary;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace ChurchRegister.ApiService.Tests.RiskAssessments;

public class RiskAssessmentUseCaseTests
{
    private readonly Mock<IRiskAssessmentService> _mockService;
    private readonly Mock<ILogger<CreateRiskAssessmentUseCase>> _createLogger;
    private readonly Mock<ILogger<GetRiskAssessmentsUseCase>> _getLogger;
    private readonly Mock<ILogger<GetRiskAssessmentByIdUseCase>> _getByIdLogger;
    private readonly Mock<ILogger<ApproveRiskAssessmentUseCase>> _approveLogger;
    private readonly Mock<ILogger<StartReviewUseCase>> _startReviewLogger;
    private readonly Mock<ILogger<GetDashboardRiskAssessmentSummaryUseCase>> _dashboardLogger;

    public RiskAssessmentUseCaseTests()
    {
        _mockService = new Mock<IRiskAssessmentService>();
        _createLogger = new Mock<ILogger<CreateRiskAssessmentUseCase>>();
        _getLogger = new Mock<ILogger<GetRiskAssessmentsUseCase>>();
        _getByIdLogger = new Mock<ILogger<GetRiskAssessmentByIdUseCase>>();
        _approveLogger = new Mock<ILogger<ApproveRiskAssessmentUseCase>>();
        _startReviewLogger = new Mock<ILogger<StartReviewUseCase>>();
        _dashboardLogger = new Mock<ILogger<GetDashboardRiskAssessmentSummaryUseCase>>();
    }

    // ─── CreateRiskAssessmentUseCase ────────────────────────────────────────

    [Fact]
    public async Task CreateRiskAssessment_WithValidRequest_ReturnsCreatedDto()
    {
        // Arrange
        var request = new CreateRiskAssessmentRequest
        {
            Title = "Fire Safety",
            CategoryId = 1,
            ReviewInterval = 12
        };
        var expected = new RiskAssessmentDto { Id = 42, Title = "Fire Safety", CategoryId = 1 };

        _mockService
            .Setup(s => s.CreateRiskAssessmentAsync(request, "admin"))
            .ReturnsAsync(expected);

        var useCase = new CreateRiskAssessmentUseCase(_mockService.Object, _createLogger.Object);

        // Act
        var result = await useCase.ExecuteAsync(request, "admin");

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(42);
        result.Title.Should().Be("Fire Safety");
        _mockService.Verify(s => s.CreateRiskAssessmentAsync(request, "admin"), Times.Once);
    }

    [Fact]
    public async Task CreateRiskAssessment_WhenServiceThrows_PropagatesException()
    {
        // Arrange
        var request = new CreateRiskAssessmentRequest { Title = "Test", CategoryId = 1, ReviewInterval = 6 };
        _mockService
            .Setup(s => s.CreateRiskAssessmentAsync(It.IsAny<CreateRiskAssessmentRequest>(), It.IsAny<string>()))
            .ThrowsAsync(new InvalidOperationException("Service error"));

        var useCase = new CreateRiskAssessmentUseCase(_mockService.Object, _createLogger.Object);

        // Act & Assert
        await useCase.Invoking(u => u.ExecuteAsync(request, "admin"))
            .Should().ThrowAsync<InvalidOperationException>();
    }

    // ─── GetRiskAssessmentsUseCase ──────────────────────────────────────────

    [Fact]
    public async Task GetRiskAssessments_WithNoFilters_ReturnsAllAssessments()
    {
        // Arrange
        var assessments = new List<RiskAssessmentDto>
        {
            new() { Id = 1, Title = "Assessment A" },
            new() { Id = 2, Title = "Assessment B" }
        };
        _mockService
            .Setup(s => s.GetRiskAssessmentsAsync(null, null, null, null))
            .ReturnsAsync(assessments);

        var useCase = new GetRiskAssessmentsUseCase(_mockService.Object, _getLogger.Object);

        // Act
        var result = await useCase.ExecuteAsync(null, null, null, null);

        // Assert
        result.Should().HaveCount(2);
        result.Should().ContainSingle(a => a.Title == "Assessment A");
    }

    [Fact]
    public async Task GetRiskAssessments_WithCategoryFilter_PassesFilterToService()
    {
        // Arrange
        _mockService
            .Setup(s => s.GetRiskAssessmentsAsync(1, null, null, null))
            .ReturnsAsync(new List<RiskAssessmentDto> { new() { Id = 1, CategoryId = 1 } });

        var useCase = new GetRiskAssessmentsUseCase(_mockService.Object, _getLogger.Object);

        // Act
        var result = await useCase.ExecuteAsync(1, null, null);

        // Assert
        result.Should().HaveCount(1);
        _mockService.Verify(s => s.GetRiskAssessmentsAsync(1, null, null, null), Times.Once);
    }

    // ─── GetRiskAssessmentByIdUseCase ───────────────────────────────────────

    [Fact]
    public async Task GetRiskAssessmentById_WithValidId_ReturnsDto()
    {
        // Arrange
        var detail = new RiskAssessmentDetailDto { Id = 5, Title = "Electrical Safety" };
        _mockService.Setup(s => s.GetRiskAssessmentByIdAsync(5)).ReturnsAsync(detail);

        var useCase = new GetRiskAssessmentByIdUseCase(_mockService.Object, _getByIdLogger.Object);

        // Act
        var result = await useCase.ExecuteAsync(5);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(5);
    }

    [Fact]
    public async Task GetRiskAssessmentById_WithNonExistentId_ReturnsNull()
    {
        // Arrange
        _mockService.Setup(s => s.GetRiskAssessmentByIdAsync(999)).ReturnsAsync((RiskAssessmentDetailDto?)null);

        var useCase = new GetRiskAssessmentByIdUseCase(_mockService.Object, _getByIdLogger.Object);

        // Act
        var result = await useCase.ExecuteAsync(999);

        // Assert
        result.Should().BeNull();
    }

    // ─── ApproveRiskAssessmentUseCase ───────────────────────────────────────

    [Fact]
    public async Task ApproveRiskAssessment_WithValidRequest_ReturnsApprovalResponse()
    {
        // Arrange
        var request = new ApproveRiskAssessmentRequest { Notes = "Approved after review" };
        var expected = new ApproveRiskAssessmentResponse { ApprovalRecorded = true, AssessmentApproved = true };
        _mockService
            .Setup(s => s.ApproveRiskAssessmentAsync(3, request, "approver"))
            .ReturnsAsync(expected);

        var useCase = new ApproveRiskAssessmentUseCase(_mockService.Object, _approveLogger.Object);

        // Act
        var result = await useCase.ExecuteAsync(3, request, "approver");

        // Assert
        result.ApprovalRecorded.Should().BeTrue();
        result.AssessmentApproved.Should().BeTrue();
        _mockService.Verify(s => s.ApproveRiskAssessmentAsync(3, request, "approver"), Times.Once);
    }

    // ─── StartReviewUseCase ─────────────────────────────────────────────────

    [Fact]
    public async Task StartReview_WithValidId_ReturnsUpdatedDto()
    {
        // Arrange
        var expected = new RiskAssessmentDto { Id = 7, Status = "UnderReview" };
        _mockService.Setup(s => s.StartReviewAsync(7, "reviewer")).ReturnsAsync(expected);

        var useCase = new StartReviewUseCase(_mockService.Object, _startReviewLogger.Object);

        // Act
        var result = await useCase.ExecuteAsync(7, "reviewer");

        // Assert
        result.Status.Should().Be("UnderReview");
    }

    // ─── GetDashboardRiskAssessmentSummaryUseCase ───────────────────────────

    [Fact]
    public async Task GetDashboardSummary_ReturnsSummaryDto()
    {
        // Arrange
        var summary = new DashboardRiskAssessmentSummaryDto { TotalCount = 10, OverdueCount = 2 };
        _mockService.Setup(s => s.GetDashboardSummaryAsync()).ReturnsAsync(summary);

        var useCase = new GetDashboardRiskAssessmentSummaryUseCase(_mockService.Object, _dashboardLogger.Object);

        // Act
        var result = await useCase.ExecuteAsync();

        // Assert
        result.TotalCount.Should().Be(10);
        result.OverdueCount.Should().Be(2);
    }
}
