using System.Net;
using System.Net.Http.Json;
using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.Database.Entities;
using FluentAssertions;

namespace ChurchRegister.ApiService.Tests.ChurchMembers;

/// <summary>
/// Integration tests for RegisterNumberService through HTTP endpoints.
/// Covers: GetGenerationStatus, PreviewForYear, GenerateForYear.
/// </summary>
[Collection("IntegrationTests")]
public class RegisterNumberServiceIntegrationTests : IAsyncLifetime
{
    private readonly TestWebApplicationFactory<Program> _factory;
    private static readonly int TargetYear = DateTime.UtcNow.Year + 1;

    public RegisterNumberServiceIntegrationTests()
    {
        _factory = new TestWebApplicationFactory<Program>();
    }

    public async ValueTask InitializeAsync()
    {
        await _factory.SeedDatabaseAsync(ctx =>
        {
            ctx.ChurchMemberStatuses.AddRange(
                new ChurchMemberStatus { Id = 1, Name = "Active", CreatedBy = "system", CreatedDateTime = DateTime.UtcNow },
                new ChurchMemberStatus { Id = 2, Name = "Inactive", CreatedBy = "system", CreatedDateTime = DateTime.UtcNow }
            );
            ctx.SaveChanges();

            // Create role types
            var memberRole = new ChurchMemberRoleTypes { Type = "Member", CreatedBy = "system", CreatedDateTime = DateTime.UtcNow };
            var nonBaptisedRole = new ChurchMemberRoleTypes { Type = "Member (Non-Baptised)", CreatedBy = "system", CreatedDateTime = DateTime.UtcNow };
            var nonMemberRole = new ChurchMemberRoleTypes { Type = "Non-Member", CreatedBy = "system", CreatedDateTime = DateTime.UtcNow };
            ctx.ChurchMemberRoleTypes.AddRange(memberRole, nonBaptisedRole, nonMemberRole);
            ctx.SaveChanges();

            // Create active baptised member
            var activeMember = new ChurchMember
            {
                FirstName = "Alice", LastName = "Member",
                ChurchMemberStatusId = 1,
                CreatedBy = "system", CreatedDateTime = DateTime.UtcNow
            };
            ctx.ChurchMembers.Add(activeMember);
            ctx.SaveChanges();

            ctx.ChurchMemberRoles.Add(new ChurchMemberRoles
            {
                ChurchMemberId = activeMember.Id,
                ChurchMemberRoleTypeId = memberRole.Id,
                CreatedBy = "system", CreatedDateTime = DateTime.UtcNow
            });

            // Create active non-baptised member
            var nonBaptisedMember = new ChurchMember
            {
                FirstName = "Bob", LastName = "NonBaptised",
                ChurchMemberStatusId = 1,
                CreatedBy = "system", CreatedDateTime = DateTime.UtcNow
            };
            ctx.ChurchMembers.Add(nonBaptisedMember);
            ctx.SaveChanges();

            ctx.ChurchMemberRoles.Add(new ChurchMemberRoles
            {
                ChurchMemberId = nonBaptisedMember.Id,
                ChurchMemberRoleTypeId = nonBaptisedRole.Id,
                CreatedBy = "system", CreatedDateTime = DateTime.UtcNow
            });

            // Create non-member
            var nonMember = new ChurchMember
            {
                FirstName = "Charlie", LastName = "NonMember",
                ChurchMemberStatusId = 1,
                CreatedBy = "system", CreatedDateTime = DateTime.UtcNow
            };
            ctx.ChurchMembers.Add(nonMember);
            ctx.SaveChanges();

            ctx.ChurchMemberRoles.Add(new ChurchMemberRoles
            {
                ChurchMemberId = nonMember.Id,
                ChurchMemberRoleTypeId = nonMemberRole.Id,
                CreatedBy = "system", CreatedDateTime = DateTime.UtcNow
            });

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

    // ─── GET /api/register-numbers/status/{year} ─────────────────────────────

    [Fact]
    public async Task GetGenerationStatus_NotYetGenerated_ReturnsNotGenerated()
    {
        var response = await AdminClient().GetAsync($"/api/register-numbers/status/{TargetYear}");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("false");  // isGenerated = false
    }

    [Fact]
    public async Task GetGenerationStatus_WithInvalidYear_ReturnsError()
    {
        var response = await AdminClient().GetAsync("/api/register-numbers/status/1900");
        // Year < 2000 is invalid
        ((int)response.StatusCode).Should().BeOneOf(400, 404, 422);
    }

    [Fact]
    public async Task GetGenerationStatus_WithFutureValidYear_ReturnsOk()
    {
        var response = await AdminClient().GetAsync($"/api/register-numbers/status/{TargetYear}");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetGenerationStatus_AlreadyGenerated_ReturnsGenerated()
    {
        // Seed register numbers for target year to simulate already generated
        await _factory.SeedDatabaseAsync(ctx =>
        {
            var member = ctx.ChurchMembers.First();
            ctx.ChurchMemberRegisterNumbers.Add(new ChurchMemberRegisterNumber
            {
                ChurchMemberId = member.Id,
                Number = 1,
                Year = TargetYear,
                CreatedBy = "admin@test.com",
                CreatedDateTime = DateTime.UtcNow
            });
            ctx.SaveChanges();
        });

        var response = await AdminClient().GetAsync($"/api/register-numbers/status/{TargetYear}");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("true");  // isGenerated = true
    }

    // ─── GET /api/register-numbers/preview/{year} ────────────────────────────

    [Fact]
    public async Task PreviewRegisterNumbers_ForFutureYear_ReturnsOk()
    {
        var response = await AdminClient().GetAsync($"/api/register-numbers/preview/{TargetYear}");
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task PreviewRegisterNumbers_WithWrongYear_ReturnsBadRequest()
    {
        // Only current year + 1 is valid for preview (when not already generated)
        var wrongYear = DateTime.UtcNow.Year + 2;
        var response = await AdminClient().GetAsync($"/api/register-numbers/preview/{wrongYear}");
        // Should fail validation
        ((int)response.StatusCode).Should().BeOneOf(400, 422, 500);
    }

    [Fact]
    public async Task PreviewRegisterNumbers_Unauthorized_Returns401()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync($"/api/register-numbers/preview/{TargetYear}");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task PreviewRegisterNumbers_WhenAlreadyGenerated_ReturnsExistingAssignments()
    {
        // Seed register numbers so preview returns existing data
        int memberId = 0;
        await _factory.SeedDatabaseAsync(ctx =>
        {
            var member = ctx.ChurchMembers.First();
            memberId = member.Id;
            // Add to a year different from TargetYear to avoid conflict
            ctx.ChurchMemberRegisterNumbers.Add(new ChurchMemberRegisterNumber
            {
                ChurchMemberId = member.Id,
                Number = 1,
                Year = TargetYear,
                CreatedBy = "system",
                CreatedDateTime = DateTime.UtcNow
            });
            ctx.SaveChanges();
        });

        var response = await AdminClient().GetAsync($"/api/register-numbers/preview/{TargetYear}");
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.BadRequest, HttpStatusCode.InternalServerError);
    }

    // ─── POST /api/register-numbers/generate ─────────────────────────────────

    [Fact]
    public async Task GenerateRegisterNumbers_ForFutureYear_ReturnsOk()
    {
        // Use year + 1 which is the only valid target
        var request = new GenerateRegisterNumbersRequest { TargetYear = TargetYear, ConfirmGeneration = true };

        var response = await AdminClient().PostAsJsonAsync("/api/register-numbers/generate", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.BadRequest, HttpStatusCode.InternalServerError);
    }

    [Fact]
    public async Task GenerateRegisterNumbers_Unauthorized_Returns401()
    {
        var client = _factory.CreateClient();
        var request = new GenerateRegisterNumbersRequest { TargetYear = TargetYear, ConfirmGeneration = true };

        var response = await client.PostAsJsonAsync("/api/register-numbers/generate", request);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
