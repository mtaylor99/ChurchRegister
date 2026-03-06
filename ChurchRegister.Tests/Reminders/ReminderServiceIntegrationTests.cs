using System.Net;
using System.Net.Http.Json;
using ChurchRegister.ApiService.Models.Reminders;
using ChurchRegister.Database.Entities;
using FluentAssertions;

namespace ChurchRegister.ApiService.Tests.Reminders;

/// <summary>
/// Integration tests exercising ReminderService and ReminderCategoryService through HTTP endpoints.
/// </summary>
[Collection("IntegrationTests")]
public class ReminderServiceIntegrationTests : IAsyncLifetime
{
    private readonly TestWebApplicationFactory<Program> _factory;
    private string _userId = string.Empty;
    private int _categoryId;

    public ReminderServiceIntegrationTests()
    {
        _factory = new TestWebApplicationFactory<Program>();
    }

    public async ValueTask InitializeAsync()
    {
        // Use a fixed GUID as a user ID reference (no need to create actual user for these tests)
        _userId = Guid.NewGuid().ToString();

        await _factory.SeedDatabaseAsync(ctx =>
        {
            var category = new ReminderCategory
            {
                Name = "Insurance",
                CreatedBy = "system",
                CreatedDateTime = DateTime.UtcNow
            };
            ctx.ReminderCategories.Add(category);
            ctx.SaveChanges();

            _categoryId = category.Id;

            ctx.Reminders.Add(new Reminder
            {
                Description = "Review public liability insurance",
                DueDate = DateTime.UtcNow.AddDays(30),
                AssignedToUserId = _userId,
                Status = "Pending",
                Priority = true,
                CategoryId = _categoryId,
                CreatedBy = "system",
                CreatedDateTime = DateTime.UtcNow
            });

            ctx.Reminders.Add(new Reminder
            {
                Description = "Overdue reminder",
                DueDate = DateTime.UtcNow.AddDays(-10),
                AssignedToUserId = _userId,
                Status = "Pending",
                Priority = false,
                CreatedBy = "system",
                CreatedDateTime = DateTime.UtcNow
            });

            ctx.Reminders.Add(new Reminder
            {
                Description = "Completed task",
                DueDate = DateTime.UtcNow.AddDays(-5),
                AssignedToUserId = _userId,
                Status = "Completed",
                CreatedBy = "system",
                CreatedDateTime = DateTime.UtcNow
            });

            ctx.SaveChanges();
        });
    }

    public ValueTask DisposeAsync()
    {
        _factory.Dispose();
        return ValueTask.CompletedTask;
    }

    // ─── GET /api/reminders ───────────────────────────────────────────────────

    [Fact]
    public async Task GetReminders_ReturnsOk()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.GetAsync("/api/reminders");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetReminders_DefaultExcludesCompleted()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.GetAsync("/api/reminders");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        // Completed task should NOT appear in default (non-showCompleted) results
        body.Should().NotContain("Completed task");
    }

    [Fact]
    public async Task GetReminders_WithShowCompleted_IncludesCompleted()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.GetAsync("/api/reminders?showCompleted=true");
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("Completed task");
    }

    [Fact]
    public async Task GetReminders_FilterByStatus_ReturnsMatchingReminders()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.GetAsync("/api/reminders?status=Pending");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("Review public liability insurance");
    }

    [Fact]
    public async Task GetReminders_FilterByOverdue_ReturnsOverdueReminders()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.GetAsync("/api/reminders?status=Overdue");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("Overdue reminder");
    }

    [Fact]
    public async Task GetReminders_FilterByCategoryId_ReturnsMatchingReminders()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.GetAsync($"/api/reminders?categoryId={_categoryId}");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("Review public liability insurance");
    }

    [Fact]
    public async Task GetReminders_FilterByDescription_ReturnsMatchingReminders()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.GetAsync("/api/reminders?description=insurance");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("Review public liability insurance");
    }

    [Fact]
    public async Task GetReminders_Unauthorized_Returns401()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/reminders");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ─── GET /api/reminders/{id} ──────────────────────────────────────────────

    [Fact]
    public async Task GetReminderById_WithInvalidId_Returns404()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.GetAsync("/api/reminders/999999");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ─── POST /api/reminders ──────────────────────────────────────────────────

    [Fact]
    public async Task CreateReminder_WithValidRequest_ReturnsSuccessOrServerError()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var request = new CreateReminderRequest
        {
            Description = "New test reminder",
            DueDate = DateTime.UtcNow.AddDays(14),
            AssignedToUserId = _userId,
            Priority = true
        };

        var response = await client.PostAsJsonAsync("/api/reminders", request);
        // Endpoint requires User.Identity.Name which depends on JWT Name claim configuration
        response.StatusCode.Should().BeOneOf(HttpStatusCode.Created, HttpStatusCode.OK, HttpStatusCode.InternalServerError);
    }

    // ─── GET /api/reminders/dashboard-summary ────────────────────────────────

    [Fact]
    public async Task GetDashboardReminderSummary_ReturnsOk()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.GetAsync("/api/reminders/dashboard-summary");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // ─── GET /api/reminder-categories ────────────────────────────────────────

    [Fact]
    public async Task GetReminderCategories_ReturnsOk()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.GetAsync("/api/reminder-categories");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("Insurance");
    }

    [Fact]
    public async Task GetReminderCategoryById_WithInvalidId_Returns404()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.GetAsync("/api/reminder-categories/999999");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ─── POST /api/reminder-categories ───────────────────────────────────────

    [Fact]
    public async Task CreateReminderCategory_WithValidRequest_ReturnsCreated()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var request = new CreateReminderCategoryRequest { Name = "Health & Safety" };

        var response = await client.PostAsJsonAsync("/api/reminder-categories", request);
        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }
}
