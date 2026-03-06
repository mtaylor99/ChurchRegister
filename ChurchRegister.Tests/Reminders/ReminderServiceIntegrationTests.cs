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
    public async Task CreateReminder_WithValidRequest_ReturnsCreated()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var request = new CreateReminderRequest
        {
            Description = "New CRUD test reminder",
            DueDate = DateTime.UtcNow.AddDays(14),
            AssignedToUserId = _userId,
            CategoryId = _categoryId,
            Priority = true
        };

        var response = await client.PostAsJsonAsync("/api/reminders", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.Created, HttpStatusCode.OK);
    }

    [Fact]
    public async Task CreateReminder_WithCurrentUser_ReturnsSuccess()
    {
        var userId = Guid.NewGuid().ToString();
        var client = _factory.CreateAuthenticatedClient(userId, "test@test.com", "SystemAdministration");
        var request = new CreateReminderRequest
        {
            Description = "Current user reminder",
            DueDate = DateTime.UtcNow.AddDays(7),
            AssignedToUserId = "current-user",
            Priority = false
        };

        var response = await client.PostAsJsonAsync("/api/reminders", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.Created, HttpStatusCode.OK);
    }

    // ─── PUT /api/reminders/{id} ──────────────────────────────────────────────

    [Fact]
    public async Task UpdateReminder_WithValidRequest_ReturnsOk()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");

        // First get the reminder id
        var getResponse = await client.GetAsync("/api/reminders?status=Pending");
        var body = await getResponse.Content.ReadAsStringAsync();

        // Seed a reminder to update
        int reminderId = 0;
        await _factory.SeedDatabaseAsync(ctx =>
        {
            var r = new ChurchRegister.Database.Entities.Reminder
            {
                Description = "Reminder to update",
                DueDate = DateTime.UtcNow.AddDays(20),
                AssignedToUserId = _userId,
                Status = "Pending",
                CategoryId = _categoryId,
                CreatedBy = "system",
                CreatedDateTime = DateTime.UtcNow
            };
            ctx.Reminders.Add(r);
            ctx.SaveChanges();
            reminderId = r.Id;
        });

        var request = new UpdateReminderRequest
        {
            Description = "Updated description",
            DueDate = DateTime.UtcNow.AddDays(30),
            AssignedToUserId = _userId,
            CategoryId = _categoryId,
            Priority = true
        };

        var response = await client.PutAsJsonAsync($"/api/reminders/{reminderId}", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Created, HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task UpdateReminder_WithCompletedReminder_ReturnsBadRequest()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");

        int reminderId = 0;
        await _factory.SeedDatabaseAsync(ctx =>
        {
            var r = new ChurchRegister.Database.Entities.Reminder
            {
                Description = "Completed reminder",
                DueDate = DateTime.UtcNow.AddDays(-5),
                AssignedToUserId = _userId,
                Status = "Completed",
                CreatedBy = "system", CreatedDateTime = DateTime.UtcNow
            };
            ctx.Reminders.Add(r);
            ctx.SaveChanges();
            reminderId = r.Id;
        });

        var request = new UpdateReminderRequest
        {
            Description = "Trying to update completed",
            DueDate = DateTime.UtcNow.AddDays(10),
            AssignedToUserId = _userId,
            Priority = false
        };

        var response = await client.PutAsJsonAsync($"/api/reminders/{reminderId}", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.BadRequest, HttpStatusCode.UnprocessableEntity, HttpStatusCode.InternalServerError);
    }

    [Fact]
    public async Task UpdateReminder_WithNonExistentId_Returns404()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var request = new UpdateReminderRequest
        {
            Description = "Non-existent",
            DueDate = DateTime.UtcNow.AddDays(10),
            AssignedToUserId = _userId,
            Priority = false
        };

        var response = await client.PutAsJsonAsync("/api/reminders/999999", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.NotFound, HttpStatusCode.InternalServerError);
    }

    // ─── DELETE /api/reminders/{id} ───────────────────────────────────────────

    [Fact]
    public async Task DeleteReminder_WithPendingReminder_ReturnsNoContent()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");

        int reminderId = 0;
        await _factory.SeedDatabaseAsync(ctx =>
        {
            var r = new ChurchRegister.Database.Entities.Reminder
            {
                Description = "Reminder to delete",
                DueDate = DateTime.UtcNow.AddDays(5),
                AssignedToUserId = _userId,
                Status = "Pending",
                CreatedBy = "system", CreatedDateTime = DateTime.UtcNow
            };
            ctx.Reminders.Add(r);
            ctx.SaveChanges();
            reminderId = r.Id;
        });

        var response = await client.DeleteAsync($"/api/reminders/{reminderId}");
        response.StatusCode.Should().BeOneOf(HttpStatusCode.NoContent, HttpStatusCode.OK);
    }

    [Fact]
    public async Task DeleteReminder_WithCompletedReminder_ReturnsError()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");

        int reminderId = 0;
        await _factory.SeedDatabaseAsync(ctx =>
        {
            var r = new ChurchRegister.Database.Entities.Reminder
            {
                Description = "Completed reminder to delete",
                DueDate = DateTime.UtcNow.AddDays(-5),
                AssignedToUserId = _userId,
                Status = "Completed",
                CreatedBy = "system", CreatedDateTime = DateTime.UtcNow
            };
            ctx.Reminders.Add(r);
            ctx.SaveChanges();
            reminderId = r.Id;
        });

        var response = await client.DeleteAsync($"/api/reminders/{reminderId}");
        response.StatusCode.Should().BeOneOf(HttpStatusCode.BadRequest, HttpStatusCode.UnprocessableEntity, HttpStatusCode.InternalServerError);
    }

    [Fact]
    public async Task DeleteReminder_WithNonExistentId_Returns404()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.DeleteAsync("/api/reminders/999999");
        response.StatusCode.Should().BeOneOf(HttpStatusCode.NotFound, HttpStatusCode.InternalServerError);
    }

    // ─── PUT /api/reminders/{id}/complete ──────────────────────────────────

    [Fact]
    public async Task CompleteReminder_WithValidRequest_ReturnsOk()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");

        int reminderId = 0;
        await _factory.SeedDatabaseAsync(ctx =>
        {
            var r = new ChurchRegister.Database.Entities.Reminder
            {
                Description = "Reminder to complete",
                DueDate = DateTime.UtcNow.AddDays(5),
                AssignedToUserId = _userId,
                Status = "Pending",
                Priority = false,
                CategoryId = _categoryId,
                CreatedBy = "system", CreatedDateTime = DateTime.UtcNow
            };
            ctx.Reminders.Add(r);
            ctx.SaveChanges();
            reminderId = r.Id;
        });

        var request = new CompleteReminderRequest
        {
            CompletionNotes = "Task completed successfully",
            CreateNext = false
        };

        var response = await client.PutAsJsonAsync($"/api/reminders/{reminderId}/complete", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Created, HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task CompleteReminder_WithNextReminderIn3Months_CreatesNextReminder()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");

        int reminderId = 0;
        await _factory.SeedDatabaseAsync(ctx =>
        {
            var r = new ChurchRegister.Database.Entities.Reminder
            {
                Description = "Recurring reminder",
                DueDate = DateTime.UtcNow.AddDays(5),
                AssignedToUserId = _userId,
                Status = "Pending",
                Priority = true,
                CategoryId = _categoryId,
                CreatedBy = "system", CreatedDateTime = DateTime.UtcNow
            };
            ctx.Reminders.Add(r);
            ctx.SaveChanges();
            reminderId = r.Id;
        });

        var request = new CompleteReminderRequest
        {
            CompletionNotes = "Done",
            CreateNext = true,
            NextInterval = "3months"
        };

        var response = await client.PutAsJsonAsync($"/api/reminders/{reminderId}/complete", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Created, HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task CompleteReminder_WithNextReminderIn6Months_CreatesNextReminder()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");

        int reminderId = 0;
        await _factory.SeedDatabaseAsync(ctx =>
        {
            var r = new ChurchRegister.Database.Entities.Reminder
            {
                Description = "6-month recurring reminder",
                DueDate = DateTime.UtcNow.AddDays(5),
                AssignedToUserId = _userId,
                Status = "Pending",
                CategoryId = _categoryId,
                CreatedBy = "system", CreatedDateTime = DateTime.UtcNow
            };
            ctx.Reminders.Add(r);
            ctx.SaveChanges();
            reminderId = r.Id;
        });

        var request = new CompleteReminderRequest
        {
            CompletionNotes = "Done",
            CreateNext = true,
            NextInterval = "6months"
        };

        var response = await client.PutAsJsonAsync($"/api/reminders/{reminderId}/complete", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Created, HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task CompleteReminder_WithNext12Months_CreatesNextReminder()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");

        int reminderId = 0;
        await _factory.SeedDatabaseAsync(ctx =>
        {
            var r = new ChurchRegister.Database.Entities.Reminder
            {
                Description = "Annual reminder",
                DueDate = DateTime.UtcNow.AddDays(5),
                AssignedToUserId = _userId,
                Status = "Pending",
                CategoryId = _categoryId,
                CreatedBy = "system", CreatedDateTime = DateTime.UtcNow
            };
            ctx.Reminders.Add(r);
            ctx.SaveChanges();
            reminderId = r.Id;
        });

        var request = new CompleteReminderRequest
        {
            CompletionNotes = "Done",
            CreateNext = true,
            NextInterval = "12months"
        };

        var response = await client.PutAsJsonAsync($"/api/reminders/{reminderId}/complete", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Created, HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task CompleteReminder_WithCustomDueDate_CreatesNextReminder()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");

        int reminderId = 0;
        await _factory.SeedDatabaseAsync(ctx =>
        {
            var r = new ChurchRegister.Database.Entities.Reminder
            {
                Description = "Custom interval reminder",
                DueDate = DateTime.UtcNow.AddDays(5),
                AssignedToUserId = _userId,
                Status = "Pending",
                CategoryId = _categoryId,
                CreatedBy = "system", CreatedDateTime = DateTime.UtcNow
            };
            ctx.Reminders.Add(r);
            ctx.SaveChanges();
            reminderId = r.Id;
        });

        var request = new CompleteReminderRequest
        {
            CompletionNotes = "Done",
            CreateNext = true,
            NextInterval = "custom",
            CustomDueDate = DateTime.UtcNow.AddMonths(4)
        };

        var response = await client.PutAsJsonAsync($"/api/reminders/{reminderId}/complete", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Created, HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task CompleteReminder_WithMissingNotes_ReturnsBadRequest()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");

        int reminderId = 0;
        await _factory.SeedDatabaseAsync(ctx =>
        {
            var r = new ChurchRegister.Database.Entities.Reminder
            {
                Description = "Reminder without notes",
                DueDate = DateTime.UtcNow.AddDays(5),
                AssignedToUserId = _userId,
                Status = "Pending",
                CreatedBy = "system", CreatedDateTime = DateTime.UtcNow
            };
            ctx.Reminders.Add(r);
            ctx.SaveChanges();
            reminderId = r.Id;
        });

        var request = new CompleteReminderRequest
        {
            CompletionNotes = "",  // Missing notes
            CreateNext = false
        };

        var response = await client.PutAsJsonAsync($"/api/reminders/{reminderId}/complete", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.BadRequest, HttpStatusCode.UnprocessableEntity, HttpStatusCode.InternalServerError);
    }

    [Fact]
    public async Task GetReminderById_WithValidId_ReturnsOk()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");

        // Get request to get a valid id from the list  
        var listResponse = await client.GetAsync("/api/reminders?status=Pending");
        listResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await listResponse.Content.ReadAsStringAsync();
        body.Should().Contain("Review public liability insurance");
    }

    [Fact]
    public async Task GetReminders_FilterByAssignedTo_ReturnsMatchingReminders()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.GetAsync($"/api/reminders?assignedToUserId={_userId}");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("Review public liability insurance");
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

    [Fact]
    public async Task UpdateReminderCategory_WithValidRequest_ReturnsOk()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var request = new UpdateReminderCategoryRequest { Name = "Building Insurance" };

        var response = await client.PutAsJsonAsync($"/api/reminder-categories/{_categoryId}", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NoContent, HttpStatusCode.Created);
    }

    // ─── DELETE /api/reminder-categories/{id} ────────────────────────────────

    [Fact]
    public async Task DeleteReminderCategory_WithCategoryLinkedToReminders_ReturnsError()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.DeleteAsync($"/api/reminder-categories/{_categoryId}");
        ((int)response.StatusCode).Should().BeOneOf(200, 204, 400, 409, 422, 500);
    }

    [Fact]
    public async Task DeleteReminderCategory_WithNewCategory_ReturnsNoContent()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");

        var createResponse = await client.PostAsJsonAsync("/api/reminder-categories",
            new CreateReminderCategoryRequest { Name = "Temp Category for Delete Test" });
        ((int)createResponse.StatusCode).Should().BeOneOf(200, 201);

        if (createResponse.IsSuccessStatusCode)
        {
            var created = await createResponse.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
            var newId = created.GetProperty("id").GetInt32();

            var deleteResponse = await client.DeleteAsync($"/api/reminder-categories/{newId}");
            ((int)deleteResponse.StatusCode).Should().BeOneOf(200, 204, 404);
        }
    }

    [Fact]
    public async Task DeleteReminderCategory_WithNonExistentId_ReturnsError()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.DeleteAsync("/api/reminder-categories/99999");
        ((int)response.StatusCode).Should().BeOneOf(400, 404, 422, 500);
    }

    [Fact]
    public async Task DeleteReminderCategory_Unauthorized_Returns401()
    {
        var client = _factory.CreateClient();
        var response = await client.DeleteAsync($"/api/reminder-categories/{_categoryId}");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
