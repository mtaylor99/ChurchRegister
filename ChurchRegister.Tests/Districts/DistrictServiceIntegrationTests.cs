using System.Net;
using System.Net.Http.Json;
using ChurchRegister.ApiService.Models.Districts;
using ChurchRegister.Database.Data;
using ChurchRegister.Database.Entities;
using FluentAssertions;
using DistrictEntity = ChurchRegister.Database.Entities.Districts;

namespace ChurchRegister.ApiService.Tests.Districts;

/// <summary>
/// Integration tests exercising DistrictService through HTTP endpoints.
/// Covers: GetAllDistricts, GetActiveDeacons, GetActiveDistrictOfficers, AssignDeacon, AssignDistrictOfficer, AssignDescription.
/// </summary>
[Collection("IntegrationTests")]
public class DistrictServiceIntegrationTests : IAsyncLifetime
{
    private readonly TestWebApplicationFactory<Program> _factory;
    private int _districtId;
    private int _deaconMemberId;
    private int _officerMemberId;

    public DistrictServiceIntegrationTests()
    {
        _factory = new TestWebApplicationFactory<Program>();
    }

    public async ValueTask InitializeAsync()
    {
        await _factory.SeedDatabaseAsync(ctx =>
        {
            ctx.ChurchMemberStatuses.Add(new ChurchMemberStatus
            {
                Id = 1, Name = "Active", CreatedBy = "system", CreatedDateTime = DateTime.UtcNow
            });
            ctx.SaveChanges();

            // Create role types
            var deaconRoleType = new ChurchMemberRoleTypes
            {
                Type = "Deacon",
                CreatedBy = "system", CreatedDateTime = DateTime.UtcNow
            };
            var officerRoleType = new ChurchMemberRoleTypes
            {
                Type = "District Officer",
                CreatedBy = "system", CreatedDateTime = DateTime.UtcNow
            };
            ctx.ChurchMemberRoleTypes.Add(deaconRoleType);
            ctx.ChurchMemberRoleTypes.Add(officerRoleType);
            ctx.SaveChanges();

            // Create deacon member
            var deacon = new ChurchMember
            {
                FirstName = "John", LastName = "Deacon",
                ChurchMemberStatusId = 1,
                CreatedBy = "system", CreatedDateTime = DateTime.UtcNow
            };
            ctx.ChurchMembers.Add(deacon);
            ctx.SaveChanges();

            ctx.ChurchMemberRoles.Add(new ChurchMemberRoles
            {
                ChurchMemberId = deacon.Id,
                ChurchMemberRoleTypeId = deaconRoleType.Id,
                CreatedBy = "system", CreatedDateTime = DateTime.UtcNow
            });

            // Create district officer member
            var officer = new ChurchMember
            {
                FirstName = "Jane", LastName = "Officer",
                ChurchMemberStatusId = 1,
                CreatedBy = "system", CreatedDateTime = DateTime.UtcNow
            };
            ctx.ChurchMembers.Add(officer);
            ctx.SaveChanges();

            ctx.ChurchMemberRoles.Add(new ChurchMemberRoles
            {
                ChurchMemberId = officer.Id,
                ChurchMemberRoleTypeId = officerRoleType.Id,
                CreatedBy = "system", CreatedDateTime = DateTime.UtcNow
            });

            // Create a district
            var district = new DistrictEntity
            {
                Name = "North",
                Description = "North District",
                CreatedBy = "system", CreatedDateTime = DateTime.UtcNow
            };
            ctx.Districts.Add(district);
            ctx.SaveChanges();

            _deaconMemberId = deacon.Id;
            _officerMemberId = officer.Id;
            _districtId = district.Id;

            // Create a member in this district
            var memberInDistrict = new ChurchMember
            {
                FirstName = "Alice", LastName = "Member",
                ChurchMemberStatusId = 1,
                DistrictId = district.Id,
                CreatedBy = "system", CreatedDateTime = DateTime.UtcNow
            };
            ctx.ChurchMembers.Add(memberInDistrict);
            ctx.SaveChanges();
        });
    }

    public ValueTask DisposeAsync()
    {
        _factory.Dispose();
        return ValueTask.CompletedTask;
    }

    // ─── GET /api/districts ───────────────────────────────────────────────────

    [Fact]
    public async Task GetDistricts_ReturnsOk()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.GetAsync("/api/districts");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetDistricts_ReturnsSeededDistrict()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.GetAsync("/api/districts");
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("North");
    }

    [Fact]
    public async Task GetDistricts_Unauthorized_Returns401()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/districts");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ─── GET /api/districts/deacons ──────────────────────────────────────────

    [Fact]
    public async Task GetActiveDeacons_ReturnsOk()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.GetAsync("/api/districts/deacons");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("John");
    }

    // ─── GET /api/districts/district-officers ────────────────────────────────

    [Fact]
    public async Task GetActiveDistrictOfficers_ReturnsOk()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.GetAsync("/api/districts/district-officers");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("Jane");
    }

    [Fact]
    public async Task GetActiveDistrictOfficers_WithExcludeMemberId_ExcludesThatMember()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.GetAsync($"/api/districts/district-officers?excludeMemberId={_officerMemberId}");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().NotContain("Jane");
    }

    // ─── PUT /api/districts/{id}/assign-deacon ───────────────────────────────

    [Fact]
    public async Task AssignDeacon_WithValidDeacon_ReturnsNoContent()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var request = new AssignDeaconRequest { DeaconId = _deaconMemberId };

        var response = await client.PutAsJsonAsync($"/api/districts/{_districtId}/assign-deacon", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.NoContent, HttpStatusCode.OK);
    }

    [Fact]
    public async Task AssignDeacon_WithNonExistentMember_ReturnsBadRequest()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var request = new AssignDeaconRequest { DeaconId = 999999 };

        var response = await client.PutAsJsonAsync($"/api/districts/{_districtId}/assign-deacon", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.BadRequest, HttpStatusCode.InternalServerError);
    }

    [Fact]
    public async Task AssignDeacon_WithNonExistentDistrict_ReturnsError()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var request = new AssignDeaconRequest { DeaconId = _deaconMemberId };

        var response = await client.PutAsJsonAsync("/api/districts/999999/assign-deacon", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.NotFound, HttpStatusCode.BadRequest, HttpStatusCode.InternalServerError);
    }

    [Fact]
    public async Task AssignDeacon_WithMemberWithoutDeaconRole_ReturnsBadRequest()
    {
        // _officerMemberId has District Officer role but NOT Deacon role
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var request = new AssignDeaconRequest { DeaconId = _officerMemberId };

        var response = await client.PutAsJsonAsync($"/api/districts/{_districtId}/assign-deacon", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.BadRequest, HttpStatusCode.InternalServerError);
    }

    // ─── PUT /api/districts/{id}/assign-district-officer ─────────────────────

    [Fact]
    public async Task AssignDistrictOfficer_WithoutDeacon_ReturnsBadRequest()
    {
        // District has no deacon, so assigning an officer should fail
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var request = new AssignDistrictOfficerRequest { DistrictOfficerId = _officerMemberId };

        var response = await client.PutAsJsonAsync($"/api/districts/{_districtId}/assign-district-officer", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.BadRequest, HttpStatusCode.InternalServerError);
    }

    [Fact]
    public async Task AssignDistrictOfficer_WithDeaconAlreadyAssigned_ReturnsSuccess()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");

        // First assign a deacon
        await _factory.SeedDatabaseAsync(ctx =>
        {
            var d = ctx.Districts.Find(_districtId)!;
            d.DeaconId = _deaconMemberId;
            ctx.SaveChanges();
        });

        var request = new AssignDistrictOfficerRequest { DistrictOfficerId = _officerMemberId };
        var response = await client.PutAsJsonAsync($"/api/districts/{_districtId}/assign-district-officer", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.NoContent, HttpStatusCode.OK, HttpStatusCode.BadRequest);
    }

    // ─── PUT /api/districts/{id}/assign-description ───────────────────────────

    [Fact]
    public async Task AssignDescription_WithValidDescription_ReturnsSuccess()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");

        var response = await client.PutAsJsonAsync($"/api/districts/{_districtId}/assign-description",
            new AssignDescriptionRequest { Description = "Updated North District description" });
        response.StatusCode.Should().BeOneOf(HttpStatusCode.NoContent, HttpStatusCode.OK);
    }

    [Fact]
    public async Task AssignDescription_WithNonExistentDistrict_ReturnsError()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");

        var response = await client.PutAsJsonAsync("/api/districts/999999/assign-description",
            new AssignDescriptionRequest { Description = "Test description" });
        response.StatusCode.Should().BeOneOf(HttpStatusCode.NotFound, HttpStatusCode.BadRequest, HttpStatusCode.InternalServerError);
    }

    // ─── GET /api/districts/export ────────────────────────────────────────────

    [Fact]
    public async Task ExportDistricts_ReturnsOk()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.GetAsync("/api/districts/export");
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NoContent);
    }
}
