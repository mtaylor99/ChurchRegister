using ChurchRegister.ApiService.UseCase.TrainingCertificates.DeleteTrainingCertificate;
using ChurchRegister.Database.Data;
using ChurchRegister.Database.Entities;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;

namespace ChurchRegister.ApiService.Tests.TrainingCertificates;

/// <summary>
/// Integration tests for DeleteTrainingCertificateUseCase.
/// Tests deletion of training certificates with real database context.
/// </summary>
public class DeleteTrainingCertificateUseCaseTests : IDisposable
{
    private readonly ChurchRegisterWebContext _context;
    private readonly Mock<ILogger<DeleteTrainingCertificateUseCase>> _logger;

    public DeleteTrainingCertificateUseCaseTests()
    {
        var options = new DbContextOptionsBuilder<ChurchRegisterWebContext>()
            .UseInMemoryDatabase($"DeleteTrainingCertificateTests_{Guid.NewGuid()}")
            .Options;

        _context = new ChurchRegisterWebContext(options);
        _logger = new Mock<ILogger<DeleteTrainingCertificateUseCase>>();

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

        // Add a church member
        var member = new ChurchMember
        {
            FirstName = "John",
            LastName = "Doe",
            ChurchMemberStatusId = 1,
            CreatedBy = "system",
            CreatedDateTime = DateTime.UtcNow
        };
        _context.ChurchMembers.Add(member);

        // Add a training certificate type
        var certType = new TrainingCertificateTypes
        {
            Type = "Safeguarding",
            Status = "Active",
            Description = "Safeguarding Training",
            CreatedBy = "system",
            CreatedDateTime = DateTime.UtcNow
        };
        _context.TrainingCertificateTypes.Add(certType);

        _context.SaveChanges();

        // Add some training certificates
        _context.ChurchMemberTrainingCertificates.AddRange(
            new ChurchMemberTrainingCertificates
            {
                Id = 100,
                ChurchMemberId = member.Id,
                TrainingCertificateTypeId = certType.Id,
                Status = "In Validity",
                Expires = DateTime.UtcNow.AddYears(1),
                CreatedBy = "system",
                CreatedDateTime = DateTime.UtcNow
            },
            new ChurchMemberTrainingCertificates
            {
                Id = 101,
                ChurchMemberId = member.Id,
                TrainingCertificateTypeId = certType.Id,
                Status = "Expired",
                Expires = DateTime.UtcNow.AddDays(-30),
                CreatedBy = "system",
                CreatedDateTime = DateTime.UtcNow
            }
        );

        _context.SaveChanges();
    }

    public void Dispose()
    {
        _context.Dispose();
    }

    // ─── DeleteTrainingCertificateUseCase ────────────────────────────────────

    [Fact]
    public async Task DeleteTrainingCertificate_WithExistingId_RemovesCertificate()
    {
        // Arrange
        var useCase = new DeleteTrainingCertificateUseCase(_context, _logger.Object);
        var certificateId = 100;

        // Verify it exists before deletion
        var beforeDelete = await _context.ChurchMemberTrainingCertificates.FindAsync(certificateId);
        beforeDelete.Should().NotBeNull();

        // Act
        await useCase.ExecuteAsync(certificateId);

        // Assert
        var afterDelete = await _context.ChurchMemberTrainingCertificates.FindAsync(certificateId);
        afterDelete.Should().BeNull();
    }

    [Fact]
    public async Task DeleteTrainingCertificate_WithNonExistingId_ThrowsKeyNotFoundException()
    {
        // Arrange
        var useCase = new DeleteTrainingCertificateUseCase(_context, _logger.Object);
        var nonExistentId = 999;

        // Act & Assert
        await useCase.Invoking(u => u.ExecuteAsync(nonExistentId))
            .Should().ThrowAsync<KeyNotFoundException>()
            .WithMessage("*not found*");
    }

    [Fact]
    public async Task DeleteTrainingCertificate_RemovesOnlySpecifiedCertificate()
    {
        // Arrange
        var useCase = new DeleteTrainingCertificateUseCase(_context, _logger.Object);
        var certificateToDelete = 100;
        var certificateToKeep = 101;

        // Act
        await useCase.ExecuteAsync(certificateToDelete);

        // Assert
        var deleted = await _context.ChurchMemberTrainingCertificates.FindAsync(certificateToDelete);
        var kept = await _context.ChurchMemberTrainingCertificates.FindAsync(certificateToKeep);

        deleted.Should().BeNull();
        kept.Should().NotBeNull();
    }

    [Fact]
    public async Task DeleteTrainingCertificate_LogsInformation()
    {
        // Arrange
        var useCase = new DeleteTrainingCertificateUseCase(_context, _logger.Object);
        var certificateId = 101;

        // Act
        await useCase.ExecuteAsync(certificateId);

        // Assert - verify logging occurred
        _logger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Deleting training certificate")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);

        _logger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Deleted training certificate")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }
}
