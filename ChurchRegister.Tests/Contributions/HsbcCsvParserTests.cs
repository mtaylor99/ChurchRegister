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
        var result = await Parser.ParseAsync(ToCsvStream("Date,Description,Money In"));
        result.Success.Should().BeFalse();
        result.Errors.Should().NotBeEmpty();
    }

    [Fact]
    public async Task ParseAsync_WithMissingDateColumn_ReturnsError()
    {
        const string csv = """
            Description,Money In
            Payment REF X123,100.00
            """;
        var result = await Parser.ParseAsync(ToCsvStream(csv));
        result.Success.Should().BeFalse();
        result.Errors.Should().ContainMatch("*Date*");
    }

    [Fact]
    public async Task ParseAsync_WithMissingDescriptionColumn_ReturnsError()
    {
        const string csv = """
            Date,Money In
            01/01/2024,100.00
            """;
        var result = await Parser.ParseAsync(ToCsvStream(csv));
        result.Success.Should().BeFalse();
        result.Errors.Should().ContainMatch("*Description*");
    }

    [Fact]
    public async Task ParseAsync_WithMissingMoneyInColumn_ReturnsError()
    {
        const string csv = """
            Date,Description
            01/01/2024,PAYMENT REF TITHE-001
            """;
        var result = await Parser.ParseAsync(ToCsvStream(csv));
        result.Success.Should().BeFalse();
        result.Errors.Should().ContainMatch("*Money In*");
    }

    // ─── Valid CSV – standard column names ───────────────────────────────────

    [Fact]
    public async Task ParseAsync_WithValidCsv_ReturnsTransactions()
    {
        const string csv = """
            Date,Description,Money In
            01/01/2024,PAYMENT REF TITHE-001,50.00
            """;
        var result = await Parser.ParseAsync(ToCsvStream(csv));
        result.Success.Should().BeTrue();
        result.Transactions.Should().HaveCount(1);
        result.Transactions[0].MoneyIn.Should().Be(50m);
        result.Transactions[0].Description.Should().Be("PAYMENT REF TITHE-001");
    }

    [Fact]
    public async Task ParseAsync_WithValidCsv_SetsDate()
    {
        const string csv = """
            Date,Description,Money In
            15/06/2024,PAYMENT REF TITHE-001,100.00
            """;
        var result = await Parser.ParseAsync(ToCsvStream(csv));
        result.Transactions.Should().HaveCount(1);
        result.Transactions[0].Date.Should().Be(new DateTime(2024, 6, 15));
    }

    [Fact]
    public async Task ParseAsync_ExtractsReferenceFromDescription()
    {
        const string csv = """
            Date,Description,Money In
            01/01/2024,FASTER PAYMENT REF TITHE-JUNE-2024 VIA BACS,50.00
            """;
        var result = await Parser.ParseAsync(ToCsvStream(csv));
        result.Transactions[0].Reference.Should().Be("TITHE-JUNE-2024");
    }

    [Fact]
    public async Task ParseAsync_WithMultipleRows_SetsCorrectTotalRows()
    {
        const string csv = """
            Date,Description,Money In
            01/01/2024,PAYMENT REF A,50.00
            02/01/2024,PAYMENT REF B,75.00
            03/01/2024,PAYMENT REF C,25.00
            """;
        var result = await Parser.ParseAsync(ToCsvStream(csv));
        result.TotalRows.Should().Be(3);
        result.Transactions.Should().HaveCount(3);
    }

    // ─── Zero/empty MoneyIn rows are excluded ────────────────────────────────

    [Fact]
    public async Task ParseAsync_ExcludesRowsWithZeroMoneyIn()
    {
        const string csv = """
            Date,Description,Money In
            01/01/2024,CREDIT REF A,50.00
            02/01/2024,DEBIT REF B,0.00
            """;
        var result = await Parser.ParseAsync(ToCsvStream(csv));
        result.TotalRows.Should().Be(2);
        result.Transactions.Should().HaveCount(1);
        result.Transactions[0].MoneyIn.Should().Be(50m);
    }

    [Fact]
    public async Task ParseAsync_ExcludesRowsWithEmptyMoneyIn()
    {
        const string csv = """
            Date,Description,Money In
            01/01/2024,CREDIT REF A,50.00
            02/01/2024,DEBIT REF B,
            """;
        var result = await Parser.ParseAsync(ToCsvStream(csv));
        result.Transactions.Should().HaveCount(1);
    }

    // ─── Alternate column names ───────────────────────────────────────────────

    [Fact]
    public async Task ParseAsync_AcceptsTransactionDateColumnName()
    {
        const string csv = """
            Transaction Date,Description,Money In
            01/01/2024,PAYMENT REF ALT-DATE,100.00
            """;
        var result = await Parser.ParseAsync(ToCsvStream(csv));
        result.Success.Should().BeTrue();
        result.Transactions.Should().HaveCount(1);
    }

    [Fact]
    public async Task ParseAsync_AcceptsTransactionDescriptionColumnName()
    {
        const string csv = """
            Date,Transaction Description,Money In
            01/01/2024,PAYMENT REF ALT-DESC,100.00
            """;
        var result = await Parser.ParseAsync(ToCsvStream(csv));
        result.Success.Should().BeTrue();
        result.Transactions.Should().HaveCount(1);
    }

    [Fact]
    public async Task ParseAsync_AcceptsCreditAmountColumnName()
    {
        const string csv = """
            Date,Description,Credit Amount
            01/01/2024,PAYMENT REF CREDIT-COL,200.00
            """;
        var result = await Parser.ParseAsync(ToCsvStream(csv));
        result.Success.Should().BeTrue();
        result.Transactions.Should().HaveCount(1);
        result.Transactions[0].MoneyIn.Should().Be(200m);
    }

    [Fact]
    public async Task ParseAsync_AcceptsCreditColumnName()
    {
        const string csv = """
            Date,Description,Credit
            01/01/2024,PAYMENT REF CREDIT,75.50
            """;
        var result = await Parser.ParseAsync(ToCsvStream(csv));
        result.Success.Should().BeTrue();
        result.Transactions.Should().HaveCount(1);
        result.Transactions[0].MoneyIn.Should().Be(75.50m);
    }

    // ─── Quoted fields ────────────────────────────────────────────────────────

    [Fact]
    public async Task ParseAsync_HandlesQuotedFields()
    {
        const string csv = "Date,Description,Money In\r\n01/01/2024,\"PAYMENT, WITH COMMA REF QUOTED-REF\",99.99\r\n";
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
            Date,Description,Money In
            01/01/2024,PAYMENT REF GOOD-001,100.00
            NOT-A-DATE,PAYMENT REF BAD-DATE,50.00
            02/01/2024,PAYMENT REF GOOD-002,75.00
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
            Date,Description,Money In
            01/01/2024,PAYMENT REF A,50.00
            """;
        using var cts = new CancellationTokenSource();

        // Should not throw with a non-cancelled token
        var result = await Parser.ParseAsync(ToCsvStream(csv), cts.Token);
        result.Success.Should().BeTrue();
    }
}
