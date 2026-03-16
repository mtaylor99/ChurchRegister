using ChurchRegister.ApiService.Helpers;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Moq;

namespace ChurchRegister.ApiService.Tests.Helpers;

public class AuthCookieHelperTests
{
    private static Mock<IHostEnvironment> CreateDevEnv()
    {
        var mock = new Mock<IHostEnvironment>();
        mock.Setup(e => e.EnvironmentName).Returns("Development");
        return mock;
    }

    private static Mock<IHostEnvironment> CreateProdEnv()
    {
        var mock = new Mock<IHostEnvironment>();
        mock.Setup(e => e.EnvironmentName).Returns("Production");
        return mock;
    }

    // ─── Constants ────────────────────────────────────────────────────────────

    [Fact]
    public void AccessTokenCookieName_IsAccessToken()
    {
        AuthCookieHelper.AccessTokenCookieName.Should().Be("access_token");
    }

    [Fact]
    public void RefreshTokenCookieName_IsRefreshToken()
    {
        AuthCookieHelper.RefreshTokenCookieName.Should().Be("refresh_token");
    }

    // ─── GetAccessTokenCookieOptions ──────────────────────────────────────────

    [Fact]
    public void GetAccessTokenCookieOptions_IsHttpOnly()
    {
        var options = AuthCookieHelper.GetAccessTokenCookieOptions(CreateDevEnv().Object, 15);
        options.HttpOnly.Should().BeTrue();
    }

    [Fact]
    public void GetAccessTokenCookieOptions_InDevelopment_SecureIsFalse()
    {
        var options = AuthCookieHelper.GetAccessTokenCookieOptions(CreateDevEnv().Object, 15);
        options.Secure.Should().BeFalse();
    }

    [Fact]
    public void GetAccessTokenCookieOptions_InProduction_SecureIsTrue()
    {
        var options = AuthCookieHelper.GetAccessTokenCookieOptions(CreateProdEnv().Object, 15);
        options.Secure.Should().BeTrue();
    }

    [Fact]
    public void GetAccessTokenCookieOptions_SameSiteIsStrict()
    {
        var options = AuthCookieHelper.GetAccessTokenCookieOptions(CreateDevEnv().Object, 15);
        options.SameSite.Should().Be(SameSiteMode.Strict);
    }

    [Fact]
    public void GetAccessTokenCookieOptions_PathIsRoot()
    {
        var options = AuthCookieHelper.GetAccessTokenCookieOptions(CreateDevEnv().Object, 15);
        options.Path.Should().Be("/");
    }

    [Fact]
    public void GetAccessTokenCookieOptions_IsEssential()
    {
        var options = AuthCookieHelper.GetAccessTokenCookieOptions(CreateDevEnv().Object, 15);
        options.IsEssential.Should().BeTrue();
    }

    [Fact]
    public void GetAccessTokenCookieOptions_ExpiresInCorrectMinutes()
    {
        var before = DateTimeOffset.UtcNow.AddMinutes(14);
        var options = AuthCookieHelper.GetAccessTokenCookieOptions(CreateDevEnv().Object, 15);
        var after = DateTimeOffset.UtcNow.AddMinutes(16);
        options.Expires.Should().BeAfter(before).And.BeBefore(after);
    }

    // ─── GetRefreshTokenCookieOptions ─────────────────────────────────────────

    [Fact]
    public void GetRefreshTokenCookieOptions_IsHttpOnly()
    {
        var options = AuthCookieHelper.GetRefreshTokenCookieOptions(CreateDevEnv().Object, 7);
        options.HttpOnly.Should().BeTrue();
    }

    [Fact]
    public void GetRefreshTokenCookieOptions_InDevelopment_SecureIsFalse()
    {
        var options = AuthCookieHelper.GetRefreshTokenCookieOptions(CreateDevEnv().Object, 7);
        options.Secure.Should().BeFalse();
    }

    [Fact]
    public void GetRefreshTokenCookieOptions_InProduction_SecureIsTrue()
    {
        var options = AuthCookieHelper.GetRefreshTokenCookieOptions(CreateProdEnv().Object, 7);
        options.Secure.Should().BeTrue();
    }

    [Fact]
    public void GetRefreshTokenCookieOptions_SameSiteIsStrict()
    {
        var options = AuthCookieHelper.GetRefreshTokenCookieOptions(CreateDevEnv().Object, 7);
        options.SameSite.Should().Be(SameSiteMode.Strict);
    }

    [Fact]
    public void GetRefreshTokenCookieOptions_ExpiresInCorrectDays()
    {
        var before = DateTimeOffset.UtcNow.AddDays(6);
        var options = AuthCookieHelper.GetRefreshTokenCookieOptions(CreateDevEnv().Object, 7);
        var after = DateTimeOffset.UtcNow.AddDays(8);
        options.Expires.Should().BeAfter(before).And.BeBefore(after);
    }

    // ─── GetExpiredCookieOptions ──────────────────────────────────────────────

    [Fact]
    public void GetExpiredCookieOptions_ExpiresInThePast()
    {
        var options = AuthCookieHelper.GetExpiredCookieOptions(CreateDevEnv().Object);
        options.Expires.Should().BeBefore(DateTimeOffset.UtcNow);
    }

    [Fact]
    public void GetExpiredCookieOptions_IsHttpOnly()
    {
        var options = AuthCookieHelper.GetExpiredCookieOptions(CreateDevEnv().Object);
        options.HttpOnly.Should().BeTrue();
    }

    [Fact]
    public void GetExpiredCookieOptions_IsEssential()
    {
        var options = AuthCookieHelper.GetExpiredCookieOptions(CreateDevEnv().Object);
        options.IsEssential.Should().BeTrue();
    }

    // ─── SetAuthCookies ───────────────────────────────────────────────────────

    [Fact]
    public void SetAuthCookies_AppendsBothCookies()
    {
        var context = new DefaultHttpContext();
        AuthCookieHelper.SetAuthCookies(
            context.Response,
            CreateDevEnv().Object,
            "access-token-value",
            "refresh-token-value",
            15,
            7);

        // Verify cookies were set (headers contain Set-Cookie)
        context.Response.Headers.Should().ContainKey("Set-Cookie");
        var setCookieHeaders = context.Response.Headers["Set-Cookie"].ToArray();
        var allCookies = string.Join("; ", setCookieHeaders);
        allCookies.Should().Contain("access_token");
        allCookies.Should().Contain("refresh_token");
    }

    // ─── ClearAuthCookies ─────────────────────────────────────────────────────

    [Fact]
    public void ClearAuthCookies_AppendsBothExpiredCookies()
    {
        var context = new DefaultHttpContext();
        AuthCookieHelper.ClearAuthCookies(context.Response, CreateDevEnv().Object);

        context.Response.Headers.Should().ContainKey("Set-Cookie");
        var setCookieHeaders = context.Response.Headers["Set-Cookie"].ToArray();
        var allCookies = string.Join("; ", setCookieHeaders);
        allCookies.Should().Contain("access_token");
        allCookies.Should().Contain("refresh_token");
    }
}
