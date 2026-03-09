using ChurchRegister.ApiService.Helpers;
using FluentAssertions;

namespace ChurchRegister.ApiService.Tests.Helpers;

public class SensitiveDataRedactorTests
{
    // ─── RedactEmail ──────────────────────────────────────────────────────────

    [Fact]
    public void RedactEmail_WithValidEmail_ShowsFirstCharAndDomain()
    {
        var result = SensitiveDataRedactor.RedactEmail("john.doe@example.com");
        result.Should().Be("j***@example.com");
    }

    [Fact]
    public void RedactEmail_WithSingleCharLocalPart_ReturnsRedacted()
    {
        var result = SensitiveDataRedactor.RedactEmail("a@test.com");
        result.Should().Be("a***@test.com");
    }

    [Fact]
    public void RedactEmail_WithNull_ReturnsEmpty()
    {
        SensitiveDataRedactor.RedactEmail(null).Should().Be("[empty]");
    }

    [Fact]
    public void RedactEmail_WithEmptyString_ReturnsEmpty()
    {
        SensitiveDataRedactor.RedactEmail("").Should().Be("[empty]");
    }

    [Fact]
    public void RedactEmail_WithWhitespace_ReturnsEmpty()
    {
        SensitiveDataRedactor.RedactEmail("   ").Should().Be("[empty]");
    }

    [Fact]
    public void RedactEmail_WithNoAtSign_ReturnsStars()
    {
        SensitiveDataRedactor.RedactEmail("notanemail").Should().Be("***");
    }

    [Fact]
    public void RedactEmail_WithAtAtStart_ReturnsStars()
    {
        SensitiveDataRedactor.RedactEmail("@example.com").Should().Be("***");
    }

    // ─── RedactToken ──────────────────────────────────────────────────────────

    [Fact]
    public void RedactToken_WithLongToken_ShowsFirstAndLastFour()
    {
        const string token = "eyJhbGciOiJIUzI1NiJ9.payload.signature123";
        var result = SensitiveDataRedactor.RedactToken(token);
        result.Should().StartWith(token[..4]);
        result.Should().EndWith(token[^4..]);
        result.Should().Contain("...");
    }

    [Fact]
    public void RedactToken_WithShortToken_ReturnsStars()
    {
        SensitiveDataRedactor.RedactToken("abc").Should().Be("***");
    }

    [Fact]
    public void RedactToken_WithExactlyEightChars_ReturnsStars()
    {
        SensitiveDataRedactor.RedactToken("12345678").Should().Be("***");
    }

    [Fact]
    public void RedactToken_WithNineChars_ShowsPartial()
    {
        var result = SensitiveDataRedactor.RedactToken("123456789");
        result.Should().Be("1234...6789");
    }

    [Fact]
    public void RedactToken_WithNull_ReturnsEmpty()
    {
        SensitiveDataRedactor.RedactToken(null).Should().Be("[empty]");
    }

    [Fact]
    public void RedactToken_WithEmptyString_ReturnsEmpty()
    {
        SensitiveDataRedactor.RedactToken("").Should().Be("[empty]");
    }

    // ─── RedactString ─────────────────────────────────────────────────────────

    [Fact]
    public void RedactString_DefaultTwoChars_ShowsFirstTwo()
    {
        var result = SensitiveDataRedactor.RedactString("SecretValue");
        result.Should().Be("Se***");
    }

    [Fact]
    public void RedactString_CustomVisibleChars_ShowsCorrectChars()
    {
        var result = SensitiveDataRedactor.RedactString("Password123", 4);
        result.Should().Be("Pass***");
    }

    [Fact]
    public void RedactString_WithShortValue_ReturnsStars()
    {
        SensitiveDataRedactor.RedactString("ab", 3).Should().Be("***");
    }

    [Fact]
    public void RedactString_WithNull_ReturnsEmpty()
    {
        SensitiveDataRedactor.RedactString(null).Should().Be("[empty]");
    }

    [Fact]
    public void RedactString_WithEmptyString_ReturnsEmpty()
    {
        SensitiveDataRedactor.RedactString("").Should().Be("[empty]");
    }

    // ─── RedactMessage ────────────────────────────────────────────────────────

    [Fact]
    public void RedactMessage_WithPlainText_ReturnsUnchanged()
    {
        var result = SensitiveDataRedactor.RedactMessage("Simple log message");
        result.Should().Be("Simple log message");
    }

    [Fact]
    public void RedactMessage_WithNull_ReturnsEmpty()
    {
        SensitiveDataRedactor.RedactMessage(null).Should().Be(string.Empty);
    }

    [Fact]
    public void RedactMessage_WithEmail_RedactsEmail()
    {
        var result = SensitiveDataRedactor.RedactMessage("User john@example.com logged in");
        result.Should().NotContain("john@example.com");
        result.Should().Contain("j***@example.com");
    }

    [Fact]
    public void RedactMessage_WithPasswordKeyValue_RedactsValue()
    {
        var result = SensitiveDataRedactor.RedactMessage("password=SuperSecret123");
        result.Should().NotContain("SuperSecret123");
        result.Should().Contain("[REDACTED]");
    }

    [Fact]
    public void RedactMessage_WithSecretKeyValue_RedactsValue()
    {
        var result = SensitiveDataRedactor.RedactMessage("secret: myTopSecret");
        result.Should().NotContain("myTopSecret");
        result.Should().Contain("[REDACTED]");
    }

    [Fact]
    public void RedactMessage_WithJwtToken_RedactsToken()
    {
        const string jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV";
        var result = SensitiveDataRedactor.RedactMessage($"Token is {jwt}");
        result.Should().NotContain(jwt);
        result.Should().Contain("[REDACTED]");
    }

    [Fact]
    public void RedactMessage_WithMultipleSensitiveItems_RedactsAll()
    {
        var result = SensitiveDataRedactor.RedactMessage(
            "Login for user@test.com with password=secret123");
        result.Should().NotContain("user@test.com");
        result.Should().NotContain("secret123");
    }

    [Fact]
    public void RedactMessage_WithEmptyString_ReturnsEmpty()
    {
        SensitiveDataRedactor.RedactMessage("").Should().Be("");
    }
}
