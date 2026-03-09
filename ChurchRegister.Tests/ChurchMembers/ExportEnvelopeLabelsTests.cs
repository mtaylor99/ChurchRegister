using System.Text;
using ChurchRegister.ApiService.Services.Labels;
using ChurchRegister.ApiService.UseCase.ChurchMembers.ExportEnvelopeLabels;
using ChurchRegister.Database.Data;
using ChurchRegister.Database.Entities;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;

namespace ChurchRegister.ApiService.Tests.ChurchMembers;

public class ExportEnvelopeLabelsTests : IDisposable
{
    private readonly ChurchRegisterWebContext _context;
    private readonly Mock<ILabelPdfService> _mockLabelPdfService;
    private readonly Mock<ILogger<ExportEnvelopeLabelsUseCase>> _logger;
    private static readonly byte[] DummyPdf = "FAKEPDF"u8.ToArray();

    public ExportEnvelopeLabelsTests()
    {
        var options = new DbContextOptionsBuilder<ChurchRegisterWebContext>()
            .UseInMemoryDatabase($"ExportEnvelopeLabelTests_{Guid.NewGuid()}")
            .Options;

        _context = new ChurchRegisterWebContext(options);
        _mockLabelPdfService = new Mock<ILabelPdfService>();
        _logger = new Mock<ILogger<ExportEnvelopeLabelsUseCase>>();

        // Default mock response
        _mockLabelPdfService
            .Setup(s => s.GenerateLabels(It.IsAny<IReadOnlyList<LabelData>>()))
            .Returns(DummyPdf);

        SeedStatuses();
    }

    private void SeedStatuses()
    {
        _context.ChurchMemberStatuses.Add(
            new ChurchMemberStatus { Id = 1, Name = "Active", CreatedBy = "system", CreatedDateTime = DateTime.UtcNow });
        _context.ChurchMemberStatuses.Add(
            new ChurchMemberStatus { Id = 2, Name = "Inactive", CreatedBy = "system", CreatedDateTime = DateTime.UtcNow });
        _context.SaveChanges();
    }

    private ExportEnvelopeLabelsUseCase CreateUseCase() =>
        new(_context, _mockLabelPdfService.Object, _logger.Object);

    // ─── Filtering ────────────────────────────────────────────────────────────

    [Fact]
    public async Task MemberWithBankReference_IsExcludedFromEnvelopeLabels()
    {
        // Arrange — this member has a bank reference (direct debit), so is NOT an envelope recipient
        _context.ChurchMembers.Add(new ChurchMember
        {
            Id = 1, FirstName = "Alice", LastName = "Smith",
            ChurchMemberStatusId = 1, BankReference = "REF001",
            CreatedBy = "system", CreatedDateTime = DateTime.UtcNow
        });
        _context.ChurchMemberRegisterNumbers.Add(new ChurchMemberRegisterNumber
        {
            Id = 1, ChurchMemberId = 1, Number = 10, Year = 2026,
            CreatedBy = "system", CreatedDateTime = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        // Act
        await CreateUseCase().ExecuteAsync(2026, CancellationToken.None);

        // Assert — service called with empty list
        _mockLabelPdfService.Verify(s =>
            s.GenerateLabels(It.Is<IReadOnlyList<LabelData>>(l => l.Count == 0)), Times.Once);
    }

    [Fact]
    public async Task InactiveMember_IsExcludedFromEnvelopeLabels()
    {
        // Arrange — status 2 = Inactive
        _context.ChurchMembers.Add(new ChurchMember
        {
            Id = 1, FirstName = "Bob", LastName = "Jones",
            ChurchMemberStatusId = 2, BankReference = null,
            CreatedBy = "system", CreatedDateTime = DateTime.UtcNow
        });
        _context.ChurchMemberRegisterNumbers.Add(new ChurchMemberRegisterNumber
        {
            Id = 1, ChurchMemberId = 1, Number = 5, Year = 2026,
            CreatedBy = "system", CreatedDateTime = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        await CreateUseCase().ExecuteAsync(2026, CancellationToken.None);

        _mockLabelPdfService.Verify(s =>
            s.GenerateLabels(It.Is<IReadOnlyList<LabelData>>(l => l.Count == 0)), Times.Once);
    }

    // ─── Ordering ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task MembersAreOrderedByRegisterNumberAscending()
    {
        // Arrange — add 3 members with non-sequential register numbers
        for (int i = 1; i <= 3; i++)
        {
            _context.ChurchMembers.Add(new ChurchMember
            {
                Id = i, FirstName = $"First{i}", LastName = $"Last{i}",
                ChurchMemberStatusId = 1, BankReference = null, Envelopes = true,
                CreatedBy = "system", CreatedDateTime = DateTime.UtcNow
            });
        }

        // Numbers: member 1 → 30, member 2 → 10, member 3 → 20
        _context.ChurchMemberRegisterNumbers.AddRange(
            new ChurchMemberRegisterNumber { Id = 1, ChurchMemberId = 1, Number = 30, Year = 2026, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow },
            new ChurchMemberRegisterNumber { Id = 2, ChurchMemberId = 2, Number = 10, Year = 2026, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow },
            new ChurchMemberRegisterNumber { Id = 3, ChurchMemberId = 3, Number = 20, Year = 2026, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        IReadOnlyList<LabelData>? captured = null;
        _mockLabelPdfService
            .Setup(s => s.GenerateLabels(It.IsAny<IReadOnlyList<LabelData>>()))
            .Callback<IReadOnlyList<LabelData>>(l => captured = l)
            .Returns(DummyPdf);

        await CreateUseCase().ExecuteAsync(2026, CancellationToken.None);

        captured.Should().NotBeNull();
        captured!.Count.Should().Be(3);
        captured[0].Line5.Should().Be("10");
        captured[1].Line5.Should().Be("20");
        captured[2].Line5.Should().Be("30");
    }

    // ─── Exclusion with warning ───────────────────────────────────────────────

    [Fact]
    public async Task MemberWithNoRegisterNumberForYear_IsExcluded()
    {
        // Arrange — member exists but has no register number for 2026
        _context.ChurchMembers.Add(new ChurchMember
        {
            Id = 1, FirstName = "Carol", LastName = "White",
            ChurchMemberStatusId = 1, BankReference = null,
            CreatedBy = "system", CreatedDateTime = DateTime.UtcNow
        });
        // Register number for a different year (2025), not 2026
        _context.ChurchMemberRegisterNumbers.Add(new ChurchMemberRegisterNumber
        {
            Id = 1, ChurchMemberId = 1, Number = 5, Year = 2025,
            CreatedBy = "system", CreatedDateTime = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        await CreateUseCase().ExecuteAsync(2026, CancellationToken.None);

        // Member excluded from labels
        _mockLabelPdfService.Verify(s =>
            s.GenerateLabels(It.Is<IReadOnlyList<LabelData>>(l => l.Count == 0)), Times.Once);
    }

    // ─── Page count (uses real LabelPdfService) ───────────────────────────────

    [Fact]
    public async Task FourteenMembers_ProduceOnePage()
    {
        await AddMembersWithRegisterNumbers(count: 14, startYear: 2026);

        var useCase = new ExportEnvelopeLabelsUseCase(_context, new LabelPdfService(), _logger.Object);
        var pdfBytes = await useCase.ExecuteAsync(2026, CancellationToken.None);

        CountPdfPages(pdfBytes).Should().Be(1);
    }

    [Fact]
    public async Task FifteenMembers_ProduceTwoPages()
    {
        await AddMembersWithRegisterNumbers(count: 15, startYear: 2026);

        var useCase = new ExportEnvelopeLabelsUseCase(_context, new LabelPdfService(), _logger.Object);
        var pdfBytes = await useCase.ExecuteAsync(2026, CancellationToken.None);

        CountPdfPages(pdfBytes).Should().Be(2);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private async Task AddMembersWithRegisterNumbers(int count, int startYear)
    {
        for (int i = 1; i <= count; i++)
        {
            _context.ChurchMembers.Add(new ChurchMember
            {
                Id = i, FirstName = $"Member{i}", LastName = $"Last{i}",
                ChurchMemberStatusId = 1, BankReference = null, Envelopes = true,
                CreatedBy = "system", CreatedDateTime = DateTime.UtcNow
            });
            _context.ChurchMemberRegisterNumbers.Add(new ChurchMemberRegisterNumber
            {
                Id = i, ChurchMemberId = i, Number = i, Year = startYear,
                CreatedBy = "system", CreatedDateTime = DateTime.UtcNow
            });
        }
        await _context.SaveChangesAsync();
    }

    private static int CountPdfPages(byte[] pdfBytes)
    {
        // Count /Type /Page dictionary entries minus /Type /Pages (the tree root)
        var pdfText = Encoding.Latin1.GetString(pdfBytes);
        var total = CountOccurrences(pdfText, "/Type /Page");
        var treeNodes = CountOccurrences(pdfText, "/Type /Pages");
        return total - treeNodes;
    }

    private static int CountOccurrences(string text, string pattern)
    {
        int count = 0;
        int index = 0;
        while ((index = text.IndexOf(pattern, index, StringComparison.Ordinal)) >= 0)
        {
            count++;
            index += pattern.Length;
        }
        return count;
    }

    public void Dispose() => _context.Dispose();
}
