using ChurchRegister.ApiService.Models;
using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.ApiService.Models.Districts;
using ChurchRegister.ApiService.Services.ChurchMembers;
using ChurchRegister.ApiService.UseCase.ChurchMembers.AssignDistrict;
using ChurchRegister.ApiService.UseCase.ChurchMembers.CreateChurchMember;
using ChurchRegister.ApiService.UseCase.ChurchMembers.DeleteChurchMember;
using ChurchRegister.ApiService.UseCase.ChurchMembers.GetChurchMemberById;
using ChurchRegister.ApiService.UseCase.ChurchMembers.GetChurchMemberRoles;
using ChurchRegister.ApiService.UseCase.ChurchMembers.GetChurchMembers;
using ChurchRegister.ApiService.UseCase.ChurchMembers.GetChurchMemberStatuses;
using ChurchRegister.ApiService.UseCase.ChurchMembers.UpdateChurchMember;
using ChurchRegister.ApiService.UseCase.ChurchMembers.UpdateChurchMemberStatus;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace ChurchRegister.ApiService.Tests.ChurchMembers;

public class ChurchMemberUseCaseTests
{
    private readonly Mock<IChurchMemberService> _mockService;
    private readonly Mock<ILogger<CreateChurchMemberUseCase>> _createLogger;
    private readonly Mock<ILogger<GetChurchMembersUseCase>> _getListLogger;
    private readonly Mock<ILogger<GetChurchMemberByIdUseCase>> _getByIdLogger;
    private readonly Mock<ILogger<UpdateChurchMemberUseCase>> _updateLogger;
    private readonly Mock<ILogger<UpdateChurchMemberStatusUseCase>> _updateStatusLogger;
    private readonly Mock<ILogger<DeleteChurchMemberUseCase>> _deleteLogger;
    private readonly Mock<ILogger<GetChurchMemberRolesUseCase>> _getRolesLogger;
    private readonly Mock<ILogger<GetChurchMemberStatusesUseCase>> _getStatusesLogger;
    private readonly Mock<ILogger<AssignDistrictUseCase>> _assignDistrictLogger;

    public ChurchMemberUseCaseTests()
    {
        _mockService = new Mock<IChurchMemberService>();
        _createLogger = new Mock<ILogger<CreateChurchMemberUseCase>>();
        _getListLogger = new Mock<ILogger<GetChurchMembersUseCase>>();
        _getByIdLogger = new Mock<ILogger<GetChurchMemberByIdUseCase>>();
        _updateLogger = new Mock<ILogger<UpdateChurchMemberUseCase>>();
        _updateStatusLogger = new Mock<ILogger<UpdateChurchMemberStatusUseCase>>();
        _deleteLogger = new Mock<ILogger<DeleteChurchMemberUseCase>>();
        _getRolesLogger = new Mock<ILogger<GetChurchMemberRolesUseCase>>();
        _getStatusesLogger = new Mock<ILogger<GetChurchMemberStatusesUseCase>>();
        _assignDistrictLogger = new Mock<ILogger<AssignDistrictUseCase>>();
    }

    // ─── CreateChurchMemberUseCase ────────────────────────────────────────────

    [Fact]
    public async Task CreateChurchMember_WithValidRequest_ReturnsCreatedResponse()
    {
        // Arrange
        var request = new CreateChurchMemberRequest { FirstName = "John", LastName = "Doe", StatusId = 1 };
        var expected = new CreateChurchMemberResponse { Id = 1, Message = "Member created successfully" };

        _mockService
            .Setup(s => s.CreateChurchMemberAsync(request, "admin", It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        var useCase = new CreateChurchMemberUseCase(_mockService.Object, _createLogger.Object);

        // Act
        var result = await useCase.ExecuteAsync(request, "admin");

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(1);
        _mockService.Verify(s => s.CreateChurchMemberAsync(request, "admin", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateChurchMember_WithNullFirstName_ThrowsInvalidOperationException()
    {
        // Arrange
        var request = new CreateChurchMemberRequest { FirstName = string.Empty, LastName = "Doe" };
        _mockService
            .Setup(s => s.CreateChurchMemberAsync(It.IsAny<CreateChurchMemberRequest>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("First name is required"));

        var useCase = new CreateChurchMemberUseCase(_mockService.Object, _createLogger.Object);

        // Act & Assert
        await useCase.Invoking(u => u.ExecuteAsync(request, "admin"))
            .Should().ThrowAsync<ArgumentException>();
    }

    // ─── GetChurchMembersUseCase ──────────────────────────────────────────────

    [Fact]
    public async Task GetChurchMembers_WithDefaultQuery_ReturnsPagedResult()
    {
        // Arrange
        var query = new ChurchMemberGridQuery { Page = 1, PageSize = 10 };
        var expected = new PagedResult<ChurchMemberDto>
        {
            Items = new List<ChurchMemberDto> { new() { Id = 1, FirstName = "Alice" }, new() { Id = 2, FirstName = "Bob" } },
            TotalCount = 2
        };

        _mockService
            .Setup(s => s.GetChurchMembersAsync(query, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        var useCase = new GetChurchMembersUseCase(_mockService.Object, _getListLogger.Object);

        // Act
        var result = await useCase.ExecuteAsync(query);

        // Assert
        result.TotalCount.Should().Be(2);
        result.Items.Should().HaveCount(2);
    }

    // ─── GetChurchMemberByIdUseCase ───────────────────────────────────────────

    [Fact]
    public async Task GetChurchMemberById_WithExistingId_ReturnsMemberDetail()
    {
        // Arrange
        var expected = new ChurchMemberDetailDto { Id = 1, FirstName = "Alice", LastName = "Smith" };
        _mockService
            .Setup(s => s.GetChurchMemberByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        var useCase = new GetChurchMemberByIdUseCase(_mockService.Object, _getByIdLogger.Object);

        // Act
        var result = await useCase.ExecuteAsync(1);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(1);
        result.FirstName.Should().Be("Alice");
    }

    [Fact]
    public async Task GetChurchMemberById_WithNonExistingId_ReturnsNull()
    {
        // Arrange
        _mockService
            .Setup(s => s.GetChurchMemberByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ChurchMemberDetailDto?)null);

        var useCase = new GetChurchMemberByIdUseCase(_mockService.Object, _getByIdLogger.Object);

        // Act
        var result = await useCase.ExecuteAsync(999);

        // Assert
        result.Should().BeNull();
    }

    // ─── UpdateChurchMemberUseCase ────────────────────────────────────────────

    [Fact]
    public async Task UpdateChurchMember_WithValidRequest_ReturnsUpdatedDetail()
    {
        // Arrange
        var request = new UpdateChurchMemberRequest { Id = 1, FirstName = "Alice Updated", LastName = "Smith" };
        var expected = new ChurchMemberDetailDto { Id = 1, FirstName = "Alice Updated", LastName = "Smith" };

        _mockService
            .Setup(s => s.UpdateChurchMemberAsync(request, "editor", It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        var useCase = new UpdateChurchMemberUseCase(_mockService.Object, _updateLogger.Object);

        // Act
        var result = await useCase.ExecuteAsync(request, "editor");

        // Assert
        result.FirstName.Should().Be("Alice Updated");
        _mockService.Verify(s => s.UpdateChurchMemberAsync(request, "editor", It.IsAny<CancellationToken>()), Times.Once);
    }

    // ─── UpdateChurchMemberStatusUseCase ─────────────────────────────────────

    [Fact]
    public async Task UpdateChurchMemberStatus_WithValidRequest_ReturnsUpdatedDetail()
    {
        // Arrange
        var request = new UpdateChurchMemberStatusRequest { StatusId = 2 };
        var expected = new ChurchMemberDetailDto { Id = 1, FirstName = "Alice" };

        _mockService
            .Setup(s => s.UpdateChurchMemberStatusAsync(1, request, "admin", It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        var useCase = new UpdateChurchMemberStatusUseCase(_mockService.Object, _updateStatusLogger.Object);

        // Act
        var result = await useCase.ExecuteAsync(1, request, "admin");

        // Assert
        result.Should().NotBeNull();
        _mockService.Verify(s => s.UpdateChurchMemberStatusAsync(1, request, "admin", It.IsAny<CancellationToken>()), Times.Once);
    }

    // ─── DeleteChurchMemberUseCase ────────────────────────────────────────────

    [Fact]
    public async Task DeleteChurchMember_WithValidId_CallsService()
    {
        // Arrange
        _mockService
            .Setup(s => s.DeleteChurchMemberAsync(1, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var useCase = new DeleteChurchMemberUseCase(_mockService.Object, _deleteLogger.Object);

        // Act
        await useCase.ExecuteAsync(1);

        // Assert
        _mockService.Verify(s => s.DeleteChurchMemberAsync(1, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteChurchMember_WithInvalidId_ThrowsArgumentException()
    {
        // Arrange
        var useCase = new DeleteChurchMemberUseCase(_mockService.Object, _deleteLogger.Object);

        // Act & Assert
        await useCase.Invoking(u => u.ExecuteAsync(0))
            .Should().ThrowAsync<ArgumentException>();
    }

    // ─── GetChurchMemberRolesUseCase ──────────────────────────────────────────

    [Fact]
    public async Task GetChurchMemberRoles_ReturnsAllRoles()
    {
        // Arrange
        var roles = new List<ChurchMemberRoleDto>
        {
            new() { Id = 1, Type = "Elder" },
            new() { Id = 2, Type = "Deacon" }
        };

        _mockService
            .Setup(s => s.GetRolesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(roles);

        var useCase = new GetChurchMemberRolesUseCase(_mockService.Object, _getRolesLogger.Object);

        // Act
        var result = await useCase.ExecuteAsync();

        // Assert
        result.Should().HaveCount(2);
        result.First().Type.Should().Be("Elder");
    }

    // ─── GetChurchMemberStatusesUseCase ──────────────────────────────────────

    [Fact]
    public async Task GetChurchMemberStatuses_ReturnsAllStatuses()
    {
        // Arrange
        var statuses = new List<ChurchMemberStatusDto>
        {
            new() { Id = 1, Name = "Active" },
            new() { Id = 2, Name = "Inactive" }
        };

        _mockService
            .Setup(s => s.GetStatusesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(statuses);

        var useCase = new GetChurchMemberStatusesUseCase(_mockService.Object, _getStatusesLogger.Object);

        // Act
        var result = await useCase.ExecuteAsync();

        // Assert
        result.Should().HaveCount(2);
    }

    // ─── AssignDistrictUseCase ────────────────────────────────────────────────

    [Fact]
    public async Task AssignDistrict_WithValidRequest_ReturnsUpdatedMemberDetail()
    {
        // Arrange
        var request = new AssignDistrictRequest { DistrictId = 3 };
        var expected = new ChurchMemberDetailDto { Id = 1, FirstName = "Alice", LastName = "Smith" };

        _mockService
            .Setup(s => s.AssignDistrictAsync(1, request, "admin", It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        var useCase = new AssignDistrictUseCase(_mockService.Object, _assignDistrictLogger.Object);

        // Act
        var result = await useCase.ExecuteAsync(1, request, "admin");

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(1);
        _mockService.Verify(s => s.AssignDistrictAsync(1, request, "admin", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task AssignDistrict_WhenMemberNotFound_ThrowsKeyNotFoundException()
    {
        // Arrange
        var request = new AssignDistrictRequest { DistrictId = 3 };
        _mockService
            .Setup(s => s.AssignDistrictAsync(999, request, "admin", It.IsAny<CancellationToken>()))
            .ThrowsAsync(new KeyNotFoundException("Member not found"));

        var useCase = new AssignDistrictUseCase(_mockService.Object, _assignDistrictLogger.Object);

        // Act & Assert
        await useCase.Invoking(u => u.ExecuteAsync(999, request, "admin"))
            .Should().ThrowAsync<KeyNotFoundException>();
    }
}
