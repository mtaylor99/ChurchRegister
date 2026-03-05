using System.Net;
using System.Net.Http.Json;
using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.Database.Data;
using ChurchRegister.Database.Entities;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace ChurchRegister.ApiService.Tests.ChurchMembers;

/// <summary>
/// Integration tests for GET /api/church-members/statistics (TASK-036)
/// </summary>
public class MemberStatisticsTests : IAsyncLifetime
{
    private readonly TestWebApplicationFactory<Program> _factory;

    public MemberStatisticsTests()
    {
        _factory = new TestWebApplicationFactory<Program>();
    }

    public async ValueTask InitializeAsync()
    {
        // Seed required seed data (statuses) shared by all tests in the class
        await _factory.SeedDatabaseAsync(ctx =>
        {
            ctx.ChurchMemberStatuses.AddRange(
                new ChurchMemberStatus { Id = 1, Name = "Active", CreatedBy = "system", CreatedDateTime = DateTime.UtcNow },
                new ChurchMemberStatus { Id = 2, Name = "Inactive", CreatedBy = "system", CreatedDateTime = DateTime.UtcNow }
            );
        });
    }

    public ValueTask DisposeAsync()
    {
        _factory.Dispose();
        return ValueTask.CompletedTask;
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private async Task<MemberStatisticsResponse> GetStatisticsAsync()
    {
        var client = _factory.CreateAdminClient();
        var response = await client.GetAsync("/api/church-members/statistics");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<MemberStatisticsResponse>();
        result.Should().NotBeNull();
        return result!;
    }

    private static Address BuildAddress(string nameNumber, string line1, string postcode) => new()
    {
        NameNumber = nameNumber,
        AddressLineOne = line1,
        Postcode = postcode,
        CreatedBy = "test",
        CreatedDateTime = DateTime.UtcNow
    };

    private static ChurchMember ActiveMember(string first, string last, int? addressId = null, int? districtId = null, bool envelopes = false) => new()
    {
        FirstName = first,
        LastName = last,
        ChurchMemberStatusId = 1,
        AddressId = addressId,
        DistrictId = districtId,
        Envelopes = envelopes,
        CreatedBy = "test",
        CreatedDateTime = DateTime.UtcNow
    };

    private static ChurchMember InactiveMember(string first, string last, bool envelopes = true) => new()
    {
        FirstName = first,
        LastName = last,
        ChurchMemberStatusId = 2,
        Envelopes = envelopes,
        CreatedBy = "test",
        CreatedDateTime = DateTime.UtcNow
    };

    // ─── TASK-036a: EnvelopeCount excludes inactive members ───────────────────

    [Fact]
    public async Task GetMemberStatistics_EnvelopeCount_ExcludesInactiveMembers()
    {
        await _factory.SeedDatabaseAsync(ctx =>
        {
            ctx.ChurchMembers.Add(ActiveMember("Alice", "Active", envelopes: true));
            ctx.ChurchMembers.Add(InactiveMember("Bob", "Inactive", envelopes: true));
        });

        var stats = await GetStatisticsAsync();

        // Only the active member with Envelopes=true should be counted
        stats.EnvelopeCount.Should().Be(1);
    }

    // ─── TASK-036b: EnvelopeCount excludes active members with Envelopes=false ─

    [Fact]
    public async Task GetMemberStatistics_EnvelopeCount_ExcludesActiveMembersWithEnvelopesFalse()
    {
        await _factory.SeedDatabaseAsync(ctx =>
        {
            ctx.ChurchMembers.Add(ActiveMember("Carol", "Nope", envelopes: false));
        });

        var stats = await GetStatisticsAsync();

        stats.EnvelopeCount.Should().Be(0);
    }

    // ─── TASK-036c: ResidenceCount deduplicates addresses case-insensitively ──

    [Fact]
    public async Task GetMemberStatistics_ResidenceCount_DeduplicatesAddressesCaseInsensitively()
    {
        await _factory.SeedDatabaseAsync(ctx =>
        {
            // Two members sharing the same address (different case/spacing)
            var addr1 = BuildAddress("10", "High Street", "AB1 2CD");
            var addr2 = BuildAddress("10", "high street", "ab1 2cd"); // same, different case
            ctx.Addresses.AddRange(addr1, addr2);
            ctx.SaveChanges();

            ctx.ChurchMembers.Add(ActiveMember("Dave", "Smith", addr1.Id));
            ctx.ChurchMembers.Add(ActiveMember("Eve", "Jones", addr2.Id));
        });

        var stats = await GetStatisticsAsync();

        // Both live at the same address — should count as 1 residence
        stats.ResidenceCount.Should().Be(1);
    }

    // ─── TASK-036d: ResidenceCount excludes members without an address ─────────

    [Fact]
    public async Task GetMemberStatistics_ResidenceCount_ExcludesMembersWithoutAddress()
    {
        await _factory.SeedDatabaseAsync(ctx =>
        {
            var addr = BuildAddress("1", "Main Road", "ZZ9 9ZZ");
            ctx.Addresses.Add(addr);
            ctx.SaveChanges();

            ctx.ChurchMembers.Add(ActiveMember("Frank", "WithAddress", addr.Id));
            ctx.ChurchMembers.Add(ActiveMember("Grace", "NoAddress", addressId: null));
        });

        var stats = await GetStatisticsAsync();

        stats.ResidenceCount.Should().Be(1);
    }

    // ─── TASK-036e: NoAddressCount is correct ────────────────────────────────

    [Fact]
    public async Task GetMemberStatistics_NoAddressCount_IsCorrect()
    {
        await _factory.SeedDatabaseAsync(ctx =>
        {
            var addr = BuildAddress("5", "Oak Avenue", "OA5 5OA");
            ctx.Addresses.Add(addr);
            ctx.SaveChanges();

            ctx.ChurchMembers.Add(ActiveMember("Hank", "HasAddress", addr.Id));
            ctx.ChurchMembers.Add(ActiveMember("Iris", "NoAddr1", addressId: null));
            ctx.ChurchMembers.Add(ActiveMember("Jack", "NoAddr2", addressId: null));
        });

        var stats = await GetStatisticsAsync();

        stats.NoAddressCount.Should().Be(2);
    }

    // ─── TASK-036f: DistrictBreakdown groups undistricted members as Unassigned ─

    [Fact]
    public async Task GetMemberStatistics_DistrictBreakdown_GroupsUndistrictedMembersAsUnassigned()
    {
        await _factory.SeedDatabaseAsync(ctx =>
        {
            var district = new ChurchRegister.Database.Entities.Districts
            {
                Name = "North",
                CreatedBy = "test",
                CreatedDateTime = DateTime.UtcNow
            };
            ctx.Districts.Add(district);
            ctx.SaveChanges();

            ctx.ChurchMembers.Add(ActiveMember("Kate", "InDistrict", districtId: district.Id));
            ctx.ChurchMembers.Add(ActiveMember("Leo", "NoDistrict", districtId: null));
        });

        var stats = await GetStatisticsAsync();

        stats.DistrictBreakdown.Should().HaveCount(2);

        var northEntry = stats.DistrictBreakdown.FirstOrDefault(d => d.DistrictName == "North");
        northEntry.Should().NotBeNull();
        northEntry!.MemberCount.Should().Be(1);

        var unassignedEntry = stats.DistrictBreakdown.FirstOrDefault(d => d.DistrictName == "Unassigned");
        unassignedEntry.Should().NotBeNull();
        unassignedEntry!.MemberCount.Should().Be(1);

        // Unassigned must be last
        stats.DistrictBreakdown.Last().DistrictName.Should().Be("Unassigned");
    }

    // ─── TASK-036g: Returns 401 when unauthenticated ──────────────────────────

    [Fact]
    public async Task GetMemberStatistics_ReturnsUnauthorized_WhenUnauthenticated()
    {
        var client = _factory.CreateClient(); // no auth token
        var response = await client.GetAsync("/api/church-members/statistics");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
