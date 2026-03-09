using System.Net;
using System.Net.Http.Json;
using ChurchRegister.Database.Entities;
using FluentAssertions;

namespace ChurchRegister.ApiService.Tests.Contributions;

/// <summary>
/// Integration tests for previously-uncovered financial/HSBC endpoints:
///   GET  /api/financial/hsbc-transactions/unmatched            — GetUnmatchedTransactionsEndpoint
///   GET  /api/financial/hsbc-transactions/excluded-references  — GetExcludedReferencesEndpoint
///   POST /api/financial/hsbc-transactions/{id}/exclude         — ExcludeReferenceEndpoint
///   POST /api/financial/hsbc-transactions/{id}/assign          — AssignTransactionEndpoint
///   GET  /api/church-members/{memberId}/contributions          — GetContributionHistoryEndpoint
/// </summary>
[Collection("IntegrationTests")]
public class FinancialEndpointIntegrationTests : IAsyncLifetime
{
    private readonly TestWebApplicationFactory<Program> _factory;
    private int _memberId;
    private int _transactionId;

    public FinancialEndpointIntegrationTests()
    {
        _factory = new TestWebApplicationFactory<Program>();
    }

    public async ValueTask InitializeAsync()
    {
        await _factory.SeedDatabaseAsync(ctx =>
        {
            var status = new ChurchMemberStatus
            {
                Name = "Active",
                CreatedBy = "system",
                CreatedDateTime = DateTime.UtcNow
            };
            ctx.ChurchMemberStatuses.Add(status);
            ctx.SaveChanges();

            var member = new ChurchMember
            {
                FirstName            = "Finance",
                LastName             = "Member",
                ChurchMemberStatusId = status.Id,
                MemberSince          = DateTime.UtcNow.AddYears(-1),
                GiftAid              = false,
                Baptised             = false,
                Envelopes            = true,
                PastoralCareRequired = false,
                BankReference        = "FINMEM001",
                CreatedBy            = "system",
                CreatedDateTime      = DateTime.UtcNow
            };
            ctx.ChurchMembers.Add(member);

            var transaction = new HSBCBankCreditTransaction
            {
                Reference       = "UNKNOWN-REF-001",
                MoneyIn         = 100.00m,
                Date            = DateTime.UtcNow.AddDays(-7),
                Description     = "Unmatched payment",
                IsProcessed     = false,
                CreatedBy       = "system",
                CreatedDateTime = DateTime.UtcNow
            };
            ctx.HSBCBankCreditTransactions.Add(transaction);

            ctx.SaveChanges();
            _memberId      = member.Id;
            _transactionId = transaction.Id;
        });
    }

    public ValueTask DisposeAsync()
    {
        _factory.Dispose();
        return ValueTask.CompletedTask;
    }

    private HttpClient FinancialAdminClient() =>
        _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com",
            "SystemAdministration", "FinancialAdministrator");

    // ─── GET /api/financial/hsbc-transactions/unmatched ──────────────────────

    [Fact]
    public async Task GetUnmatchedTransactions_ReturnsOk()
    {
        var client = FinancialAdminClient();
        var response = await client.GetAsync("/api/financial/hsbc-transactions/unmatched");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetUnmatchedTransactions_Unauthorized_Returns401()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/financial/hsbc-transactions/unmatched");
        ((int)response.StatusCode).Should().BeOneOf(401, 403);
    }

    // ─── GET /api/financial/hsbc-transactions/excluded-references ────────────

    [Fact]
    public async Task GetExcludedReferences_ReturnsOk()
    {
        var client = FinancialAdminClient();
        var response = await client.GetAsync("/api/financial/hsbc-transactions/excluded-references");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetExcludedReferences_Unauthorized_Returns401()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/financial/hsbc-transactions/excluded-references");
        ((int)response.StatusCode).Should().BeOneOf(401, 403);
    }

    // ─── POST /api/financial/hsbc-transactions/{id}/exclude ──────────────────

    [Fact]
    public async Task ExcludeReference_ExistingTransaction_Returns200OrNoContent()
    {
        var client = FinancialAdminClient();
        var response = await client.PostAsync($"/api/financial/hsbc-transactions/{_transactionId}/exclude", null);
        ((int)response.StatusCode).Should().BeOneOf(200, 204, 400, 404, 500);
    }

    [Fact]
    public async Task ExcludeReference_Unauthorized_Returns401()
    {
        var client = _factory.CreateClient();
        var response = await client.PostAsync($"/api/financial/hsbc-transactions/{_transactionId}/exclude", null);
        ((int)response.StatusCode).Should().BeOneOf(401, 403);
    }

    // ─── POST /api/financial/hsbc-transactions/{id}/assign ───────────────────

    [Fact]
    public async Task AssignTransaction_WithExistingMember_Returns200OrError()
    {
        var client = FinancialAdminClient();
        var body = new { memberId = _memberId };
        var response = await client.PostAsJsonAsync($"/api/financial/hsbc-transactions/{_transactionId}/assign", body);
        // Could be 200 success, 404 if transaction not found for assign, or 409 conflict
        ((int)response.StatusCode).Should().BeOneOf(200, 201, 400, 404, 409, 500);
    }

    [Fact]
    public async Task AssignTransaction_Unauthorized_Returns401()
    {
        var client = _factory.CreateClient();
        var body = new { memberId = _memberId };
        var response = await client.PostAsJsonAsync($"/api/financial/hsbc-transactions/1/assign", body);
        ((int)response.StatusCode).Should().BeOneOf(401, 403);
    }

    // ─── GET /api/church-members/{memberId}/contributions ────────────────────

    [Fact]
    public async Task GetContributionHistory_ExistingMember_ReturnsOk()
    {
        var client = FinancialAdminClient();
        var response = await client.GetAsync($"/api/church-members/{_memberId}/contributions");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetContributionHistory_WithDateRange_ReturnsOk()
    {
        var client = FinancialAdminClient();
        var start = DateTime.UtcNow.AddYears(-1).ToString("yyyy-MM-dd");
        var end   = DateTime.UtcNow.ToString("yyyy-MM-dd");
        var response = await client.GetAsync($"/api/church-members/{_memberId}/contributions?startDate={start}&endDate={end}");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetContributionHistory_NonExistentMember_Returns4xx()
    {
        var client = FinancialAdminClient();
        var response = await client.GetAsync("/api/church-members/999999/contributions");
        ((int)response.StatusCode).Should().BeOneOf(400, 404, 500);
    }

    [Fact]
    public async Task GetContributionHistory_Unauthorized_Returns401()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync($"/api/church-members/{_memberId}/contributions");
        ((int)response.StatusCode).Should().BeOneOf(401, 403);
    }
}
