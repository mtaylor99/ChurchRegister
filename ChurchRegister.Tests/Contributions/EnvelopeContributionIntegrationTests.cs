using System.Net;
using System.Net.Http.Json;
using ChurchRegister.ApiService.Models.Contributions;
using ChurchRegister.Database.Data;
using ChurchRegister.Database.Entities;
using FluentAssertions;

namespace ChurchRegister.ApiService.Tests.Contributions;

/// <summary>
/// Integration tests exercising EnvelopeContributionService through HTTP endpoints.
/// </summary>
[Collection("IntegrationTests")]
public class EnvelopeContributionIntegrationTests : IAsyncLifetime
{
    private readonly TestWebApplicationFactory<Program> _factory;
    private static readonly int TestYear = DateTime.UtcNow.Year;

    public EnvelopeContributionIntegrationTests()
    {
        _factory = new TestWebApplicationFactory<Program>();
    }

    public async ValueTask InitializeAsync()
    {
        await _factory.SeedDatabaseAsync(ctx =>
        {
            // Seed member statuses
            ctx.ChurchMemberStatuses.AddRange(
                new ChurchMemberStatus { Id = 1, Name = "Active", CreatedBy = "system", CreatedDateTime = DateTime.UtcNow },
                new ChurchMemberStatus { Id = 2, Name = "Inactive", CreatedBy = "system", CreatedDateTime = DateTime.UtcNow }
            );
            ctx.SaveChanges();

            // Seed active member with register number
            var activeMember = new ChurchMember
            {
                FirstName = "Alice",
                LastName = "Active",
                ChurchMemberStatusId = 1,
                CreatedBy = "system",
                CreatedDateTime = DateTime.UtcNow
            };
            ctx.ChurchMembers.Add(activeMember);
            ctx.SaveChanges();

            ctx.ChurchMemberRegisterNumbers.Add(new ChurchMemberRegisterNumber
            {
                ChurchMemberId = activeMember.Id,
                Number = 1001,
                Year = TestYear,
                CreatedBy = "system",
                CreatedDateTime = DateTime.UtcNow
            });

            // Seed inactive member with register number
            var inactiveMember = new ChurchMember
            {
                FirstName = "Bob",
                LastName = "Inactive",
                ChurchMemberStatusId = 2,
                CreatedBy = "system",
                CreatedDateTime = DateTime.UtcNow
            };
            ctx.ChurchMembers.Add(inactiveMember);
            ctx.SaveChanges();

            ctx.ChurchMemberRegisterNumbers.Add(new ChurchMemberRegisterNumber
            {
                ChurchMemberId = inactiveMember.Id,
                Number = 1002,
                Year = TestYear,
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

    private HttpClient FinancialClient() =>
        _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "finance@test.com", "SystemAdministration");

    // ─── GET /api/financial/envelope-contributions/validate-register-number ────

    [Fact]
    public async Task ValidateRegisterNumber_NotFound_ReturnsInvalidResponse()
    {
        var client = FinancialClient();
        var response = await client.GetAsync($"/api/financial/envelope-contributions/validate-register-number/9999/{TestYear}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("false");
        body.Should().Contain("Register number not found");
    }

    [Fact]
    public async Task ValidateRegisterNumber_ActiveMember_ReturnsValid()
    {
        var client = FinancialClient();
        var response = await client.GetAsync($"/api/financial/envelope-contributions/validate-register-number/1001/{TestYear}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<ValidateRegisterNumberResponse>();
        result!.Valid.Should().BeTrue();
        result.MemberName.Should().Be("Alice Active");
        result.IsActive.Should().BeTrue();
    }

    [Fact]
    public async Task ValidateRegisterNumber_InactiveMember_ReturnsInvalid()
    {
        var client = FinancialClient();
        var response = await client.GetAsync($"/api/financial/envelope-contributions/validate-register-number/1002/{TestYear}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<ValidateRegisterNumberResponse>();
        result!.Valid.Should().BeFalse();
        result.MemberName.Should().Be("Bob Inactive");
        result.IsActive.Should().BeFalse();
        result.Error.Should().Contain("not active");
    }

    [Fact]
    public async Task ValidateRegisterNumber_InvalidNumber_ReturnsError()
    {
        var client = FinancialClient();
        // Number <= 0 triggers ArgumentException in use case
        var response = await client.GetAsync($"/api/financial/envelope-contributions/validate-register-number/0/{TestYear}");
        // The endpoint catches ArgumentException and returns 400
        ((int)response.StatusCode).Should().BeOneOf(400, 422);
    }

    [Fact]
    public async Task ValidateRegisterNumber_Unauthorized_Returns401()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync($"/api/financial/envelope-contributions/validate-register-number/1001/{TestYear}");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ─── GET /api/financial/envelope-contributions/batches ───────────────────

    [Fact]
    public async Task GetBatchList_NoBatches_ReturnsEmptyOk()
    {
        var client = FinancialClient();
        var response = await client.GetAsync("/api/financial/envelope-contributions/batches?pageNumber=1&pageSize=10");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<GetBatchListResponse>();
        result!.TotalCount.Should().Be(0);
        result.Batches.Should().BeEmpty();
    }

    [Fact]
    public async Task GetBatchList_WithStartDate_ReturnsOk()
    {
        var client = FinancialClient();
        var response = await client.GetAsync("/api/financial/envelope-contributions/batches?pageNumber=1&pageSize=10&startDate=2024-01-01");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetBatchList_WithEndDate_ReturnsOk()
    {
        var client = FinancialClient();
        var response = await client.GetAsync("/api/financial/envelope-contributions/batches?pageNumber=1&pageSize=10&endDate=2024-12-31");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetBatchList_WithDateRange_ReturnsOk()
    {
        var client = FinancialClient();
        var response = await client.GetAsync("/api/financial/envelope-contributions/batches?pageNumber=1&pageSize=10&startDate=2024-01-01&endDate=2024-12-31");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetBatchList_Unauthorized_Returns401()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/financial/envelope-contributions/batches");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ─── GET /api/financial/envelope-contributions/batches/{batchId} ──────────

    [Fact]
    public async Task GetBatchDetails_NonExistentId_ReturnsError()
    {
        var client = FinancialClient();
        var response = await client.GetAsync("/api/financial/envelope-contributions/batches/99999");
        // Endpoint catches ArgumentException → 400/404
        ((int)response.StatusCode).Should().BeOneOf(400, 404, 422);
    }

    [Fact]
    public async Task GetBatchDetails_Unauthorized_Returns401()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/financial/envelope-contributions/batches/1");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
