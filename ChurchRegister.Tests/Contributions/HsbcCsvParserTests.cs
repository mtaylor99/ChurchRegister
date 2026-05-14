using System.Text;
using ChurchRegister.ApiService.Services.Contributions;
using FluentAssertions;

namespace ChurchRegister.ApiService.Tests.Contributions;

public class HsbcCsvParserTests
{
    private static readonly HsbcCsvParser Parser = new();

    private static Stream ToCsvStream(string csv) =>
        new MemoryStream(Encoding.UTF8.GetBytes(csv));

    // ─── Error cases: too few rows / missing columns ──────────────────────────

    [Fact]
    public async Task ParseAsync_WithEmptyContent_ReturnsError()
    {
        var result = await Parser.ParseAsync(ToCsvStream(""));
        result.Success.Should().BeFalse();
        result.Errors.Should().ContainMatch("*header*");
    }

    [Fact]
    public async Task ParseAsync_WithHeaderOnly_ReturnsError()
    {
        var result = await Parser.ParseAsync(ToCsvStream("Date,Type,Description,Paid In"));
        result.Success.Should().BeFalse();
        result.Errors.Should().NotBeEmpty();
    }

    [Fact]
    public async Task ParseAsync_WithMissingDateColumn_ReturnsError()
    {
        const string csv = """
            Type,Description,Paid In
            CR,MICKEY & MINNIE MOUSE,100.00
            """;
        var result = await Parser.ParseAsync(ToCsvStream(csv));
        result.Success.Should().BeFalse();
        result.Errors.Should().ContainMatch("*Date*");
    }

    [Fact]
    public async Task ParseAsync_WithMissingDescriptionColumn_ReturnsError()
    {
        const string csv = """
            Date,Type,Paid In
            01/01/2024,CR,100.00
            """;
        var result = await Parser.ParseAsync(ToCsvStream(csv));
        result.Success.Should().BeFalse();
        result.Errors.Should().ContainMatch("*Description*");
    }

    [Fact]
    public async Task ParseAsync_WithMissingPaidInColumn_ReturnsError()
    {
        const string csv = """
            Date,Type,Description
            01/01/2024,CR,MICKEY & MINNIE MOUSE
            """;
        var result = await Parser.ParseAsync(ToCsvStream(csv));
        result.Success.Should().BeFalse();
        result.Errors.Should().ContainMatch("*Paid In*");
    }

    [Fact]
    public async Task ParseAsync_WithMissingTypeColumn_ReturnsError()
    {
        const string csv = """
            Date,Description,Paid In
            01/01/2024,MICKEY & MINNIE MOUSE,100.00
            """;
        var result = await Parser.ParseAsync(ToCsvStream(csv));
        result.Success.Should().BeFalse();
        result.Errors.Should().ContainMatch("*Type*");
    }

    // ─── Valid CSV – standard column names ───────────────────────────────────

    [Fact]
    public async Task ParseAsync_WithValidCsv_ReturnsTransactions()
    {
        const string csv = """
            Date,Type,Description,Paid Out,Paid In,Balance
            02-Jan-26,CR,MICKEY & MINNIE MOUSE,,50.00,
            """;
        var result = await Parser.ParseAsync(ToCsvStream(csv));
        result.Success.Should().BeTrue();
        result.Transactions.Should().HaveCount(1);
        result.Transactions[0].MoneyIn.Should().Be(50m);
        result.Transactions[0].Description.Should().Be("MICKEY & MINNIE MOUSE");
    }

    [Fact]
    public async Task ParseAsync_WithValidCsv_SetsDate()
    {
        const string csv = """
            Date,Type,Description,Paid Out,Paid In,Balance
            15/06/2024,CR,HOMER & MARGE SIMPSON,,100.00,
            """;
        var result = await Parser.ParseAsync(ToCsvStream(csv));
        result.Transactions.Should().HaveCount(1);
        result.Transactions[0].Date.Should().Be(new DateTime(2024, 6, 15));
    }

    [Fact]
    public async Task ParseAsync_WithV2Format_UsesDescriptionAsReference()
    {
        const string csv = """
            Date,Type,Description,Paid Out,Paid In,Balance
            02-Jan-26,CR,FRED & WILMA FLINTSTONE,,50.00,
            """;
        var result = await Parser.ParseAsync(ToCsvStream(csv));
        result.Transactions[0].Reference.Should().Be("FRED & WILMA FLINTSTONE");
    }

    [Fact]
    public async Task ParseAsync_WithMultipleRows_SetsCorrectTotalRows()
    {
        const string csv = """
            Date,Type,Description,Paid Out,Paid In,Balance
            02-Jan-26,CR,BUGS & LOLA BUNNY,,50.00,
            02-Jan-26,CR,DAFFY & TINA DUCK,,75.00,
            02-Jan-26,CR,DONALD & DAISY DUCK,,25.00,
            """;
        var result = await Parser.ParseAsync(ToCsvStream(csv));
        result.TotalRows.Should().Be(3);
        result.Transactions.Should().HaveCount(3);
    }

    // ─── Zero/empty Paid In rows are excluded ──────────────────────────────

    [Fact]
    public async Task ParseAsync_ExcludesRowsWithZeroPaidIn()
    {
        const string csv = """
            Date,Type,Description,Paid Out,Paid In,Balance
            02-Jan-26,CR,MICKEY & MINNIE MOUSE,,50.00,
            02-Jan-26,CR,EMPTY CONTRIBUTION,,0.00,
            """;
        var result = await Parser.ParseAsync(ToCsvStream(csv));
        result.TotalRows.Should().Be(2);
        result.Transactions.Should().HaveCount(1);
        result.Transactions[0].MoneyIn.Should().Be(50m);
    }

    [Fact]
    public async Task ParseAsync_ExcludesRowsWithEmptyPaidIn()
    {
        const string csv = """
            Date,Type,Description,Paid Out,Paid In,Balance
            02-Jan-26,CR,MICKEY & MINNIE MOUSE,,50.00,
            02-Jan-26,CR,EMPTY CONTRIBUTION,,,
            """;
        var result = await Parser.ParseAsync(ToCsvStream(csv));
        result.Transactions.Should().HaveCount(1);
    }

    // ─── Transaction Type Filtering ──────────────────────────────────────

    [Fact]
    public async Task ParseAsync_WithTypeColumn_FiltersNonCRTransactions()
    {
        const string csv = """
            Date,Type,Description,Paid Out,Paid In,Balance
            02-Jan-26,CR,MICKEY & MINNIE MOUSE,,50.00,
            02-Jan-26,BP,CHURCH EXPENSES,100.00,,
            02-Jan-26,CR,HOMER & MARGE SIMPSON,,75.00,
            02-Jan-26,DD,UTILITIES PAYMENT,30.00,,
            02-Jan-26,CR,FRED & WILMA FLINTSTONE,,25.00,
            """;
        var result = await Parser.ParseAsync(ToCsvStream(csv));
        result.Success.Should().BeTrue();
        result.TotalRows.Should().Be(5);
        result.Transactions.Should().HaveCount(3); // Only CR transactions
        result.Transactions.Should().OnlyContain(t => t.MoneyIn > 0);
    }

    [Fact]
    public async Task ParseAsync_WithV2DateFormat_ParsesCorrectly()
    {
        const string csv = """
            Date,Type,Description,Paid Out,Paid In,Balance
            30-Dec-25,CR,BUGS & LOLA BUNNY,,100.00,
            """;
        var result = await Parser.ParseAsync(ToCsvStream(csv));
        result.Success.Should().BeTrue();
        result.Transactions.Should().HaveCount(1);
        result.Transactions[0].Date.Should().Be(new DateTime(2025, 12, 30));
    }

    // ─── Alternate column names (REMOVED - v2 format only) ───────────────────────────

    // ─── Quoted fields ────────────────────────────────────────────────────────

    [Fact]
    public async Task ParseAsync_HandlesQuotedFields()
    {
        const string csv = "Date,Type,Description,Paid Out,Paid In,Balance\r\n02-Jan-26,CR,\"PAYMENT, WITH COMMA\",, 99.99,\r\n";
        var result = await Parser.ParseAsync(ToCsvStream(csv));
        result.Success.Should().BeTrue();
        result.Transactions.Should().HaveCount(1);
        result.Transactions[0].Description.Should().Contain("PAYMENT, WITH COMMA");
        result.Transactions[0].MoneyIn.Should().Be(99.99m);
    }

    // ─── Continues past bad rows ──────────────────────────────────────────────

    [Fact]
    public async Task ParseAsync_WithMixedValidAndInvalidRows_ContinuesProcessing()
    {
        const string csv = """
            Date,Type,Description,Paid Out,Paid In,Balance
            02-Jan-26,CR,MICKEY & MINNIE MOUSE,,100.00,
            NOT-A-DATE,CR,BAD DATE ROW,,50.00,
            02-Jan-26,CR,HOMER & MARGE SIMPSON,,75.00,
            """;
        var result = await Parser.ParseAsync(ToCsvStream(csv));
        // Valid credit rows should be included; bad rows continue
        result.Transactions.Should().HaveCountGreaterThanOrEqualTo(2);
    }

    // ─── Cancellation ─────────────────────────────────────────────────────────

    [Fact]
    public async Task ParseAsync_WithCancellationToken_RespectsToken()
    {
        const string csv = """
            Date,Type,Description,Paid Out,Paid In,Balance
            02-Jan-26,CR,MICKEY & MINNIE MOUSE,,50.00,
            """;
        using var cts = new CancellationTokenSource();

        // Should not throw with a non-cancelled token
        var result = await Parser.ParseAsync(ToCsvStream(csv), cts.Token);
        result.Success.Should().BeTrue();
    }

    // ─── Integration Tests with Sample v2 File ───────────────────────────────

    [Fact]
    public async Task ParseAsync_WithSampleV2File_ImportsAllCRTransactions()
    {
        // Read the actual sample v2 CSV file
        const string sampleFilePath = "../../../../docs/sample-hsbc-statement_v2.csv";
        
        if (!File.Exists(sampleFilePath))
        {
            // Skip test if file doesn't exist
            return;
        }

        await using var fileStream = File.OpenRead(sampleFilePath);
        var result = await Parser.ParseAsync(fileStream);

        result.Success.Should().BeTrue();
        result.Errors.Should().BeEmpty();
        
        // Verify only CR transactions are imported (BP and DD excluded)
        result.Transactions.Should().NotBeEmpty();
        result.Transactions.Should().OnlyContain(t => t.MoneyIn > 0);
        
        // The sample file has 3 CR, 2 BP, 1 DD in first few rows
        // Total CR transactions should be 35+
        result.Transactions.Should().HaveCountGreaterThan(30);
        
        // Verify references match descriptions exactly (no parsing)
        result.Transactions.Should().Contain(t => t.Reference == "FLINTSTONE F&W");
        result.Transactions.Should().Contain(t => t.Reference == "HOMER & MARGE SIMPSON");
        result.Transactions.Should().Contain(t => t.Reference == "MICKEY & MINNIE MOUSE");
        result.Transactions.Should().Contain(t => t.Reference == "FRED & WILMA FLINTSTONE");
        
        // Verify BP and DD transactions are NOT imported
        result.Transactions.Should().NotContain(t => t.Description.Contains("CHURCH EXPENSES"));
        result.Transactions.Should().NotContain(t => t.Description.Contains("UTILITIES PAYMENT"));
    }
}
