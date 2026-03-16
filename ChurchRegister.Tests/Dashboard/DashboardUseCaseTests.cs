using ChurchRegister.ApiService.Models.TrainingCertificates;
using ChurchRegister.ApiService.Services.TrainingCertificates;
using ChurchRegister.ApiService.UseCase.Dashboard.GetDashboardStatistics;
using ChurchRegister.Database.Data;
using ChurchRegister.Database.Entities;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;

namespace ChurchRegister.ApiService.Tests.Dashboard;

public class DashboardUseCaseTests : IDisposable
{
    private readonly ChurchRegisterWebContext _context;
    private readonly Mock<ITrainingCertificateService> _mockTrainingService;
    private readonly Mock<ILogger<GetDashboardStatisticsUseCase>> _mockLogger;

    public DashboardUseCaseTests()
    {
        var options = new DbContextOptionsBuilder<ChurchRegisterWebContext>()
            .UseInMemoryDatabase($"DashboardTests_{Guid.NewGuid()}")
            .Options;

        _context = new ChurchRegisterWebContext(options);
        _mockTrainingService = new Mock<ITrainingCertificateService>();
        _mockLogger = new Mock<ILogger<GetDashboardStatisticsUseCase>>();

        SeedBaseData();
    }

    private void SeedBaseData()
    {
        _context.ChurchMemberStatuses.AddRange(
            new ChurchMemberStatus { Id = 1, Name = "Active", CreatedBy = "system", CreatedDateTime = DateTime.UtcNow },
            new ChurchMemberStatus { Id = 2, Name = "Inactive", CreatedBy = "system", CreatedDateTime = DateTime.UtcNow }
        );
        _context.SaveChanges();
    }

    private GetDashboardStatisticsUseCase CreateUseCase() =>
        new(_context, _mockTrainingService.Object, _mockLogger.Object);

    private void SetupEmptyTrainingAlerts() =>
        _mockTrainingService
            .Setup(s => s.GetDashboardTrainingSummaryAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TrainingCertificateGroupSummaryDto>());

    // ─── GetDashboardStatisticsUseCase ────────────────────────────────────────────

    [Fact]
    public async Task ExecuteAsync_WithNoMembers_ReturnsZeroTotals()
    {
        // Arrange
        SetupEmptyTrainingAlerts();
        var useCase = CreateUseCase();

        // Act
        var result = await useCase.ExecuteAsync();

        // Assert
        result.Should().NotBeNull();
        result.TotalMembers.Should().Be(0);
        result.NewMembersThisMonth.Should().Be(0);
        result.NewMembersThisWeek.Should().Be(0);
    }

    [Fact]
    public async Task ExecuteAsync_WithActiveAndInactiveMembers_CountsOnlyActive()
    {
        // Arrange
        _context.ChurchMembers.AddRange(
            new ChurchMember { FirstName = "Alice", LastName = "Smith", ChurchMemberStatusId = 1, MemberSince = DateTime.UtcNow.AddYears(-1), CreatedBy = "system", CreatedDateTime = DateTime.UtcNow },
            new ChurchMember { FirstName = "Bob", LastName = "Jones", ChurchMemberStatusId = 1, MemberSince = DateTime.UtcNow.AddYears(-2), CreatedBy = "system", CreatedDateTime = DateTime.UtcNow },
            new ChurchMember { FirstName = "Carol", LastName = "Brown", ChurchMemberStatusId = 2, MemberSince = DateTime.UtcNow.AddYears(-1), CreatedBy = "system", CreatedDateTime = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        SetupEmptyTrainingAlerts();
        var useCase = CreateUseCase();

        // Act
        var result = await useCase.ExecuteAsync();

        // Assert
        result.TotalMembers.Should().Be(2); // Only active (status 1)
    }

    [Fact]
    public async Task ExecuteAsync_WithRecentMembers_ReturnsCorrectNewMemberCounts()
    {
        // Arrange
        _context.ChurchMembers.AddRange(
            new ChurchMember { FirstName = "Dave", LastName = "New", ChurchMemberStatusId = 1, MemberSince = DateTime.UtcNow.AddDays(-5), CreatedBy = "system", CreatedDateTime = DateTime.UtcNow },
            new ChurchMember { FirstName = "Eve", LastName = "Recent", ChurchMemberStatusId = 1, MemberSince = DateTime.UtcNow.AddDays(-20), CreatedBy = "system", CreatedDateTime = DateTime.UtcNow },
            new ChurchMember { FirstName = "Frank", LastName = "Old", ChurchMemberStatusId = 1, MemberSince = DateTime.UtcNow.AddDays(-60), CreatedBy = "system", CreatedDateTime = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        SetupEmptyTrainingAlerts();
        var useCase = CreateUseCase();

        // Act
        var result = await useCase.ExecuteAsync();

        // Assert
        result.NewMembersThisMonth.Should().Be(2); // Dave (5 days) + Eve (20 days)
        result.NewMembersThisWeek.Should().Be(1);  // Only Dave (within 7 days)
    }

    [Fact]
    public async Task ExecuteAsync_WithTrainingAlerts_ReturnsAlertsSummary()
    {
        // Arrange
        var alerts = new List<TrainingCertificateGroupSummaryDto>
        {
            new() { TrainingType = "Safeguarding", MemberCount = 10, ExpiryDate = DateTime.UtcNow.AddDays(30), Status = "Amber", Message = "Expiring soon" }
        };

        _mockTrainingService
            .Setup(s => s.GetDashboardTrainingSummaryAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(alerts);

        var useCase = CreateUseCase();

        // Act
        var result = await useCase.ExecuteAsync();

        // Assert
        result.TrainingAlerts.Should().HaveCount(1);
        result.TrainingAlerts.First().TrainingType.Should().Be("Safeguarding");
        result.TrainingAlerts.First().MemberCount.Should().Be(10);
    }

    [Fact]
    public async Task ExecuteAsync_WithAttendanceData_ReturnsSundayMorningAverage()
    {
        // Arrange
        _context.Events.Add(new Events { Id = 1, Name = "Sunday Morning", IsActive = true, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow });
        _context.EventAttendances.AddRange(
            new EventAttendance { EventId = 1, Date = DateTime.UtcNow.AddDays(-7), Attendance = 100, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow },
            new EventAttendance { EventId = 1, Date = DateTime.UtcNow.AddDays(-14), Attendance = 80, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        SetupEmptyTrainingAlerts();
        var useCase = CreateUseCase();

        // Act
        var result = await useCase.ExecuteAsync();

        // Assert
        result.SundayMorningAverage.Should().Be(90); // (100 + 80) / 2
    }

    [Fact]
    public async Task ExecuteAsync_WithNoAttendanceData_ReturnsZeroAverages()
    {
        // Arrange
        SetupEmptyTrainingAlerts();
        var useCase = CreateUseCase();

        // Act
        var result = await useCase.ExecuteAsync();

        // Assert
        result.SundayMorningAverage.Should().Be(0);
        result.SundayEveningAverage.Should().Be(0);
        result.BibleStudyAverage.Should().Be(0);
    }

    public void Dispose() => _context.Dispose();
}
