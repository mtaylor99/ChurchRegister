using ChurchRegister.ApiService.Exceptions;
using ChurchRegister.ApiService.Helpers;
using FluentAssertions;

namespace ChurchRegister.ApiService.Tests.Helpers;

public class ValidationHelpersTests
{
    // ─── RequireNonEmpty ──────────────────────────────────────────────────────

    [Fact]
    public void RequireNonEmpty_WithValue_DoesNotThrow()
    {
        var act = () => ValidationHelpers.RequireNonEmpty("hello", "Field");
        act.Should().NotThrow();
    }

    [Fact]
    public void RequireNonEmpty_WithNull_ThrowsValidationException()
    {
        var act = () => ValidationHelpers.RequireNonEmpty(null, "Field");
        act.Should().Throw<ValidationException>().WithMessage("*Field*");
    }

    [Fact]
    public void RequireNonEmpty_WithWhitespace_ThrowsValidationException()
    {
        var act = () => ValidationHelpers.RequireNonEmpty("   ", "MyField");
        act.Should().Throw<ValidationException>().WithMessage("*MyField*");
    }

    // ─── RequireNotNull ───────────────────────────────────────────────────────

    [Fact]
    public void RequireNotNull_WithValue_DoesNotThrow()
    {
        var act = () => ValidationHelpers.RequireNotNull(new object(), "Obj");
        act.Should().NotThrow();
    }

    [Fact]
    public void RequireNotNull_WithNull_ThrowsValidationException()
    {
        var act = () => ValidationHelpers.RequireNotNull<string>(null, "Obj");
        act.Should().Throw<ValidationException>().WithMessage("*Obj*");
    }

    // ─── RequireMinLength ─────────────────────────────────────────────────────

    [Fact]
    public void RequireMinLength_WhenMet_DoesNotThrow()
    {
        var act = () => ValidationHelpers.RequireMinLength("hello", 3, "Field");
        act.Should().NotThrow();
    }

    [Fact]
    public void RequireMinLength_WhenExact_DoesNotThrow()
    {
        var act = () => ValidationHelpers.RequireMinLength("abc", 3, "Field");
        act.Should().NotThrow();
    }

    [Fact]
    public void RequireMinLength_WhenTooShort_ThrowsValidationException()
    {
        var act = () => ValidationHelpers.RequireMinLength("ab", 5, "Password");
        act.Should().Throw<ValidationException>().WithMessage("*Password*5*");
    }

    [Fact]
    public void RequireMinLength_WithNull_ThrowsValidationException()
    {
        var act = () => ValidationHelpers.RequireMinLength(null, 1, "Field");
        act.Should().Throw<ValidationException>();
    }

    // ─── RequireMaxLength ─────────────────────────────────────────────────────

    [Fact]
    public void RequireMaxLength_WhenUnder_DoesNotThrow()
    {
        var act = () => ValidationHelpers.RequireMaxLength("hi", 10, "Field");
        act.Should().NotThrow();
    }

    [Fact]
    public void RequireMaxLength_WhenExact_DoesNotThrow()
    {
        var act = () => ValidationHelpers.RequireMaxLength("hello", 5, "Field");
        act.Should().NotThrow();
    }

    [Fact]
    public void RequireMaxLength_WhenOver_ThrowsValidationException()
    {
        var act = () => ValidationHelpers.RequireMaxLength("toolong", 3, "Name");
        act.Should().Throw<ValidationException>().WithMessage("*Name*3*");
    }

    [Fact]
    public void RequireMaxLength_WithNull_DoesNotThrow()
    {
        var act = () => ValidationHelpers.RequireMaxLength(null, 10, "Field");
        act.Should().NotThrow();
    }

    // ─── RequireValidEmail ────────────────────────────────────────────────────

    [Theory]
    [InlineData("user@example.com")]
    [InlineData("first.last@domain.co.uk")]
    [InlineData("user+tag@test.org")]
    public void RequireValidEmail_WithValidEmail_DoesNotThrow(string email)
    {
        var act = () => ValidationHelpers.RequireValidEmail(email);
        act.Should().NotThrow();
    }

    [Theory]
    [InlineData("notanemail")]
    [InlineData("missing@domain")]
    [InlineData("@nodomain.com")]
    public void RequireValidEmail_WithInvalidEmail_ThrowsValidationException(string email)
    {
        var act = () => ValidationHelpers.RequireValidEmail(email);
        act.Should().Throw<ValidationException>();
    }

    [Fact]
    public void RequireValidEmail_WithNull_ThrowsValidationException()
    {
        var act = () => ValidationHelpers.RequireValidEmail(null);
        act.Should().Throw<ValidationException>();
    }

    // ─── RequireValidUKPhone ──────────────────────────────────────────────────

    [Theory]
    [InlineData("07700900000")]
    [InlineData("+447700900000")]
    public void RequireValidUKPhone_WithValidPhone_DoesNotThrow(string phone)
    {
        var act = () => ValidationHelpers.RequireValidUKPhone(phone);
        act.Should().NotThrow();
    }

    [Fact]
    public void RequireValidUKPhone_WithNull_DoesNotThrow()
    {
        // Optional field
        var act = () => ValidationHelpers.RequireValidUKPhone(null);
        act.Should().NotThrow();
    }

    [Fact]
    public void RequireValidUKPhone_WithInvalidPhone_ThrowsValidationException()
    {
        var act = () => ValidationHelpers.RequireValidUKPhone("abc123");
        act.Should().Throw<ValidationException>();
    }

    // ─── RequirePositive ──────────────────────────────────────────────────────

    [Fact]
    public void RequirePositive_WithPositiveValue_DoesNotThrow()
    {
        var act = () => ValidationHelpers.RequirePositive(10m, "Amount");
        act.Should().NotThrow();
    }

    [Fact]
    public void RequirePositive_WithZero_ThrowsValidationException()
    {
        var act = () => ValidationHelpers.RequirePositive(0m, "Amount");
        act.Should().Throw<ValidationException>().WithMessage("*Amount*");
    }

    [Fact]
    public void RequirePositive_WithNegative_ThrowsValidationException()
    {
        var act = () => ValidationHelpers.RequirePositive(-1m, "Amount");
        act.Should().Throw<ValidationException>();
    }

    // ─── RequireNonNegative ───────────────────────────────────────────────────

    [Fact]
    public void RequireNonNegative_WithZero_DoesNotThrow()
    {
        var act = () => ValidationHelpers.RequireNonNegative(0m, "Field");
        act.Should().NotThrow();
    }

    [Fact]
    public void RequireNonNegative_WithNegative_ThrowsValidationException()
    {
        var act = () => ValidationHelpers.RequireNonNegative(-0.01m, "Field");
        act.Should().Throw<ValidationException>();
    }

    // ─── RequireNotFutureDate ─────────────────────────────────────────────────

    [Fact]
    public void RequireNotFutureDate_WithPastDate_DoesNotThrow()
    {
        var act = () => ValidationHelpers.RequireNotFutureDate(DateTime.UtcNow.AddDays(-1), "Date");
        act.Should().NotThrow();
    }

    [Fact]
    public void RequireNotFutureDate_WithFutureDate_ThrowsValidationException()
    {
        var act = () => ValidationHelpers.RequireNotFutureDate(DateTime.UtcNow.AddDays(1), "Date");
        act.Should().Throw<ValidationException>().WithMessage("*Date*future*");
    }

    [Fact]
    public void RequireNotFutureDate_WithNull_DoesNotThrow()
    {
        var act = () => ValidationHelpers.RequireNotFutureDate(null, "Date");
        act.Should().NotThrow();
    }

    // ─── RequireNotPastDate ───────────────────────────────────────────────────

    [Fact]
    public void RequireNotPastDate_WithFutureDate_DoesNotThrow()
    {
        var act = () => ValidationHelpers.RequireNotPastDate(DateTime.UtcNow.AddDays(1), "Date");
        act.Should().NotThrow();
    }

    [Fact]
    public void RequireNotPastDate_WithPastDate_ThrowsValidationException()
    {
        var act = () => ValidationHelpers.RequireNotPastDate(DateTime.UtcNow.AddDays(-1), "Date");
        act.Should().Throw<ValidationException>().WithMessage("*Date*past*");
    }

    // ─── RequireValidUKPostcode ───────────────────────────────────────────────

    [Theory]
    [InlineData("SW1A 1AA")]
    [InlineData("EC1A 1BB")]
    [InlineData("B1 1BB")]
    public void RequireValidUKPostcode_WithValidPostcode_DoesNotThrow(string postcode)
    {
        var act = () => ValidationHelpers.RequireValidUKPostcode(postcode);
        act.Should().NotThrow();
    }

    [Fact]
    public void RequireValidUKPostcode_WithNull_DoesNotThrow()
    {
        var act = () => ValidationHelpers.RequireValidUKPostcode(null);
        act.Should().NotThrow();
    }

    [Fact]
    public void RequireValidUKPostcode_WithInvalidPostcode_ThrowsValidationException()
    {
        var act = () => ValidationHelpers.RequireValidUKPostcode("NOTAPOSTCODE");
        act.Should().Throw<ValidationException>();
    }

    // ─── RequireValidBankReference ────────────────────────────────────────────

    [Fact]
    public void RequireValidBankReference_WithValidRef_DoesNotThrow()
    {
        var act = () => ValidationHelpers.RequireValidBankReference("REF-12345-ABC");
        act.Should().NotThrow();
    }

    [Fact]
    public void RequireValidBankReference_WithNull_DoesNotThrow()
    {
        var act = () => ValidationHelpers.RequireValidBankReference(null);
        act.Should().NotThrow();
    }

    [Fact]
    public void RequireValidBankReference_WithSpecialChars_ThrowsValidationException()
    {
        var act = () => ValidationHelpers.RequireValidBankReference("REF#123!");
        act.Should().Throw<ValidationException>();
    }

    // ─── RequireInRange ───────────────────────────────────────────────────────

    [Fact]
    public void RequireInRange_WhenInRange_DoesNotThrow()
    {
        var act = () => ValidationHelpers.RequireInRange(5, 1, 10, "Value");
        act.Should().NotThrow();
    }

    [Fact]
    public void RequireInRange_AtBoundary_DoesNotThrow()
    {
        var act = () => ValidationHelpers.RequireInRange(1, 1, 10, "Value");
        act.Should().NotThrow();
    }

    [Fact]
    public void RequireInRange_BelowMin_ThrowsValidationException()
    {
        var act = () => ValidationHelpers.RequireInRange(0, 1, 10, "Value");
        act.Should().Throw<ValidationException>().WithMessage("*Value*1*10*");
    }

    [Fact]
    public void RequireInRange_AboveMax_ThrowsValidationException()
    {
        var act = () => ValidationHelpers.RequireInRange(11, 1, 10, "Value");
        act.Should().Throw<ValidationException>();
    }

    // ─── RequireNonEmptyCollection ────────────────────────────────────────────

    [Fact]
    public void RequireNonEmptyCollection_WithItems_DoesNotThrow()
    {
        var act = () => ValidationHelpers.RequireNonEmptyCollection(new[] { 1, 2 }, "List");
        act.Should().NotThrow();
    }

    [Fact]
    public void RequireNonEmptyCollection_WithEmptyList_ThrowsValidationException()
    {
        var act = () => ValidationHelpers.RequireNonEmptyCollection(Array.Empty<int>(), "List");
        act.Should().Throw<ValidationException>().WithMessage("*List*");
    }

    [Fact]
    public void RequireNonEmptyCollection_WithNull_ThrowsValidationException()
    {
        var act = () => ValidationHelpers.RequireNonEmptyCollection<int>(null, "List");
        act.Should().Throw<ValidationException>();
    }

    // ─── RequireValidGuid ─────────────────────────────────────────────────────

    [Fact]
    public void RequireValidGuid_WithValidGuid_DoesNotThrow()
    {
        var act = () => ValidationHelpers.RequireValidGuid(Guid.NewGuid(), "Id");
        act.Should().NotThrow();
    }

    [Fact]
    public void RequireValidGuid_WithEmptyGuid_ThrowsValidationException()
    {
        var act = () => ValidationHelpers.RequireValidGuid(Guid.Empty, "Id");
        act.Should().Throw<ValidationException>().WithMessage("*Id*");
    }

    // ─── RequireValidPageSize ─────────────────────────────────────────────────

    [Fact]
    public void RequireValidPageSize_WithValidSize_DoesNotThrow()
    {
        var act = () => ValidationHelpers.RequireValidPageSize(25);
        act.Should().NotThrow();
    }

    [Fact]
    public void RequireValidPageSize_WithZero_ThrowsValidationException()
    {
        var act = () => ValidationHelpers.RequireValidPageSize(0);
        act.Should().Throw<ValidationException>().WithMessage("*at least 1*");
    }

    [Fact]
    public void RequireValidPageSize_ExceedsMax_ThrowsValidationException()
    {
        var act = () => ValidationHelpers.RequireValidPageSize(101);
        act.Should().Throw<ValidationException>().WithMessage("*100*");
    }

    [Fact]
    public void RequireValidPageSize_WithCustomMax_AllowsLargerSize()
    {
        var act = () => ValidationHelpers.RequireValidPageSize(500, 1000);
        act.Should().NotThrow();
    }

    // ─── RequireValidPageNumber ───────────────────────────────────────────────

    [Fact]
    public void RequireValidPageNumber_WithZero_DoesNotThrow()
    {
        var act = () => ValidationHelpers.RequireValidPageNumber(0);
        act.Should().NotThrow();
    }

    [Fact]
    public void RequireValidPageNumber_WithPositive_DoesNotThrow()
    {
        var act = () => ValidationHelpers.RequireValidPageNumber(5);
        act.Should().NotThrow();
    }

    [Fact]
    public void RequireValidPageNumber_WithNegative_ThrowsValidationException()
    {
        var act = () => ValidationHelpers.RequireValidPageNumber(-1);
        act.Should().Throw<ValidationException>().WithMessage("*zero or greater*");
    }

    // ─── SanitizeHtml ─────────────────────────────────────────────────────────

    [Fact]
    public void SanitizeHtml_WithPlainText_ReturnsUnchanged()
    {
        var result = ValidationHelpers.SanitizeHtml("Hello World");
        result.Should().Be("Hello World");
    }

    [Fact]
    public void SanitizeHtml_WithHtmlTags_StripsTheTags()
    {
        var result = ValidationHelpers.SanitizeHtml("<script>alert('xss')</script>Hello");
        result.Should().NotContain("<script>");
        result.Should().Contain("Hello");
    }

    [Fact]
    public void SanitizeHtml_WithNull_ReturnsEmpty()
    {
        var result = ValidationHelpers.SanitizeHtml(null);
        result.Should().Be(string.Empty);
    }

    [Fact]
    public void SanitizeHtml_WithWhitespace_ReturnsWhitespace()
    {
        // IsNullOrWhiteSpace early return preserves the raw whitespace input
        var result = ValidationHelpers.SanitizeHtml("   ");
        result.Should().BeNullOrWhiteSpace();
    }

    [Fact]
    public void SanitizeHtml_WithHtmlEntities_DecodesEntities()
    {
        var result = ValidationHelpers.SanitizeHtml("Tom &amp; Jerry");
        result.Should().Be("Tom & Jerry");
    }

    // ─── RequireNoHtml ────────────────────────────────────────────────────────

    [Fact]
    public void RequireNoHtml_WithPlainText_DoesNotThrow()
    {
        var act = () => ValidationHelpers.RequireNoHtml("Plain text", "Field");
        act.Should().NotThrow();
    }

    [Fact]
    public void RequireNoHtml_WithHtmlTags_ThrowsValidationException()
    {
        var act = () => ValidationHelpers.RequireNoHtml("<b>bold</b>", "Field");
        act.Should().Throw<ValidationException>().WithMessage("*Field*HTML*");
    }

    [Fact]
    public void RequireNoHtml_WithNull_DoesNotThrow()
    {
        var act = () => ValidationHelpers.RequireNoHtml(null, "Field");
        act.Should().NotThrow();
    }
}
