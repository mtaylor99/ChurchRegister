using ChurchRegister.ApiService.Models.Attendance;
using ChurchRegister.ApiService.Services.Security;
using ChurchRegister.ApiService.UseCase.Attendance.CreateAttendance;
using ChurchRegister.ApiService.UseCase.Attendance.CreateEvent;
using ChurchRegister.ApiService.UseCase.Attendance.DeleteAttendance;
using ChurchRegister.ApiService.UseCase.Attendance.GetAttendance;
using ChurchRegister.ApiService.UseCase.Attendance.GetAttendanceAnalytics;
using ChurchRegister.ApiService.UseCase.Attendance.GetEvents;
using ChurchRegister.ApiService.UseCase.Attendance.UpdateAttendance;
using ChurchRegister.ApiService.UseCase.Attendance.UpdateEvent;
using ChurchRegister.Database.Data;
using ChurchRegister.Database.Entities;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;

namespace ChurchRegister.ApiService.Tests.Attendance;

public class AttendanceUseCaseTests : IDisposable
{
    private readonly ChurchRegisterWebContext _context;
    private readonly Mock<ILogger<CreateAttendanceUseCase>> _createAttLogger;
    private readonly Mock<ILogger<UpdateAttendanceUseCase>> _updateAttLogger;
    private readonly Mock<ILogger<DeleteAttendanceUseCase>> _deleteAttLogger;
    private readonly Mock<ILogger<GetAttendanceUseCase>> _getAttLogger;
    private readonly Mock<ILogger<GetEventsUseCase>> _getEventsLogger;
    private readonly Mock<ILogger<CreateEventUseCase>> _createEventLogger;
    private readonly Mock<ILogger<UpdateEventUseCase>> _updateEventLogger;
    private readonly Mock<ILogger<GetAttendanceAnalyticsUseCase>> _analyticsLogger;

    public AttendanceUseCaseTests()
    {
        var options = new DbContextOptionsBuilder<ChurchRegisterWebContext>()
            .UseInMemoryDatabase($"AttendanceTests_{Guid.NewGuid()}")
            .Options;

        _context = new ChurchRegisterWebContext(options);
        _createAttLogger = new Mock<ILogger<CreateAttendanceUseCase>>();
        _updateAttLogger = new Mock<ILogger<UpdateAttendanceUseCase>>();
        _deleteAttLogger = new Mock<ILogger<DeleteAttendanceUseCase>>();
        _getAttLogger = new Mock<ILogger<GetAttendanceUseCase>>();
        _getEventsLogger = new Mock<ILogger<GetEventsUseCase>>();
        _createEventLogger = new Mock<ILogger<CreateEventUseCase>>();
        _updateEventLogger = new Mock<ILogger<UpdateEventUseCase>>();
        _analyticsLogger = new Mock<ILogger<GetAttendanceAnalyticsUseCase>>();

        SeedBaseData();
    }

    private void SeedBaseData()
    {
        _context.Events.AddRange(
            new Events { Id = 1, Name = "Sunday Morning", IsActive = true, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow },
            new Events { Id = 2, Name = "Sunday Evening", IsActive = true, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow },
            new Events { Id = 3, Name = "Old Event", IsActive = false, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow }
        );
        _context.SaveChanges();
    }

    // ─── GetEventsUseCase ─────────────────────────────────────────────────────

    [Fact]
    public async Task GetEvents_ReturnsAllEvents()
    {
        // Arrange
        var useCase = new GetEventsUseCase(_context, _getEventsLogger.Object);

        // Act
        var result = await useCase.ExecuteAsync();

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(3); // All 3 seeded events (active + inactive)
    }

    // ─── CreateEventUseCase ───────────────────────────────────────────────────

    [Fact]
    public async Task CreateEvent_WithValidRequest_CreatesAndReturnsId()
    {
        // Arrange
        var request = new CreateEventRequest { Name = "Bible Study", IsActive = true, ShowInAnalysis = true };
        var useCase = new CreateEventUseCase(_context, _createEventLogger.Object);

        // Act
        var resultId = await useCase.ExecuteAsync(request, "admin");

        // Assert
        resultId.Should().BeGreaterThan(0);

        var saved = await _context.Events.FindAsync(resultId);
        saved.Should().NotBeNull();
        saved!.Name.Should().Be("Bible Study");
        saved.CreatedBy.Should().Be("admin");
    }

    // ─── UpdateEventUseCase ───────────────────────────────────────────────────

    [Fact]
    public async Task UpdateEvent_WithExistingEvent_UpdatesFields()
    {
        // Arrange
        var request = new UpdateEventRequest { Id = 1, Name = "Sunday Morning Updated", IsActive = true, ShowInAnalysis = true };
        var useCase = new UpdateEventUseCase(_context, _updateEventLogger.Object);

        // Act
        await useCase.ExecuteAsync(request, "editor");

        // Assert
        var updated = await _context.Events.FindAsync(1);
        updated!.Name.Should().Be("Sunday Morning Updated");
        updated.ModifiedBy.Should().Be("editor");
    }

    [Fact]
    public async Task UpdateEvent_WithNonExistingId_ThrowsKeyNotFoundException()
    {
        // Arrange
        var request = new UpdateEventRequest { Id = 999, Name = "Not Found", IsActive = true, ShowInAnalysis = true };
        var useCase = new UpdateEventUseCase(_context, _updateEventLogger.Object);

        // Act & Assert
        await useCase.Invoking(u => u.ExecuteAsync(request, "editor"))
            .Should().ThrowAsync<KeyNotFoundException>();
    }

    // ─── CreateAttendanceUseCase ──────────────────────────────────────────────

    [Fact]
    public async Task CreateAttendance_WithValidRequest_CreatesRecord()
    {
        // Arrange
        var request = new CreateAttendanceRequest { EventId = 1, Date = DateTime.UtcNow.Date.AddDays(-1), Attendance = 120 };
        var useCase = new CreateAttendanceUseCase(_context, _createAttLogger.Object);

        // Act
        await useCase.ExecuteAsync(request, "recorder");

        // Assert
        var record = await _context.EventAttendances.FirstOrDefaultAsync(a => a.EventId == 1);
        record.Should().NotBeNull();
        record!.Attendance.Should().Be(120);
        record.CreatedBy.Should().Be("recorder");
    }

    [Fact]
    public async Task CreateAttendance_ForInactiveEvent_ThrowsInvalidOperationException()
    {
        // Arrange
        var request = new CreateAttendanceRequest { EventId = 3, Date = DateTime.UtcNow.AddDays(-1), Attendance = 50 };
        var useCase = new CreateAttendanceUseCase(_context, _createAttLogger.Object);

        // Act & Assert
        await useCase.Invoking(u => u.ExecuteAsync(request, "recorder"))
            .Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task CreateAttendance_DuplicateEventAndDate_ThrowsValidationException()
    {
        // Arrange
        var targetDate = DateTime.UtcNow.Date.AddDays(-2);
        _context.EventAttendances.Add(new EventAttendance
        {
            EventId = 1,
            Date = targetDate,
            Attendance = 100,
            CreatedBy = "system",
            CreatedDateTime = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        var request = new CreateAttendanceRequest { EventId = 1, Date = targetDate, Attendance = 110 };
        var useCase = new CreateAttendanceUseCase(_context, _createAttLogger.Object);

        // Act & Assert
        await useCase.Invoking(u => u.ExecuteAsync(request, "recorder"))
            .Should().ThrowAsync<Exception>(); // ValidationException
    }

    [Fact]
    public async Task CreateAttendance_ForNonExistingEvent_ThrowsArgumentException()
    {
        // Arrange
        var request = new CreateAttendanceRequest { EventId = 999, Date = DateTime.UtcNow.AddDays(-1), Attendance = 50 };
        var useCase = new CreateAttendanceUseCase(_context, _createAttLogger.Object);

        // Act & Assert
        await useCase.Invoking(u => u.ExecuteAsync(request, "recorder"))
            .Should().ThrowAsync<ArgumentException>();
    }

    // ─── UpdateAttendanceUseCase ──────────────────────────────────────────────

    [Fact]
    public async Task UpdateAttendance_WithExistingRecord_UpdatesFields()
    {
        // Arrange
        var attendance = new EventAttendance
        {
            Id = 10,
            EventId = 1,
            Date = DateTime.UtcNow.AddDays(-5),
            Attendance = 80,
            CreatedBy = "system",
            CreatedDateTime = DateTime.UtcNow
        };
        _context.EventAttendances.Add(attendance);
        await _context.SaveChangesAsync();

        var request = new UpdateAttendanceRequest { Id = 10, EventId = 1, Date = DateTime.UtcNow.AddDays(-5), Attendance = 95 };
        var useCase = new UpdateAttendanceUseCase(_context, _updateAttLogger.Object);

        // Act
        await useCase.ExecuteAsync(request, "editor");

        // Assert
        var updated = await _context.EventAttendances.FindAsync(10);
        updated!.Attendance.Should().Be(95);
        updated.ModifiedBy.Should().Be("editor");
    }

    [Fact]
    public async Task UpdateAttendance_WithNonExistingId_ThrowsKeyNotFoundException()
    {
        // Arrange
        var request = new UpdateAttendanceRequest { Id = 999, EventId = 1, Date = DateTime.UtcNow, Attendance = 50 };
        var useCase = new UpdateAttendanceUseCase(_context, _updateAttLogger.Object);

        // Act & Assert
        await useCase.Invoking(u => u.ExecuteAsync(request, "editor"))
            .Should().ThrowAsync<KeyNotFoundException>();
    }

    // ─── DeleteAttendanceUseCase ──────────────────────────────────────────────

    [Fact]
    public async Task DeleteAttendance_WithExistingRecord_RemovesRecord()
    {
        // Arrange
        var attendance = new EventAttendance
        {
            Id = 20,
            EventId = 1,
            Date = DateTime.UtcNow.AddDays(-3),
            Attendance = 60,
            CreatedBy = "system",
            CreatedDateTime = DateTime.UtcNow
        };
        _context.EventAttendances.Add(attendance);
        await _context.SaveChangesAsync();

        var useCase = new DeleteAttendanceUseCase(_context, _deleteAttLogger.Object);

        // Act
        await useCase.ExecuteAsync(20);

        // Assert
        var deleted = await _context.EventAttendances.FindAsync(20);
        deleted.Should().BeNull();
    }

    [Fact]
    public async Task DeleteAttendance_WithNonExistingId_ThrowsKeyNotFoundException()
    {
        // Arrange
        var useCase = new DeleteAttendanceUseCase(_context, _deleteAttLogger.Object);

        // Act & Assert
        await useCase.Invoking(u => u.ExecuteAsync(999))
            .Should().ThrowAsync<KeyNotFoundException>();
    }

    // ─── GetAttendanceUseCase ─────────────────────────────────────────────────

    [Fact]
    public async Task GetAttendance_WithNoRecords_ReturnsEmptyList()
    {
        // Arrange
        var useCase = new GetAttendanceUseCase(_context, _getAttLogger.Object);

        // Act
        var result = await useCase.ExecuteAsync();

        // Assert
        result.Should().NotBeNull();
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetAttendance_WithRecords_ReturnsAllRecordsOrdered()
    {
        // Arrange
        _context.EventAttendances.AddRange(
            new EventAttendance { EventId = 1, Date = DateTime.UtcNow.AddDays(-7), Attendance = 90, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow },
            new EventAttendance { EventId = 2, Date = DateTime.UtcNow.AddDays(-1), Attendance = 60, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        var useCase = new GetAttendanceUseCase(_context, _getAttLogger.Object);

        // Act
        var result = await useCase.ExecuteAsync();

        // Assert
        result.Should().HaveCount(2);
        result.First().Date.Should().BeAfter(result.Last().Date); // Ordered descending by date
    }

    // ─── GetAttendanceAnalyticsUseCase ────────────────────────────────────────

    [Fact]
    public async Task GetAttendanceAnalytics_WithNonExistingEvent_ThrowsKeyNotFoundException()
    {
        // Arrange
        var request = new GetAttendanceAnalyticsRequest { EventId = 999 };
        var useCase = new GetAttendanceAnalyticsUseCase(_context, _analyticsLogger.Object);

        // Act & Assert
        await useCase.Invoking(u => u.ExecuteAsync(request))
            .Should().ThrowAsync<KeyNotFoundException>();
    }

    [Fact]
    public async Task GetAttendanceAnalytics_WithInactiveEvent_ThrowsKeyNotFoundException()
    {
        // Arrange
        var request = new GetAttendanceAnalyticsRequest { EventId = 3 }; // Event 3 is inactive
        var useCase = new GetAttendanceAnalyticsUseCase(_context, _analyticsLogger.Object);

        // Act & Assert
        await useCase.Invoking(u => u.ExecuteAsync(request))
            .Should().ThrowAsync<KeyNotFoundException>();
    }

    [Fact]
    public async Task GetAttendanceAnalytics_WithActiveEventAndNoData_ReturnsEmptyDataPoints()
    {
        // Arrange
        var request = new GetAttendanceAnalyticsRequest { EventId = 1 };
        var useCase = new GetAttendanceAnalyticsUseCase(_context, _analyticsLogger.Object);

        // Act
        var result = await useCase.ExecuteAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.EventId.Should().Be(1);
        result.EventName.Should().Be("Sunday Morning");
        result.DataPoints.Should().BeEmpty();
    }

    public void Dispose() => _context.Dispose();
}
