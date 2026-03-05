using System.Net;
using ChurchRegister.Database.Entities;
using FluentAssertions;

namespace ChurchRegister.ApiService.Tests.Districts;

/// <summary>
/// Integration tests for GET /api/districts/export-members-list (TASK-037)
/// </summary>
public class DistrictMemberListExportTests : IAsyncLifetime
{
    private readonly TestWebApplicationFactory<Program> _factory;

    public DistrictMemberListExportTests()
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

            var district = new ChurchRegister.Database.Entities.Districts
            {
                Name = "East District",
                CreatedBy = "system",
                CreatedDateTime = DateTime.UtcNow
            };
            ctx.Districts.Add(district);
            ctx.SaveChanges();

            ctx.ChurchMembers.Add(new ChurchMember
            {
                FirstName = "Sample",
                LastName = "Member",
                ChurchMemberStatusId = 1,
                DistrictId = district.Id,
                CreatedBy = "system",
                CreatedDateTime = DateTime.UtcNow
            });
        });
    }

    public ValueTask DisposeAsync()
    {
        _factory.Dispose();
        return ValueTask.CompletedTask;
    }

    // ─── TASK-037a: Returns 200 OK with application/pdf content type ──────────

    [Fact]
    public async Task ExportDistrictsMemberList_ReturnsOk_WithPdfContentType()
    {
        var client = _factory.CreateAdminClient();
        var response = await client.GetAsync("/api/districts/export-members-list");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/pdf");

        var bytes = await response.Content.ReadAsByteArrayAsync();
        bytes.Should().NotBeEmpty();
    }

    // ─── TASK-037b: Returns 401 when unauthenticated ──────────────────────────

    [Fact]
    public async Task ExportDistrictsMemberList_ReturnsUnauthorized_WhenUnauthenticated()
    {
        var client = _factory.CreateClient(); // no auth token
        var response = await client.GetAsync("/api/districts/export-members-list");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
