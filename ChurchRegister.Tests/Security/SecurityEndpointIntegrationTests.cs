using System.Net;
using System.Net.Http.Json;
using ChurchRegister.ApiService.Models.Security;
using ChurchRegister.Database.Data;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;

namespace ChurchRegister.ApiService.Tests.Security;

/// <summary>
/// Integration tests covering security endpoints that were previously at 0% coverage:
///   GET  /api/auth/user           — GetCurrentUserEndpoint
///   POST /api/auth/password-change — ChangePasswordEndpoint
///   PUT  /api/auth/profile         — UpdateProfileEndpoint
/// </summary>
[Collection("IntegrationTests")]
public class SecurityEndpointIntegrationTests : IAsyncLifetime
{
    private readonly TestWebApplicationFactory<Program> _factory;
    private string _testUserId = string.Empty;
    private const string TestPassword = "TestPass123!";
    private const string NewPassword  = "NewPassword456!!";  // min 12 chars required

    public SecurityEndpointIntegrationTests()
    {
        _factory = new TestWebApplicationFactory<Program>();
    }

    public async ValueTask InitializeAsync()
    {
        await _factory.ExecuteInScopeAsync(async sp =>
        {
            var userManager = sp.GetRequiredService<UserManager<ChurchRegisterWebUser>>();
            var user = new ChurchRegisterWebUser
            {
                UserName       = "sectest@example.com",
                Email          = "sectest@example.com",
                EmailConfirmed = true,
                FirstName      = "Security",
                LastName       = "Tester",
                JobTitle       = "Tester",
                DateJoined     = DateTime.UtcNow,
                CreatedBy      = "system",
                CreatedDateTime = DateTime.UtcNow
            };

            var result = await userManager.CreateAsync(user, TestPassword);
            if (result.Succeeded)
                _testUserId = user.Id;
        });
    }

    public ValueTask DisposeAsync()
    {
        _factory.Dispose();
        return ValueTask.CompletedTask;
    }

    private HttpClient AuthClient() =>
        _factory.CreateAuthenticatedClient(_testUserId, "sectest@example.com", "SystemAdministration");

    // ─── GET /api/auth/user ───────────────────────────────────────────────────

    [Fact]
    public async Task GetCurrentUser_WithValidIdentityUser_Returns200()
    {
        var client = AuthClient();
        var response = await client.GetAsync("/api/auth/user");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetCurrentUser_WithValidIdentityUser_ReturnsUserData()
    {
        var client = AuthClient();
        var response = await client.GetAsync("/api/auth/user");
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("sectest@example.com");
    }

    [Fact]
    public async Task GetCurrentUser_Unauthenticated_Returns401()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/auth/user");
        ((int)response.StatusCode).Should().BeOneOf(401, 403);
    }

    // ─── PUT /api/auth/profile ────────────────────────────────────────────────

    [Fact]
    public async Task UpdateProfile_WithValidData_Returns200()
    {
        var client = AuthClient();
        var request = new { firstName = "Updated", lastName = "Name" };
        var response = await client.PutAsJsonAsync("/api/auth/profile", request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task UpdateProfile_FirstNameOnly_Returns200()
    {
        var client = AuthClient();
        var request = new { firstName = "NewFirst" };
        var response = await client.PutAsJsonAsync("/api/auth/profile", request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task UpdateProfile_Unauthenticated_Returns401()
    {
        var client = _factory.CreateClient();
        var request = new { firstName = "Test" };
        var response = await client.PutAsJsonAsync("/api/auth/profile", request);
        ((int)response.StatusCode).Should().BeOneOf(401, 403);
    }

    // ─── POST /api/auth/password-change ──────────────────────────────────────

    [Fact]
    public async Task ChangePassword_WithCorrectCurrentPassword_Returns200()
    {
        var client = AuthClient();
        var request = new ChangePasswordRequest
        {
            CurrentPassword = TestPassword,
            NewPassword     = NewPassword,
            ConfirmPassword = NewPassword
        };
        var response = await client.PostAsJsonAsync("/api/auth/password-change", request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task ChangePassword_WithWrongCurrentPassword_Returns4xx()
    {
        var client = AuthClient();
        var request = new ChangePasswordRequest
        {
            CurrentPassword = "WrongPass!",
            NewPassword     = NewPassword,
            ConfirmPassword = NewPassword
        };
        var response = await client.PostAsJsonAsync("/api/auth/password-change", request);
        ((int)response.StatusCode).Should().BeOneOf(400, 401, 403, 422);
    }

    [Fact]
    public async Task ChangePassword_Unauthenticated_Returns401()
    {
        var client = _factory.CreateClient();
        var request = new ChangePasswordRequest
        {
            CurrentPassword = TestPassword,
            NewPassword     = NewPassword,
            ConfirmPassword = NewPassword
        };
        var response = await client.PostAsJsonAsync("/api/auth/password-change", request);
        ((int)response.StatusCode).Should().BeOneOf(401, 403);
    }

    // ─── POST /api/auth/logout ────────────────────────────────────────────────

    [Fact]
    public async Task Logout_WithValidCredentials_Returns200()
    {
        var client = AuthClient();
        var response = await client.PostAsync("/api/auth/logout", null);
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Logout_Unauthenticated_Returns401()
    {
        var client = _factory.CreateClient();
        var response = await client.PostAsync("/api/auth/logout", null);
        ((int)response.StatusCode).Should().BeOneOf(401, 403);
    }

    // ─── POST /api/administration/users/revoke-tokens ────────────────────────

    [Fact]
    public async Task RevokeUserTokens_WithValidUserId_Returns200OrNotFound()
    {
        var client = AuthClient();
        var request = new { userId = _testUserId, reason = "Test revoke" };
        var response = await client.PostAsJsonAsync("/api/administration/users/revoke-tokens", request);
        ((int)response.StatusCode).Should().BeOneOf(200, 404, 400);
    }
}
