using ChurchRegister.ApiService.Models.Reminders;
using ChurchRegister.ApiService.Services.Reminders;
using ChurchRegister.ApiService.UseCase.Reminders.CreateReminder;
using ChurchRegister.ApiService.UseCase.Reminders.GetReminders;
using ChurchRegister.ApiService.UseCase.Reminders.GetReminderById;
using ChurchRegister.ApiService.UseCase.Reminders.UpdateReminder;
using ChurchRegister.ApiService.UseCase.Reminders.DeleteReminder;
using ChurchRegister.ApiService.UseCase.Reminders.CompleteReminder;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace ChurchRegister.ApiService.Tests.Reminders;

public class ReminderUseCaseTests
{
    private readonly Mock<IReminderService> _mockService;
    private readonly Mock<ILogger<CreateReminderUseCase>> _createLogger;
    private readonly Mock<ILogger<GetRemindersUseCase>> _getLogger;
    private readonly Mock<ILogger<GetReminderByIdUseCase>> _getByIdLogger;
    private readonly Mock<ILogger<UpdateReminderUseCase>> _updateLogger;
    private readonly Mock<ILogger<DeleteReminderUseCase>> _deleteLogger;
    private readonly Mock<ILogger<CompleteReminderUseCase>> _completeLogger;

    public ReminderUseCaseTests()
    {
        _mockService = new Mock<IReminderService>();
        _createLogger = new Mock<ILogger<CreateReminderUseCase>>();
        _getLogger = new Mock<ILogger<GetRemindersUseCase>>();
        _getByIdLogger = new Mock<ILogger<GetReminderByIdUseCase>>();
        _updateLogger = new Mock<ILogger<UpdateReminderUseCase>>();
        _deleteLogger = new Mock<ILogger<DeleteReminderUseCase>>();
        _completeLogger = new Mock<ILogger<CompleteReminderUseCase>>();
    }

    // ─── CreateReminderUseCase ───────────────────────────────────────────────

    [Fact]
    public async Task CreateReminder_WithValidRequest_ReturnsCreatedDto()
    {
        // Arrange
        var request = new CreateReminderRequest
        {
            Description = "Follow up on insurance",
            DueDate = DateTime.UtcNow.AddDays(7),
            AssignedToUserId = "user-123"
        };
        var expected = new ReminderDto { Id = 10, Description = "Follow up on insurance" };

        _mockService
            .Setup(s => s.CreateReminderAsync(request, "admin"))
            .ReturnsAsync(expected);

        var useCase = new CreateReminderUseCase(_mockService.Object, _createLogger.Object);

        // Act
        var result = await useCase.ExecuteAsync(request, "admin");

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(10);
        result.Description.Should().Be("Follow up on insurance");
        _mockService.Verify(s => s.CreateReminderAsync(request, "admin"), Times.Once);
    }

    [Fact]
    public async Task CreateReminder_WhenServiceThrows_PropagatesException()
    {
        // Arrange
        var request = new CreateReminderRequest { Description = "Test", DueDate = DateTime.UtcNow.AddDays(1) };
        _mockService
            .Setup(s => s.CreateReminderAsync(It.IsAny<CreateReminderRequest>(), It.IsAny<string>()))
            .ThrowsAsync(new InvalidOperationException("Service error"));

        var useCase = new CreateReminderUseCase(_mockService.Object, _createLogger.Object);

        // Act & Assert
        await useCase.Invoking(u => u.ExecuteAsync(request, "admin"))
            .Should().ThrowAsync<InvalidOperationException>();
    }

    // ─── GetRemindersUseCase ─────────────────────────────────────────────────

    [Fact]
    public async Task GetReminders_ReturnsAllActiveReminders()
    {
        // Arrange
        var query = new ReminderQueryParameters();
        var reminders = new List<ReminderDto>
        {
            new() { Id = 1, Description = "Contact member" },
            new() { Id = 2, Description = "Schedule visit" }
        };
        _mockService.Setup(s => s.GetRemindersAsync(query)).ReturnsAsync(reminders);

        var useCase = new GetRemindersUseCase(_mockService.Object, _getLogger.Object);

        // Act
        var result = await useCase.ExecuteAsync(query);

        // Assert
        result.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetReminders_WithNullQuery_PassesNullToService()
    {
        // Arrange
        _mockService
            .Setup(s => s.GetRemindersAsync(It.IsAny<ReminderQueryParameters>()))
            .ReturnsAsync(new List<ReminderDto>());

        var useCase = new GetRemindersUseCase(_mockService.Object, _getLogger.Object);

        // Act
        var result = await useCase.ExecuteAsync(new ReminderQueryParameters());

        // Assert
        result.Should().BeEmpty();
    }

    // ─── GetReminderByIdUseCase ──────────────────────────────────────────────

    [Fact]
    public async Task GetReminderById_WithValidId_ReturnsDto()
    {
        // Arrange
        var expected = new ReminderDto { Id = 5, Description = "Important task" };
        _mockService.Setup(s => s.GetReminderByIdAsync(5)).ReturnsAsync(expected);

        var useCase = new GetReminderByIdUseCase(_mockService.Object, _getByIdLogger.Object);

        // Act
        var result = await useCase.ExecuteAsync(5);

        // Assert
        result.Id.Should().Be(5);
        result.Description.Should().Be("Important task");
    }

    // ─── UpdateReminderUseCase ───────────────────────────────────────────────

    [Fact]
    public async Task UpdateReminder_WithValidRequest_ReturnsUpdatedDto()
    {
        // Arrange
        var request = new UpdateReminderRequest { Description = "Updated task", DueDate = DateTime.UtcNow.AddDays(14) };
        var expected = new ReminderDto { Id = 3, Description = "Updated task" };
        _mockService.Setup(s => s.UpdateReminderAsync(3, request, "editor")).ReturnsAsync(expected);

        var useCase = new UpdateReminderUseCase(_mockService.Object, _updateLogger.Object);

        // Act
        var result = await useCase.ExecuteAsync(3, request, "editor");

        // Assert
        result.Description.Should().Be("Updated task");
    }

    // ─── DeleteReminderUseCase ───────────────────────────────────────────────

    [Fact]
    public async Task DeleteReminder_WithValidId_CallsServiceOnce()
    {
        // Arrange
        _mockService.Setup(s => s.DeleteReminderAsync(7)).Returns(Task.CompletedTask);

        var useCase = new DeleteReminderUseCase(_mockService.Object, _deleteLogger.Object);

        // Act
        await useCase.ExecuteAsync(7);

        // Assert
        _mockService.Verify(s => s.DeleteReminderAsync(7), Times.Once);
    }

    // ─── CompleteReminderUseCase ─────────────────────────────────────────────

    [Fact]
    public async Task CompleteReminder_WithValidRequest_ReturnsCompletionResponse()
    {
        // Arrange
        var request = new CompleteReminderRequest { CompletionNotes = "All done" };
        var completed = new ReminderDto { Id = 8, Status = "Completed" };
        var expected = new CompleteReminderResponse { Completed = completed };
        _mockService.Setup(s => s.CompleteReminderAsync(8, request, "user")).ReturnsAsync(expected);

        var useCase = new CompleteReminderUseCase(_mockService.Object, _completeLogger.Object);

        // Act
        var result = await useCase.ExecuteAsync(8, request, "user");

        // Assert
        result.Completed.Should().NotBeNull();
        result.Completed.Id.Should().Be(8);
        result.Completed.Status.Should().Be("Completed");
        _mockService.Verify(s => s.CompleteReminderAsync(8, request, "user"), Times.Once);
    }
}
