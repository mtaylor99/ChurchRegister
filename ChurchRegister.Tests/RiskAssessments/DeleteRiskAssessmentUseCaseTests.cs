using ChurchRegister.ApiService.UseCase.RiskAssessments.DeleteRiskAssessment;
using ChurchRegister.Database.Data;
using ChurchRegister.Database.Entities;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;

namespace ChurchRegister.ApiService.Tests.RiskAssessments;

/// <summary>
/// Integration tests for DeleteRiskAssessmentUseCase.
/// Tests deletion of risk assessments with approvals and real database context.
/// </summary>
public class DeleteRiskAssessmentUseCaseTests : IDisposable
{
    private readonly ChurchRegisterWebContext _context;
    private readonly Mock<ILogger<DeleteRiskAssessmentUseCase>> _logger;
    private int _categoryId;
    private int _deaconId;

    public DeleteRiskAssessmentUseCaseTests()
    {
        var options = new DbContextOptionsBuilder<ChurchRegisterWebContext>()
            .UseInMemoryDatabase($"DeleteRiskAssessmentTests_{Guid.NewGuid()}")
            .Options;

        _context = new ChurchRegisterWebContext(options);
        _logger = new Mock<ILogger<DeleteRiskAssessmentUseCase>>();

        SeedBaseData();
    }

    private void SeedBaseData()
    {
        // Add required reference data
        _context.ChurchMemberStatuses.Add(new ChurchMemberStatus
        {
            Id = 1,
            Name = "Active",
            CreatedBy = "system",
            CreatedDateTime = DateTime.UtcNow
        });

        _context.SaveChanges();

        // Add a deacon for approvals
        var deacon = new ChurchMember
        {
            FirstName = "Deacon",
            LastName = "Smith",
            ChurchMemberStatusId = 1,
            CreatedBy = "system",
            CreatedDateTime = DateTime.UtcNow
        };
        _context.ChurchMembers.Add(deacon);
        _context.SaveChanges();
        _deaconId = deacon.Id;

        // Add a risk assessment category
        var category = new RiskAssessmentCategory
        {
            Name = "Fire Safety",
            Description = "Fire safety assessments",
            CreatedBy = "system",
            CreatedDateTime = DateTime.UtcNow
        };
        _context.RiskAssessmentCategories.Add(category);
        _context.SaveChanges();
        _categoryId = category.Id;

        // Add risk assessments
        var assessment1 = new RiskAssessment
        {
            Id = 200,
            Title = "Assessment Without Approvals",
            Description = "Test assessment",
            CategoryId = _categoryId,
            Status = "Under Review",
            ReviewInterval = 12,
            NextReviewDate = DateTime.UtcNow.AddMonths(12),
            CreatedBy = "system",
            CreatedDateTime = DateTime.UtcNow
        };

        var assessment2 = new RiskAssessment
        {
            Id = 201,
            Title = "Assessment With Approvals",
            Description = "Test assessment with approvals",
            CategoryId = _categoryId,
            Status = "Approved",
            ReviewInterval = 12,
            NextReviewDate = DateTime.UtcNow.AddMonths(12),
            CreatedBy = "system",
            CreatedDateTime = DateTime.UtcNow
        };

        _context.RiskAssessments.AddRange(assessment1, assessment2);
        _context.SaveChanges();

        // Add approvals to the second assessment
        _context.RiskAssessmentApprovals.AddRange(
            new RiskAssessmentApproval
            {
                RiskAssessmentId = 201,
                ApprovedByChurchMemberId = _deaconId,
                ApprovedDate = DateTime.UtcNow,
                Notes = "Approved"
            },
            new RiskAssessmentApproval
            {
                RiskAssessmentId = 201,
                ApprovedByChurchMemberId = _deaconId,
                ApprovedDate = DateTime.UtcNow.AddDays(1),
                Notes = "Second approval"
            }
        );

        _context.SaveChanges();
    }

    public void Dispose()
    {
        _context.Dispose();
    }

    // ─── DeleteRiskAssessmentUseCase ─────────────────────────────────────────

    [Fact]
    public async Task DeleteRiskAssessment_WithExistingId_RemovesAssessment()
    {
        // Arrange
        var useCase = new DeleteRiskAssessmentUseCase(_context, _logger.Object);
        var assessmentId = 200;

        // Verify it exists before deletion
        var beforeDelete = await _context.RiskAssessments.FindAsync(assessmentId);
        beforeDelete.Should().NotBeNull();

        // Act
        await useCase.ExecuteAsync(assessmentId);

        // Assert
        var afterDelete = await _context.RiskAssessments.FindAsync(assessmentId);
        afterDelete.Should().BeNull();
    }

    [Fact]
    public async Task DeleteRiskAssessment_WithNonExistingId_ThrowsKeyNotFoundException()
    {
        // Arrange
        var useCase = new DeleteRiskAssessmentUseCase(_context, _logger.Object);
        var nonExistentId = 999;

        // Act & Assert
        await useCase.Invoking(u => u.ExecuteAsync(nonExistentId))
            .Should().ThrowAsync<KeyNotFoundException>()
            .WithMessage("*not found*");
    }

    [Fact]
    public async Task DeleteRiskAssessment_WithApprovals_RemovesBothAssessmentAndApprovals()
    {
        // Arrange
        var useCase = new DeleteRiskAssessmentUseCase(_context, _logger.Object);
        var assessmentId = 201;

        // Verify assessment and approvals exist
        var approvalsBefore = await _context.RiskAssessmentApprovals
            .Where(a => a.RiskAssessmentId == assessmentId)
            .ToListAsync();
        approvalsBefore.Should().HaveCount(2);

        // Act
        await useCase.ExecuteAsync(assessmentId);

        // Assert
        var afterDelete = await _context.RiskAssessments.FindAsync(assessmentId);
        afterDelete.Should().BeNull();

        var approvalsAfter = await _context.RiskAssessmentApprovals
            .Where(a => a.RiskAssessmentId == assessmentId)
            .ToListAsync();
        approvalsAfter.Should().BeEmpty();
    }

    [Fact]
    public async Task DeleteRiskAssessment_RemovesOnlySpecifiedAssessment()
    {
        // Arrange
        var useCase = new DeleteRiskAssessmentUseCase(_context, _logger.Object);
        var assessmentToDelete = 200;
        var assessmentToKeep = 201;

        // Act
        await useCase.ExecuteAsync(assessmentToDelete);

        // Assert
        var deleted = await _context.RiskAssessments.FindAsync(assessmentToDelete);
        var kept = await _context.RiskAssessments.FindAsync(assessmentToKeep);

        deleted.Should().BeNull();
        kept.Should().NotBeNull();
    }

    [Fact]
    public async Task DeleteRiskAssessment_LogsInformation()
    {
        // Arrange
        var useCase = new DeleteRiskAssessmentUseCase(_context, _logger.Object);
        var assessmentId = 200;

        // Act
        await useCase.ExecuteAsync(assessmentId);

        // Assert - verify logging occurred
        _logger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Deleting risk assessment")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);

        _logger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Deleted risk assessment")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task DeleteRiskAssessment_DoesNotAffectOtherAssessmentsApprovals()
    {
        // Arrange
        var useCase = new DeleteRiskAssessmentUseCase(_context, _logger.Object);
        var assessmentToDelete = 200; // No approvals
        var assessmentWithApprovals = 201;

        // Count approvals before
        var approvalsBefore = await _context.RiskAssessmentApprovals
            .Where(a => a.RiskAssessmentId == assessmentWithApprovals)
            .CountAsync();

        // Act
        await useCase.ExecuteAsync(assessmentToDelete);

        // Assert - other assessment's approvals unchanged
        var approvalsAfter = await _context.RiskAssessmentApprovals
            .Where(a => a.RiskAssessmentId == assessmentWithApprovals)
            .CountAsync();

        approvalsAfter.Should().Be(approvalsBefore);
        approvalsAfter.Should().Be(2);
    }
}
