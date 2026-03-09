using ChurchRegister.ApiService.Services.Contributions;
using FluentAssertions;

namespace ChurchRegister.ApiService.Tests.Contributions;

public class HsbcReferenceExtractorTests
{
    // ─── Empty / null input ───────────────────────────────────────────────────

    [Fact]
    public void ExtractReference_WithNull_ReturnsEmptyString()
    {
        HsbcReferenceExtractor.ExtractReference(null!).Should().Be(string.Empty);
    }

    [Fact]
    public void ExtractReference_WithEmptyString_ReturnsEmptyString()
    {
        HsbcReferenceExtractor.ExtractReference("").Should().Be(string.Empty);
    }

    [Fact]
    public void ExtractReference_WithWhitespace_ReturnsEmptyString()
    {
        HsbcReferenceExtractor.ExtractReference("   ").Should().Be(string.Empty);
    }

    // ─── No REF marker ────────────────────────────────────────────────────────

    [Fact]
    public void ExtractReference_WithNoRefMarker_ReturnsEmptyString()
    {
        HsbcReferenceExtractor.ExtractReference("DIRECT DEBIT PAYMENT").Should().Be(string.Empty);
    }

    [Fact]
    public void ExtractReference_WithPartialRef_ReturnsEmptyString()
    {
        HsbcReferenceExtractor.ExtractReference("PAYMENT REF").Should().Be(string.Empty);
    }

    // ─── Basic extraction ─────────────────────────────────────────────────────

    [Fact]
    public void ExtractReference_WithSimpleRef_ReturnsReference()
    {
        HsbcReferenceExtractor.ExtractReference("FASTER PAYMENT REF TITHE-2024-001")
            .Should().Be("TITHE-2024-001");
    }

    [Fact]
    public void ExtractReference_WithRefAtStart_ReturnsReference()
    {
        HsbcReferenceExtractor.ExtractReference(" REF MYMEMREF")
            .Should().Be("MYMEMREF");
    }

    [Fact]
    public void ExtractReference_IsCaseInsensitiveOnMarker()
    {
        HsbcReferenceExtractor.ExtractReference("PAYMENT ref OFFERING-123")
            .Should().Be("OFFERING-123");
    }

    [Fact]
    public void ExtractReference_TrimsWhitespaceAroundRef()
    {
        HsbcReferenceExtractor.ExtractReference("PAYMENT REF   TRIMMED-REF   ")
            .Should().Be("TRIMMED-REF");
    }

    // ─── Trailing token trimming ───────────────────────────────────────────────

    [Fact]
    public void ExtractReference_RemovesViaToken()
    {
        HsbcReferenceExtractor.ExtractReference("PAYMENT REF TITHE-001 VIA BACS")
            .Should().Be("TITHE-001");
    }

    [Fact]
    public void ExtractReference_RemovesOnlineBankingToken()
    {
        HsbcReferenceExtractor.ExtractReference("PAYMENT REF OFFERING-05 ONLINE BANKING")
            .Should().Be("OFFERING-05");
    }

    [Fact]
    public void ExtractReference_RemovesMobileAppToken()
    {
        HsbcReferenceExtractor.ExtractReference("PAYMENT REF GIFT-007 MOBILE APP")
            .Should().Be("GIFT-007");
    }

    [Fact]
    public void ExtractReference_RemovesOnToken()
    {
        HsbcReferenceExtractor.ExtractReference("PAYMENT REF ENV-042 ON 01JAN2024")
            .Should().Be("ENV-042");
    }

    [Fact]
    public void ExtractReference_RemovesAtToken()
    {
        HsbcReferenceExtractor.ExtractReference("PAYMENT REF PLEDGE-2024 AT BRANCH")
            .Should().Be("PLEDGE-2024");
    }

    [Fact]
    public void ExtractReference_TrailingTokensAreCaseInsensitive()
    {
        HsbcReferenceExtractor.ExtractReference("PAYMENT REF MYREF via online")
            .Should().Be("MYREF");
    }

    // ─── 100-char truncation ──────────────────────────────────────────────────

    [Fact]
    public void ExtractReference_WithLongRef_TruncatesTo100Chars()
    {
        var longRef = new string('A', 150);
        var result = HsbcReferenceExtractor.ExtractReference($"PAYMENT REF {longRef}");
        result.Should().HaveLength(100);
        result.Should().Be(new string('A', 100));
    }

    [Fact]
    public void ExtractReference_WithExactly100CharRef_IsNotTruncated()
    {
        var exactRef = new string('B', 100);
        var result = HsbcReferenceExtractor.ExtractReference($"PAYMENT REF {exactRef}");
        result.Should().HaveLength(100);
    }

    [Fact]
    public void ExtractReference_WithShorterThan100CharRef_IsNotTruncated()
    {
        var shortRef = "SHORT-REF";
        var result = HsbcReferenceExtractor.ExtractReference($"PAYMENT REF {shortRef}");
        result.Should().Be(shortRef);
    }

    // ─── Real-world HSBC description formats ─────────────────────────────────

    [Fact]
    public void ExtractReference_WithTypicalHsbcFormat_ExtractsCorrectly()
    {
        var result = HsbcReferenceExtractor.ExtractReference(
            "FASTER PAYMENTS RECEIPT REF TITHE-JUNE-2024 VIA BACS");
        result.Should().Be("TITHE-JUNE-2024");
    }

    [Fact]
    public void ExtractReference_WithMobilePayment_ExtractsCorrectly()
    {
        var result = HsbcReferenceExtractor.ExtractReference(
            "ONLINE BANKING PAYMENT REF ENV-NUMBER-42 MOBILE APP");
        result.Should().Be("ENV-NUMBER-42");
    }
}
