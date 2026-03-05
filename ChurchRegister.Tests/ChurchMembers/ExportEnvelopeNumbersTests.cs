using ChurchRegister.ApiService.UseCase.ChurchMembers.ExportEnvelopeNumbers;
using ChurchRegister.Database.Data;
using ChurchRegister.Database.Entities;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using OfficeOpenXml;

namespace ChurchRegister.ApiService.Tests.ChurchMembers;

public class ExportEnvelopeNumbersTests : IDisposable
{
    private readonly ChurchRegisterWebContext _context;
    private readonly Mock<ILogger<ExportEnvelopeNumbersUseCase>> _logger;

    public ExportEnvelopeNumbersTests()
    {
        var options = new DbContextOptionsBuilder<ChurchRegisterWebContext>()
            .UseInMemoryDatabase($"ExportEnvelopeNumberTests_{Guid.NewGuid()}")
            .Options;

        _context = new ChurchRegisterWebContext(options);
        _logger = new Mock<ILogger<ExportEnvelopeNumbersUseCase>>();

        SeedStatuses();
    }

    private void SeedStatuses()
    {
        _context.ChurchMemberStatuses.Add(
            new ChurchMemberStatus { Id = 1, Name = "Active", CreatedBy = "system", CreatedDateTime = DateTime.UtcNow });
        _context.SaveChanges();
    }

    private ExportEnvelopeNumbersUseCase CreateUseCase() =>
        new(_context, _logger.Object);

    private static ExcelWorksheet ReadWorksheet(byte[] bytes, string sheetName)
    {
        ExcelPackage.License.SetNonCommercialPersonal("ChurchRegister");
        var package = new ExcelPackage(new MemoryStream(bytes));
        return package.Workbook.Worksheets[sheetName]
               ?? throw new InvalidOperationException($"Worksheet '{sheetName}' not found.");
    }

    // ─── Bank Reference Exclusion ─────────────────────────────────────────────

    [Fact]
    public async Task MemberWithBankReference_IsAbsentFromOutput()
    {
        _context.ChurchMembers.Add(new ChurchMember
        {
            Id = 1, FirstName = "Alex", LastName = "Turner",
            ChurchMemberStatusId = 1, BankReference = "BANKREF01",
            CreatedBy = "system", CreatedDateTime = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        var bytes = await CreateUseCase().ExecuteAsync(2026, CancellationToken.None);

        var ws = ReadWorksheet(bytes, "2026");
        // Only header row; no data rows — Dimension is null (empty sheet) or has only 1 row
        var rowCount = ws.Dimension?.Rows ?? 0;
        rowCount.Should().BeLessThanOrEqualTo(1);
    }

    // ─── New Number Blank When Not Generated ─────────────────────────────────

    [Fact]
    public async Task WhenNoRegisterNumbersForYear_NewNumberCellIsBlank()
    {
        _context.ChurchMembers.Add(new ChurchMember
        {
            Id = 1, FirstName = "Beth", LastName = "Clark",
            ChurchMemberStatusId = 1, BankReference = null,
            CreatedBy = "system", CreatedDateTime = DateTime.UtcNow
        });
        // No register numbers at all
        await _context.SaveChangesAsync();

        var bytes = await CreateUseCase().ExecuteAsync(2026, CancellationToken.None);

        var ws = ReadWorksheet(bytes, "2026");
        // Row 2 = first data row. Column E = New Number
        var newNumber = ws.Cells[2, 5].Value;
        newNumber.Should().BeNull();
    }

    // ─── Both Years Populated ─────────────────────────────────────────────────

    [Fact]
    public async Task MemberWithNumbersInBothYears_BothCellsPopulated()
    {
        _context.ChurchMembers.Add(new ChurchMember
        {
            Id = 1, FirstName = "Chris", LastName = "Evans",
            ChurchMemberStatusId = 1, BankReference = null, Envelopes = true,
            CreatedBy = "system", CreatedDateTime = DateTime.UtcNow
        });
        // Current year (2025) = 42, New year (2026) = 50
        _context.ChurchMemberRegisterNumbers.AddRange(
            new ChurchMemberRegisterNumber { Id = 1, ChurchMemberId = 1, Number = 42, Year = 2025, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow },
            new ChurchMemberRegisterNumber { Id = 2, ChurchMemberId = 1, Number = 50, Year = 2026, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        var bytes = await CreateUseCase().ExecuteAsync(2026, CancellationToken.None);

        var ws = ReadWorksheet(bytes, "2026");
        ws.Cells[2, 4].Value.Should().Be("42"); // Current Number (D)
        ws.Cells[2, 5].Value.Should().Be("50"); // New Number (E)
    }

    // ─── No Current-Year Number ───────────────────────────────────────────────

    [Fact]
    public async Task MemberWithNoCurrentYearNumber_CurrentNumberCellIsBlank()
    {
        _context.ChurchMembers.Add(new ChurchMember
        {
            Id = 1, FirstName = "Diana", LastName = "Prince",
            ChurchMemberStatusId = 1, BankReference = null, Envelopes = true,
            CreatedBy = "system", CreatedDateTime = DateTime.UtcNow
        });
        // Only new year (2026) number; no current year (2025) number
        _context.ChurchMemberRegisterNumbers.Add(
            new ChurchMemberRegisterNumber { Id = 1, ChurchMemberId = 1, Number = 7, Year = 2026, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        var bytes = await CreateUseCase().ExecuteAsync(2026, CancellationToken.None);

        var ws = ReadWorksheet(bytes, "2026");
        ws.Cells[2, 4].Value.Should().BeNull(); // Current Number (D) blank
        ws.Cells[2, 5].Value.Should().Be("7");  // New Number (E) populated
    }

    // ─── Worksheet Tab Name ───────────────────────────────────────────────────

    [Fact]
    public async Task WorksheetTabName_EqualsSelectedYearAsString()
    {
        _context.ChurchMembers.Add(new ChurchMember
        {
            Id = 1, FirstName = "Eddie", LastName = "Redmayne",
            ChurchMemberStatusId = 1, BankReference = null,
            CreatedBy = "system", CreatedDateTime = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        var bytes = await CreateUseCase().ExecuteAsync(2027, CancellationToken.None);

        ExcelPackage.License.SetNonCommercialPersonal("ChurchRegister");
        using var package = new ExcelPackage(new MemoryStream(bytes));
        package.Workbook.Worksheets.Should().ContainSingle(ws => ws.Name == "2027");
    }

    public void Dispose() => _context.Dispose();
}
