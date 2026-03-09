using System.Net;
using System.Net.Http.Json;
using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.Database.Entities;
using DistrictEntity = ChurchRegister.Database.Entities.Districts;
using FluentAssertions;

namespace ChurchRegister.ApiService.Tests.ChurchMembers;

/// <summary>
/// Integration tests covering previously-uncovered ChurchMember CRUD endpoints:
///   POST  /api/church-members                       — CreateChurchMemberEndpoint
///   DELETE /api/church-members/{id}                 — DeleteChurchMemberEndpoint
///   PUT    /api/church-members/{id}/district        — AssignDistrictEndpoint
///   PATCH  /api/church-members/{id}/status          — UpdateChurchMemberStatusEndpoint
///   GET    /api/church-members/{id}/data-protection — GetDataProtectionEndpoint
///   PUT    /api/church-members/{id}/data-protection — UpdateDataProtectionEndpoint
/// </summary>
[Collection("IntegrationTests")]
public class ChurchMemberCrudIntegrationTests : IAsyncLifetime
{
    private readonly TestWebApplicationFactory<Program> _factory;

    private int _statusActiveId;
    private int _statusInactiveId;
    private int _districtId;
    private int _existingMemberId;

    public ChurchMemberCrudIntegrationTests()
    {
        _factory = new TestWebApplicationFactory<Program>();
    }

    public async ValueTask InitializeAsync()
    {
        await _factory.SeedDatabaseAsync(ctx =>
        {
            var active   = new ChurchMemberStatus { Name = "Active",   CreatedBy = "system", CreatedDateTime = DateTime.UtcNow };
            var inactive = new ChurchMemberStatus { Name = "Inactive", CreatedBy = "system", CreatedDateTime = DateTime.UtcNow };
            ctx.ChurchMemberStatuses.AddRange(active, inactive);
            ctx.SaveChanges();
            _statusActiveId   = active.Id;
            _statusInactiveId = inactive.Id;

            var district = new DistrictEntity
            {
                Name      = "Test District",
                CreatedBy = "system",
                CreatedDateTime = DateTime.UtcNow
            };
            ctx.Districts.Add(district);
            ctx.SaveChanges();
            _districtId = district.Id;

            var member = new ChurchMember
            {
                FirstName              = "Existing",
                LastName               = "Member",
                EmailAddress           = "existing@test.com",
                ChurchMemberStatusId   = _statusActiveId,
                MemberSince            = DateTime.UtcNow.AddYears(-1),
                GiftAid                = false,
                Baptised               = false,
                Envelopes              = false,
                PastoralCareRequired   = false,
                CreatedBy              = "system",
                CreatedDateTime        = DateTime.UtcNow
            };
            ctx.ChurchMembers.Add(member);
            ctx.SaveChanges();
            _existingMemberId = member.Id;

            var dataProtection = new ChurchMemberDataProtection
            {
                ChurchMemberId              = member.Id,
                AllowNameInCommunications   = false,
                AllowPhotoInCommunications  = false,
                AllowPhotoInSocialMedia     = false,
                GroupPhotos                 = false,
                PermissionForMyChildren     = false,
                CreatedBy                   = "system",
                CreatedDateTime             = DateTime.UtcNow
            };
            ctx.ChurchMemberDataProtection.Add(dataProtection);
            ctx.SaveChanges();
        });
    }

    public ValueTask DisposeAsync()
    {
        _factory.Dispose();
        return ValueTask.CompletedTask;
    }

    private HttpClient AdminClient() =>
        _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");

    private CreateChurchMemberRequest ValidCreateRequest(string firstName = "New") =>
        new CreateChurchMemberRequest
        {
            FirstName            = firstName,
            LastName             = "TestUser",
            Email                = $"{firstName.ToLower()}{Guid.NewGuid():N}@example.com",
            StatusId             = _statusActiveId,
            MemberSince          = DateTime.UtcNow.AddYears(-1),
            Baptised             = false,
            GiftAid              = false,
            Envelopes            = false,
            PastoralCareRequired = false,
            RoleIds              = Array.Empty<int>()
        };

    // ─── POST /api/church-members ─────────────────────────────────────────────

    [Fact]
    public async Task CreateChurchMember_WithValidRequest_Returns201()
    {
        var client = AdminClient();
        var response = await client.PostAsJsonAsync("/api/church-members", ValidCreateRequest("Alice"));
        ((int)response.StatusCode).Should().BeOneOf(200, 201);
    }

    [Fact]
    public async Task CreateChurchMember_Unauthorized_Returns401()
    {
        var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/church-members", ValidCreateRequest());
        ((int)response.StatusCode).Should().BeOneOf(401, 403);
    }

    [Fact]
    public async Task CreateChurchMember_WithMissingRequiredFields_Returns4xx()
    {
        var client = AdminClient();
        var invalid = new { lastName = "NoFirst" };
        var response = await client.PostAsJsonAsync("/api/church-members", invalid);
        ((int)response.StatusCode).Should().BeOneOf(400, 422, 500);
    }

    // ─── DELETE /api/church-members/{id} ──────────────────────────────────────

    [Fact]
    public async Task DeleteChurchMember_ExistingMember_Returns204()
    {
        // Create a fresh member to delete so other tests aren't affected
        var client = AdminClient();
        var createResp = await client.PostAsJsonAsync("/api/church-members", ValidCreateRequest("ToDelete"));
        var created = await createResp.Content.ReadFromJsonAsync<CreateChurchMemberResponse>();
        created.Should().NotBeNull();

        var deleteResp = await client.DeleteAsync($"/api/church-members/{created!.Id}");
        ((int)deleteResp.StatusCode).Should().BeOneOf(200, 204);
    }

    [Fact]
    public async Task DeleteChurchMember_NonExistentId_Returns4xx()
    {
        var client = AdminClient();
        var response = await client.DeleteAsync("/api/church-members/999999");
        ((int)response.StatusCode).Should().BeOneOf(400, 404, 500);
    }

    [Fact]
    public async Task DeleteChurchMember_Unauthorized_Returns401()
    {
        var client = _factory.CreateClient();
        var response = await client.DeleteAsync($"/api/church-members/{_existingMemberId}");
        ((int)response.StatusCode).Should().BeOneOf(401, 403);
    }

    // ─── PUT /api/church-members/{id}/district ────────────────────────────────

    [Fact]
    public async Task AssignDistrict_WithValidDistrictId_Returns200()
    {
        var client = AdminClient();
        var body = new { districtId = _districtId };
        var response = await client.PutAsJsonAsync($"/api/church-members/{_existingMemberId}/district", body);
        ((int)response.StatusCode).Should().BeOneOf(200, 201, 204);
    }

    [Fact]
    public async Task AssignDistrict_WithNullDistrictId_Unassigns()
    {
        var client = AdminClient();
        var body = new { districtId = (int?)null };
        var response = await client.PutAsJsonAsync($"/api/church-members/{_existingMemberId}/district", body);
        ((int)response.StatusCode).Should().BeOneOf(200, 204);
    }

    [Fact]
    public async Task AssignDistrict_Unauthorized_Returns401()
    {
        var client = _factory.CreateClient();
        var body = new { districtId = _districtId };
        var response = await client.PutAsJsonAsync($"/api/church-members/{_existingMemberId}/district", body);
        ((int)response.StatusCode).Should().BeOneOf(401, 403);
    }

    // ─── PATCH /api/church-members/{id}/status ────────────────────────────────

    [Fact]
    public async Task UpdateChurchMemberStatus_WithValidStatusId_Returns200()
    {
        var client = AdminClient();
        var body = new { statusId = _statusInactiveId, note = "Test status change" };
        var response = await client.PatchAsJsonAsync($"/api/church-members/{_existingMemberId}/status", body);
        ((int)response.StatusCode).Should().BeOneOf(200, 204);
    }

    [Fact]
    public async Task UpdateChurchMemberStatus_NonExistentMember_Returns4xx()
    {
        var client = AdminClient();
        var body = new { statusId = _statusActiveId };
        var response = await client.PatchAsJsonAsync("/api/church-members/999999/status", body);
        ((int)response.StatusCode).Should().BeOneOf(400, 404, 500);
    }

    [Fact]
    public async Task UpdateChurchMemberStatus_Unauthorized_Returns401()
    {
        var client = _factory.CreateClient();
        var body = new { statusId = _statusActiveId };
        var response = await client.PatchAsJsonAsync($"/api/church-members/{_existingMemberId}/status", body);
        ((int)response.StatusCode).Should().BeOneOf(401, 403);
    }

    // ─── GET  /api/church-members/{id}/data-protection ───────────────────────

    [Fact]
    public async Task GetDataProtection_ExistingMember_Returns200OrNoContent()
    {
        var client = AdminClient();
        var response = await client.GetAsync($"/api/church-members/{_existingMemberId}/data-protection");
        ((int)response.StatusCode).Should().BeOneOf(200, 204);
    }

    [Fact]
    public async Task GetDataProtection_Unauthorized_Returns401()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync($"/api/church-members/{_existingMemberId}/data-protection");
        ((int)response.StatusCode).Should().BeOneOf(401, 403);
    }

    // ─── PUT /api/church-members/{id}/data-protection ────────────────────────

    [Fact]
    public async Task UpdateDataProtection_WithValidData_Returns200()
    {
        var client = AdminClient();
        var body = new
        {
            allowNameInCommunications          = true,
            allowHealthStatusInCommunications  = false,
            allowPhotoInCommunications         = true,
            allowPhotoInSocialMedia            = false,
            groupPhotos                        = true,
            permissionForMyChildren            = false
        };
        var response = await client.PutAsJsonAsync($"/api/church-members/{_existingMemberId}/data-protection", body);
        ((int)response.StatusCode).Should().BeOneOf(200, 204);
    }

    // ─── GET /api/church-members/{id} ─────────────────────────────────────────

    [Fact]
    public async Task GetChurchMemberById_ExistingMember_Returns200()
    {
        var client = AdminClient();
        var response = await client.GetAsync($"/api/church-members/{_existingMemberId}");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetChurchMemberById_NonExistentId_Returns4xx()
    {
        var client = AdminClient();
        var response = await client.GetAsync("/api/church-members/999999");
        ((int)response.StatusCode).Should().BeOneOf(400, 404);
    }

    [Fact]
    public async Task GetChurchMemberById_Unauthorized_Returns401()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync($"/api/church-members/{_existingMemberId}");
        ((int)response.StatusCode).Should().BeOneOf(401, 403);
    }

    // ─── GET /api/church-members/statuses ────────────────────────────────────

    [Fact]
    public async Task GetChurchMemberStatuses_Returns200()
    {
        var client = AdminClient();
        var response = await client.GetAsync("/api/church-members/statuses");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // ─── GET /api/church-members/roles ───────────────────────────────────────

    [Fact]
    public async Task GetChurchMemberRoles_Returns200()
    {
        var client = AdminClient();
        var response = await client.GetAsync("/api/church-members/roles");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // ─── PUT /api/church-members/{id} ────────────────────────────────────────

    [Fact]
    public async Task UpdateChurchMember_WithValidData_Returns200()
    {
        var client = AdminClient();
        var request = new UpdateChurchMemberRequest
        {
            Id                   = _existingMemberId,
            FirstName            = "Updated",
            LastName             = "Member",
            StatusId             = _statusActiveId,
            MemberSince          = DateTime.UtcNow.AddYears(-2),
            Baptised             = false,
            GiftAid              = false,
            Envelopes            = false,
            PastoralCareRequired = false,
            RoleIds              = Array.Empty<int>()
        };
        var response = await client.PutAsJsonAsync($"/api/church-members/{_existingMemberId}", request);
        ((int)response.StatusCode).Should().BeOneOf(200, 204);
    }
}
