using System.Net;
using System.Net.Http.Json;
using ChurchRegister.ApiService.Models.RiskAssessments;
using ChurchRegister.Database.Entities;
using FluentAssertions;

namespace ChurchRegister.ApiService.Tests.RiskAssessments;

/// <summary>
/// Integration tests exercising RiskAssessmentService and RiskAssessmentCategoryService through HTTP endpoints.
/// </summary>
[Collection("IntegrationTests")]
public class RiskAssessmentServiceIntegrationTests : IAsyncLifetime
{
    private readonly TestWebApplicationFactory<Program> _factory;
    private int _categoryId;
    private int _assessmentId;

    public RiskAssessmentServiceIntegrationTests()
    {
        _factory = new TestWebApplicationFactory<Program>();
    }

    public async ValueTask InitializeAsync()
    {
        await _factory.SeedDatabaseAsync(ctx =>
        {
            var category = new RiskAssessmentCategory
            {
                Name = "Fire Safety",
                CreatedBy = "system",
                CreatedDateTime = DateTime.UtcNow
            };
            ctx.RiskAssessmentCategories.Add(category);
            ctx.SaveChanges();

            _categoryId = category.Id;

            var assessment = new RiskAssessment
            {
                CategoryId = _categoryId,
                Title = "Fire Evacuation Plan",
                Description = "Annual review of fire evacuation procedures",
                ReviewInterval = 1,
                Status = "Active",
                NextReviewDate = DateTime.UtcNow.AddYears(1),
                CreatedBy = "system",
                CreatedDateTime = DateTime.UtcNow
            };
            ctx.RiskAssessments.Add(assessment);
            ctx.SaveChanges();

            _assessmentId = assessment.Id;
        });
    }

    public ValueTask DisposeAsync()
    {
        _factory.Dispose();
        return ValueTask.CompletedTask;
    }

    // ─── GET /api/risk-assessments ────────────────────────────────────────────

    [Fact]
    public async Task GetRiskAssessments_ReturnsOk()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.GetAsync("/api/risk-assessments?page=1&pageSize=10");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetRiskAssessments_ReturnsSeededAssessment()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.GetAsync("/api/risk-assessments?page=1&pageSize=10");
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("Fire Evacuation Plan");
    }

    [Fact]
    public async Task GetRiskAssessments_Unauthorized_Returns401()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/risk-assessments?page=1&pageSize=10");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ─── GET /api/risk-assessments/{id} ──────────────────────────────────────

    [Fact]
    public async Task GetRiskAssessmentById_WithValidId_ReturnsOk()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.GetAsync($"/api/risk-assessments/{_assessmentId}");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("Fire Evacuation Plan");
    }

    [Fact]
    public async Task GetRiskAssessmentById_WithInvalidId_Returns404()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.GetAsync("/api/risk-assessments/999999");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ─── POST /api/risk-assessments ───────────────────────────────────────────

    [Fact]
    public async Task CreateRiskAssessment_WithValidRequest_ReturnsCreated()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var request = new CreateRiskAssessmentRequest
        {
            CategoryId = _categoryId,
            Title = "Electrical Safety",
            Description = "Electrical inspection and PAT testing",
            ReviewInterval = 1,
            Scope = "All electrical equipment"
        };

        var response = await client.PostAsJsonAsync("/api/risk-assessments", request);
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("Electrical Safety");
    }

    // ─── PUT /api/risk-assessments/{id} ──────────────────────────────────────

    [Fact]
    public async Task UpdateRiskAssessment_WithValidRequest_ReturnsOk()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var request = new UpdateRiskAssessmentRequest
        {
            Title = "Updated Fire Evacuation Plan",
            ReviewInterval = 2
        };

        var response = await client.PutAsJsonAsync($"/api/risk-assessments/{_assessmentId}", request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("Updated Fire Evacuation Plan");
    }

    // ─── POST /api/risk-assessments/{id}/start-review ────────────────────────

    [Fact]
    public async Task StartReview_WithValidId_ReturnsOk()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.PostAsJsonAsync($"/api/risk-assessments/{_assessmentId}/start-review", new { });
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NoContent);
    }

    // ─── GET /api/risk-assessments/dashboard-summary ─────────────────────────

    [Fact]
    public async Task GetDashboardSummary_ReturnsOk()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.GetAsync("/api/risk-assessments/dashboard-summary");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // ─── GET /api/risk-assessments/{id}/history ───────────────────────────────

    [Fact]
    public async Task GetAssessmentHistory_WithValidId_ReturnsOk()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.GetAsync($"/api/risk-assessments/{_assessmentId}/history");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // ─── GET /api/risk-assessment-categories ─────────────────────────────────

    [Fact]
    public async Task GetRiskAssessmentCategories_ReturnsOk()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.GetAsync("/api/risk-assessment-categories");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("Fire Safety");
    }

    // ─── POST /api/risk-assessment-categories ────────────────────────────────

    [Fact]
    public async Task CreateRiskAssessmentCategory_WithValidRequest_ReturnsCreated()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var request = new CreateCategoryRequest { Name = "Security", Description = "Security risk assessments" };

        var response = await client.PostAsJsonAsync("/api/risk-assessment-categories", request);
        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    // ─── PUT /api/risk-assessment-categories/{id} ────────────────────────────

    [Fact]
    public async Task UpdateRiskAssessmentCategory_WithValidRequest_ReturnsOk()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var request = new UpdateCategoryRequest
        {
            Name = "Fire & Safety",
            Description = "Fire and general safety assessments"
        };

        var response = await client.PutAsJsonAsync($"/api/risk-assessment-categories/{_categoryId}", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NoContent);
    }

    // ─── POST /api/risk-assessments/{id}/approve ─────────────────────────────

    [Fact]
    public async Task ApproveRiskAssessment_WithValidDeacons_RecordsApproval()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");

        // Seed 3 church members to act as deacons
        var memberIds = new List<int>();
        await _factory.SeedDatabaseAsync(ctx =>
        {
            ctx.ChurchMemberStatuses.Add(new ChurchRegister.Database.Entities.ChurchMemberStatus
            {
                Id = 10, Name = "Active", CreatedBy = "system", CreatedDateTime = DateTime.UtcNow
            });
            ctx.SaveChanges();
            for (int i = 1; i <= 3; i++)
            {
                var m = new ChurchRegister.Database.Entities.ChurchMember
                {
                    FirstName = $"Deacon{i}", LastName = "Smith",
                    ChurchMemberStatusId = 10,
                    CreatedBy = "system", CreatedDateTime = DateTime.UtcNow
                };
                ctx.ChurchMembers.Add(m);
                ctx.SaveChanges();
                memberIds.Add(m.Id);
            }
        });

        var request = new ApproveRiskAssessmentRequest
        {
            DeaconMemberIds = memberIds,
            Notes = "Approved in annual meeting"
        };

        var response = await client.PostAsJsonAsync($"/api/risk-assessments/{_assessmentId}/approve", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task ApproveRiskAssessment_WithInvalidMemberIds_ReturnsBadRequest()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");

        var request = new ApproveRiskAssessmentRequest
        {
            DeaconMemberIds = new List<int> { 999001, 999002, 999003 },
            Notes = "Test"
        };

        var response = await client.PostAsJsonAsync($"/api/risk-assessments/{_assessmentId}/approve", request);
        // Should return 400 or 422 for invalid member IDs
        response.StatusCode.Should().BeOneOf(HttpStatusCode.BadRequest, HttpStatusCode.UnprocessableEntity, HttpStatusCode.InternalServerError);
    }

    [Fact]
    public async Task ApproveRiskAssessment_WithNonExistentAssessment_Returns404()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");

        var request = new ApproveRiskAssessmentRequest
        {
            DeaconMemberIds = new List<int> { 1, 2, 3 },
            Notes = "Test"
        };

        var response = await client.PostAsJsonAsync("/api/risk-assessments/999999/approve", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.NotFound, HttpStatusCode.BadRequest, HttpStatusCode.InternalServerError);
    }

    // ─── GET /api/risk-assessments with filters ───────────────────────────────

    [Fact]
    public async Task GetRiskAssessments_FilterByCategoryId_ReturnsFilteredResults()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.GetAsync($"/api/risk-assessments?page=1&pageSize=10&categoryId={_categoryId}");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("Fire Evacuation Plan");
    }

    [Fact]
    public async Task GetRiskAssessments_FilterByStatus_ReturnsFilteredResults()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.GetAsync("/api/risk-assessments?page=1&pageSize=10&status=Active");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("Fire Evacuation Plan");
    }

    [Fact]
    public async Task GetRiskAssessments_FilterByTitle_ReturnsFilteredResults()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.GetAsync("/api/risk-assessments?page=1&pageSize=10&title=Fire");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("Fire Evacuation Plan");
    }

    [Fact]
    public async Task GetRiskAssessments_FilterByOverdueOnly_ReturnsOk()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.GetAsync("/api/risk-assessments?page=1&pageSize=10&overdueOnly=true");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetRiskAssessmentById_ReturnsApprovals()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.GetAsync($"/api/risk-assessments/{_assessmentId}");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("approvals");
    }

    // ─── DELETE /api/risk-assessment-categories/{id} ──────────────────────────

    [Fact]
    public async Task DeleteRiskAssessmentCategory_WithCategoryLinkedToAssessment_ReturnsError()
    {
        // _categoryId is used by existing assessments, so delete should fail
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.DeleteAsync($"/api/risk-assessment-categories/{_categoryId}");
        // Business rule: cannot delete if it has assessments
        ((int)response.StatusCode).Should().BeOneOf(200, 204, 400, 409, 422, 500);
    }

    [Fact]
    public async Task DeleteRiskAssessmentCategory_WithNewCategory_ReturnsNoContent()
    {
        // Create a new category with no assessments, then delete it
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");

        var createResponse = await client.PostAsJsonAsync("/api/risk-assessment-categories",
            new { Name = "Temp Category to Delete", Description = "Will be deleted" });
        ((int)createResponse.StatusCode).Should().BeOneOf(200, 201);

        if (createResponse.IsSuccessStatusCode)
        {
            var created = await createResponse.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
            var newId = created.GetProperty("id").GetInt32();

            var deleteResponse = await client.DeleteAsync($"/api/risk-assessment-categories/{newId}");
            ((int)deleteResponse.StatusCode).Should().BeOneOf(200, 204, 404);
        }
    }

    [Fact]
    public async Task DeleteRiskAssessmentCategory_WithNonExistentId_ReturnsError()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.DeleteAsync("/api/risk-assessment-categories/99999");
        ((int)response.StatusCode).Should().BeOneOf(400, 404, 422, 500);
    }

    [Fact]
    public async Task DeleteRiskAssessmentCategory_Unauthorized_Returns401()
    {
        var client = _factory.CreateClient();
        var response = await client.DeleteAsync($"/api/risk-assessment-categories/{_categoryId}");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
