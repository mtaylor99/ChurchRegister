using ChurchRegister.ApiService.Services.Labels;
using ChurchRegister.ApiService.UseCase.ChurchMembers.ExportAddressLabels;
using ChurchRegister.Database.Data;
using ChurchRegister.Database.Entities;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;

namespace ChurchRegister.ApiService.Tests.ChurchMembers;

public class ExportAddressLabelsTests : IDisposable
{
    private readonly ChurchRegisterWebContext _context;
    private readonly Mock<ILabelPdfService> _mockLabelPdfService;
    private readonly Mock<ILogger<ExportAddressLabelsUseCase>> _logger;
    private static readonly byte[] DummyPdf = "FAKEPDF"u8.ToArray();

    private IReadOnlyList<LabelData>? _capturedLabels;

    public ExportAddressLabelsTests()
    {
        var options = new DbContextOptionsBuilder<ChurchRegisterWebContext>()
            .UseInMemoryDatabase($"ExportAddressLabelTests_{Guid.NewGuid()}")
            .Options;

        _context = new ChurchRegisterWebContext(options);
        _mockLabelPdfService = new Mock<ILabelPdfService>();
        _logger = new Mock<ILogger<ExportAddressLabelsUseCase>>();

        _mockLabelPdfService
            .Setup(s => s.GenerateLabels(It.IsAny<IReadOnlyList<LabelData>>()))
            .Callback<IReadOnlyList<LabelData>>(l => _capturedLabels = l)
            .Returns(DummyPdf);

        SeedReferenceData();
    }

    private void SeedReferenceData()
    {
        _context.ChurchMemberStatuses.AddRange(
            new ChurchMemberStatus { Id = 1, Name = "Active", CreatedBy = "system", CreatedDateTime = DateTime.UtcNow },
            new ChurchMemberStatus { Id = 2, Name = "Inactive", CreatedBy = "system", CreatedDateTime = DateTime.UtcNow }
        );

        // Role types
        _context.ChurchMemberRoleTypes.AddRange(
            new ChurchMemberRoleTypes { Id = 1, Type = "Member", CreatedBy = "system", CreatedDateTime = DateTime.UtcNow },
            new ChurchMemberRoleTypes { Id = 2, Type = "Non-Member", CreatedBy = "system", CreatedDateTime = DateTime.UtcNow }
        );

        _context.SaveChanges();
    }

    private ExportAddressLabelsUseCase CreateUseCase() =>
        new(_context, _mockLabelPdfService.Object, _logger.Object);

    private Address CreateAddress(int id) => new()
    {
        Id = id,
        NameNumber = $"{id} Test Street",
        AddressLineOne = "Test Road",
        Town = "Testville",
        Postcode = "TE1 1ST",
        CreatedBy = "system",
        CreatedDateTime = DateTime.UtcNow
    };

    // ─── Combined Name: Same Surname ──────────────────────────────────────────

    [Fact]
    public async Task TwoCoResidents_SameSurname_CombineAsFirstAmpersandFirstLastName()
    {
        // Arrange
        _context.Addresses.Add(CreateAddress(1));
        _context.ChurchMembers.AddRange(
            new ChurchMember { Id = 1, FirstName = "Alice", LastName = "Smith", ChurchMemberStatusId = 1, AddressId = 1, BankReference = null, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow },
            new ChurchMember { Id = 2, FirstName = "Bob", LastName = "Smith", ChurchMemberStatusId = 1, AddressId = 1, BankReference = null, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        await CreateUseCase().ExecuteAsync(CancellationToken.None);

        _capturedLabels.Should().HaveCount(1);
        _capturedLabels![0].Name.Should().Be("Alice & Bob Smith");
    }

    // ─── Combined Name: Different Surnames ────────────────────────────────────

    [Fact]
    public async Task TwoCoResidents_DifferentSurnames_CombineAsFullNamesWithAmpersand()
    {
        _context.Addresses.Add(CreateAddress(1));
        _context.ChurchMembers.AddRange(
            new ChurchMember { Id = 1, FirstName = "Alice", LastName = "Smith", ChurchMemberStatusId = 1, AddressId = 1, BankReference = null, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow },
            new ChurchMember { Id = 2, FirstName = "Bob", LastName = "Brown", ChurchMemberStatusId = 1, AddressId = 1, BankReference = null, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        await CreateUseCase().ExecuteAsync(CancellationToken.None);

        _capturedLabels.Should().HaveCount(1);
        _capturedLabels![0].Name.Should().Be("Alice Smith & Bob Brown");
    }

    // ─── Non-Member Flag ──────────────────────────────────────────────────────

    [Fact]
    public async Task AllResidentsAreNonMembers_SetsLine5IsNonMemberTrue()
    {
        _context.Addresses.Add(CreateAddress(1));
        var m1 = new ChurchMember { Id = 1, FirstName = "Carol", LastName = "Green", ChurchMemberStatusId = 1, AddressId = 1, BankReference = null, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow };
        var m2 = new ChurchMember { Id = 2, FirstName = "Dave", LastName = "Green", ChurchMemberStatusId = 1, AddressId = 1, BankReference = null, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow };
        _context.ChurchMembers.AddRange(m1, m2);
        _context.ChurchMemberRoles.AddRange(
            new ChurchMemberRoles { Id = 1, ChurchMemberId = 1, ChurchMemberRoleTypeId = 2, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow },
            new ChurchMemberRoles { Id = 2, ChurchMemberId = 2, ChurchMemberRoleTypeId = 2, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        await CreateUseCase().ExecuteAsync(CancellationToken.None);

        _capturedLabels!.Should().HaveCount(1);
        _capturedLabels[0].Line5IsNonMember.Should().BeTrue();
        _capturedLabels[0].Line5.Should().Be("***");
    }

    [Fact]
    public async Task MixedRoles_AtAddress_SetsLine5IsNonMemberFalse()
    {
        _context.Addresses.Add(CreateAddress(1));
        var m1 = new ChurchMember { Id = 1, FirstName = "Eve", LastName = "Black", ChurchMemberStatusId = 1, AddressId = 1, BankReference = null, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow };
        var m2 = new ChurchMember { Id = 2, FirstName = "Frank", LastName = "Black", ChurchMemberStatusId = 1, AddressId = 1, BankReference = null, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow };
        _context.ChurchMembers.AddRange(m1, m2);
        // m1 is Non-Member, m2 is Member → not all non-members
        _context.ChurchMemberRoles.AddRange(
            new ChurchMemberRoles { Id = 1, ChurchMemberId = 1, ChurchMemberRoleTypeId = 2, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow },
            new ChurchMemberRoles { Id = 2, ChurchMemberId = 2, ChurchMemberRoleTypeId = 1, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        await CreateUseCase().ExecuteAsync(CancellationToken.None);

        _capturedLabels!.Should().HaveCount(1);
        _capturedLabels[0].Line5IsNonMember.Should().BeFalse();
    }

    // ─── Inactive Member Exclusion ────────────────────────────────────────────

    [Fact]
    public async Task InactiveMember_IsExcluded_AndNotCountedTowardNonMemberDetermination()
    {
        _context.Addresses.Add(CreateAddress(1));
        // Active member — only one, so label name is solo
        var active = new ChurchMember { Id = 1, FirstName = "Grace", LastName = "Hill", ChurchMemberStatusId = 1, AddressId = 1, BankReference = null, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow };
        // Inactive member at same address — should be ignored
        var inactive = new ChurchMember { Id = 2, FirstName = "Henry", LastName = "Hill", ChurchMemberStatusId = 2, AddressId = 1, BankReference = null, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow };
        _context.ChurchMembers.AddRange(active, inactive);
        // Active member has Member role; inactive has Non-Member role (should not affect determination)
        _context.ChurchMemberRoles.AddRange(
            new ChurchMemberRoles { Id = 1, ChurchMemberId = 1, ChurchMemberRoleTypeId = 1, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow },
            new ChurchMemberRoles { Id = 2, ChurchMemberId = 2, ChurchMemberRoleTypeId = 2, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        await CreateUseCase().ExecuteAsync(CancellationToken.None);

        // Only active member appears — one label with solo name
        _capturedLabels!.Should().HaveCount(1);
        _capturedLabels[0].Name.Should().Be("Grace Hill");
        // Line5IsNonMember = false since active member has Member role
        _capturedLabels[0].Line5IsNonMember.Should().BeFalse();
    }

    // ─── Address Grouping ─────────────────────────────────────────────────────

    [Fact]
    public async Task TwoMembersAtSameAddress_ProduceExactlyOneLabel()
    {
        _context.Addresses.Add(CreateAddress(1));
        _context.ChurchMembers.AddRange(
            new ChurchMember { Id = 1, FirstName = "Iris", LastName = "King", ChurchMemberStatusId = 1, AddressId = 1, BankReference = null, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow },
            new ChurchMember { Id = 2, FirstName = "Jack", LastName = "King", ChurchMemberStatusId = 1, AddressId = 1, BankReference = null, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        await CreateUseCase().ExecuteAsync(CancellationToken.None);

        _capturedLabels!.Should().HaveCount(1);
    }

    [Fact]
    public async Task MemberWithNullAddressId_ProducesOwnLabel()
    {
        // Member with no address — AddressId = null
        _context.ChurchMembers.Add(
            new ChurchMember { Id = 1, FirstName = "Laura", LastName = "Moore", ChurchMemberStatusId = 1, AddressId = null, BankReference = null, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        await CreateUseCase().ExecuteAsync(CancellationToken.None);

        _capturedLabels!.Should().HaveCount(1);
        _capturedLabels[0].Name.Should().Be("Laura Moore");
    }

    public void Dispose() => _context.Dispose();
}
