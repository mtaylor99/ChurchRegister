using System.Net;
using System.Net.Http.Json;
using ChurchRegister.ApiService.Models;
using ChurchRegister.ApiService.Models.Security;
using ChurchRegister.Database.Data;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;

namespace ChurchRegister.ApiService.Tests.Security;

/// <summary>
/// Integration tests exercising UserManagementService through HTTP endpoints.
/// </summary>
[Collection("IntegrationTests")]
public class UserManagementIntegrationTests : IAsyncLifetime
{
    private readonly TestWebApplicationFactory<Program> _factory;
    private string _testUserId = string.Empty;

    public UserManagementIntegrationTests()
    {
        _factory = new TestWebApplicationFactory<Program>();
    }

    public async ValueTask InitializeAsync()
    {
        // Create a test user in the identity store so GetUsersAsync returns something
        await _factory.ExecuteInScopeAsync(async sp =>
        {
            var userManager = sp.GetRequiredService<UserManager<ChurchRegisterWebUser>>();

            var user = new ChurchRegisterWebUser
            {
                UserName = "testuser@example.com",
                Email = "testuser@example.com",
                EmailConfirmed = true,
                FirstName = "Test",
                LastName = "User",
                JobTitle = "Tester",
                DateJoined = DateTime.UtcNow,
                CreatedBy = "system",
                CreatedDateTime = DateTime.UtcNow
            };

            var result = await userManager.CreateAsync(user, "TestPassword1!");
            if (result.Succeeded)
                _testUserId = user.Id;
        });
    }

    public ValueTask DisposeAsync()
    {
        _factory.Dispose();
        return ValueTask.CompletedTask;
    }

    private HttpClient AdminClient() =>
        _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");

    // ─── GET /api/administration/users ────────────────────────────────────────

    [Fact]
    public async Task GetUsers_DefaultPagination_ReturnsOk()
    {
        var client = AdminClient();
        var response = await client.GetAsync("/api/administration/users?page=1&pageSize=10");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetUsers_ReturnsSeededUser()
    {
        var client = AdminClient();
        var response = await client.GetAsync("/api/administration/users?page=1&pageSize=10");
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("testuser@example.com");
    }

    [Fact]
    public async Task GetUsers_WithSearchTerm_ReturnsFilteredResults()
    {
        var client = AdminClient();
        // Search that will match the seeded user
        var response = await client.GetAsync("/api/administration/users?page=1&pageSize=10&searchTerm=Test");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("testuser@example.com");
    }

    [Fact]
    public async Task GetUsers_WithSearchTermNoMatch_ReturnsEmptyResults()
    {
        var client = AdminClient();
        var response = await client.GetAsync("/api/administration/users?page=1&pageSize=10&searchTerm=ZZZNoMatch999");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<PagedResult<UserProfileDto>>();
        result!.TotalCount.Should().Be(0);
    }

    [Fact]
    public async Task GetUsers_WithStatusFilter_ReturnsOk()
    {
        // statusFilter=0 corresponds to UserAccountStatus.Pending
        var client = AdminClient();
        var response = await client.GetAsync("/api/administration/users?page=1&pageSize=10&statusFilter=0");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetUsers_WithRoleFilter_ReturnsOk()
    {
        var client = AdminClient();
        var response = await client.GetAsync("/api/administration/users?page=1&pageSize=10&roleFilter=SystemAdministration");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetUsers_SortedDescByEmail_ReturnsOk()
    {
        var client = AdminClient();
        var response = await client.GetAsync("/api/administration/users?page=1&pageSize=10&sortBy=email&sortDirection=desc");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetUsers_SortedAscByLastName_ReturnsOk()
    {
        var client = AdminClient();
        var response = await client.GetAsync("/api/administration/users?page=1&pageSize=10&sortBy=lastname");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetUsers_SortedAscByFirstName_ReturnsOk()
    {
        var client = AdminClient();
        var response = await client.GetAsync("/api/administration/users?page=1&pageSize=10&sortBy=firstname");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetUsers_SortedDescByLastName_ReturnsOk()
    {
        var client = AdminClient();
        var response = await client.GetAsync("/api/administration/users?page=1&pageSize=10&sortBy=lastname&sortDirection=desc");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetUsers_SortedByJobTitle_ReturnsOk()
    {
        var client = AdminClient();
        var response = await client.GetAsync("/api/administration/users?page=1&pageSize=10&sortBy=jobtitle");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetUsers_SortedByDateJoined_ReturnsOk()
    {
        var client = AdminClient();
        var response = await client.GetAsync("/api/administration/users?page=1&pageSize=10&sortBy=datejoined");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetUsers_SortedByStatus_ReturnsOk()
    {
        var client = AdminClient();
        var response = await client.GetAsync("/api/administration/users?page=1&pageSize=10&sortBy=status");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetUsers_SortedDescByJobTitle_ReturnsOk()
    {
        var client = AdminClient();
        var response = await client.GetAsync("/api/administration/users?page=1&pageSize=10&sortBy=jobtitle&sortDirection=desc");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetUsers_SortedDescByDateJoined_ReturnsOk()
    {
        var client = AdminClient();
        var response = await client.GetAsync("/api/administration/users?page=1&pageSize=10&sortBy=datejoined&sortDirection=desc");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetUsers_SortedDescByStatus_ReturnsOk()
    {
        var client = AdminClient();
        var response = await client.GetAsync("/api/administration/users?page=1&pageSize=10&sortBy=status&sortDirection=desc");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetUsers_ReturnsUserWithCorrectProfile()
    {
        var client = AdminClient();
        var response = await client.GetAsync("/api/administration/users?page=1&pageSize=10&searchTerm=User");
        var result = await response.Content.ReadFromJsonAsync<PagedResult<UserProfileDto>>();
        var user = result!.Items.FirstOrDefault(u => u.Email == "testuser@example.com");
        user.Should().NotBeNull();
        user!.FirstName.Should().Be("Test");
        user.LastName.Should().Be("User");
        user.Avatar.Should().Be("TU");
    }

    [Fact]
    public async Task GetUsers_Unauthorized_Returns401()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/administration/users?page=1&pageSize=10");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ─── GET /api/administration/roles ────────────────────────────────────────

    [Fact]
    public async Task GetSystemRoles_ReturnsOk()
    {
        var client = AdminClient();
        var response = await client.GetAsync("/api/administration/roles");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetSystemRoles_ReturnsJsonArray()
    {
        var client = AdminClient();
        var response = await client.GetAsync("/api/administration/roles");
        var body = await response.Content.ReadAsStringAsync();
        body.Should().StartWith("[");
    }
}
