using ChurchRegister.ApiService.UseCase.ChurchMembers.ExportAddressList;
using ChurchRegister.Database.Data;
using ChurchRegister.Database.Entities;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using OfficeOpenXml;

namespace ChurchRegister.ApiService.Tests.ChurchMembers;

public class ExportAddressListTests : IDisposable
{
    private readonly ChurchRegisterWebContext _context;
    private readonly Mock<ILogger<ExportAddressListUseCase>> _logger;

    public ExportAddressListTests()
    {
        var options = new DbContextOptionsBuilder<ChurchRegisterWebContext>()
            .UseInMemoryDatabase($"ExportAddressListTests_{Guid.NewGuid()}")
            .Options;

        _context = new ChurchRegisterWebContext(options);
        _logger = new Mock<ILogger<ExportAddressListUseCase>>();

        SeedReferenceData();
    }

    private void SeedReferenceData()
    {
        _context.ChurchMemberStatuses.AddRange(
            new ChurchMemberStatus { Id = 1, Name = "Active", CreatedBy = "system", CreatedDateTime = DateTime.UtcNow },
            new ChurchMemberStatus { Id = 2, Name = "Inactive", CreatedBy = "system", CreatedDateTime = DateTime.UtcNow }
        );

        _context.ChurchMemberRoleTypes.AddRange(
            new ChurchMemberRoleTypes { Id = 1, Type = "Member", CreatedBy = "system", CreatedDateTime = DateTime.UtcNow },
            new ChurchMemberRoleTypes { Id = 2, Type = "Non-Member", CreatedBy = "system", CreatedDateTime = DateTime.UtcNow }
        );

        _context.SaveChanges();
    }

    private ExportAddressListUseCase CreateUseCase() =>
        new(_context, _logger.Object);

    private Address CreateAddress(int id, string postcode = "TE1 1ST") => new()
    {
        Id = id,
        NameNumber = $"{id} Test Street",
        AddressLineOne = "Test Road",
        Town = "Testville",
        County = "Testshire",
        Postcode = postcode,
        CreatedBy = "system",
        CreatedDateTime = DateTime.UtcNow
    };

    private static (string[,] headers, string[,] data) ReadExcel(byte[] bytes)
    {
        ExcelPackage.License.SetNonCommercialPersonal("ChurchRegister");
        using var pkg = new ExcelPackage(new MemoryStream(bytes));
        var ws = pkg.Workbook.Worksheets["Address List"];
        ws.Should().NotBeNull();

        var headers = new string[1, 8];
        for (int c = 1; c <= 8; c++)
            headers[0, c - 1] = ws!.Cells[1, c].Text;

        int rowCount = ws!.Dimension?.Rows ?? 1;
        var data = new string[rowCount - 1, 8];
        for (int r = 2; r <= rowCount; r++)
            for (int c = 1; c <= 8; c++)
                data[r - 2, c - 1] = ws.Cells[r, c].Text;

        return (headers, data);
    }

    public void Dispose() => _context.Dispose();

    // ─── Basic Output ─────────────────────────────────────────────────────────

    [Fact]
    public async Task EmptyDatabase_ReturnsValidExcelWithHeadersOnly()
    {
        var bytes = await CreateUseCase().ExecuteAsync(CancellationToken.None);

        bytes.Should().NotBeNullOrEmpty();

        var (headers, data) = ReadExcel(bytes);
        headers[0, 0].Should().Be("Combined Name");
        headers[0, 1].Should().Be("Name/Number");
        headers[0, 2].Should().Be("Address Line 1");
        headers[0, 7].Should().Be("Non-Member");

        data.GetLength(0).Should().Be(0);
    }

    [Fact]
    public async Task SingleActiveMember_ProducesOneDataRow()
    {
        _context.Addresses.Add(CreateAddress(1));
        _context.ChurchMembers.Add(new ChurchMember
        {
            Id = 1, FirstName = "Alice", LastName = "Smith",
            ChurchMemberStatusId = 1, AddressId = 1,
            CreatedBy = "system", CreatedDateTime = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        var bytes = await CreateUseCase().ExecuteAsync(CancellationToken.None);
        var (_, data) = ReadExcel(bytes);

        data.GetLength(0).Should().Be(1);
        data[0, 0].Should().Be("Alice Smith");
        data[0, 2].Should().Be("Test Road");
        data[0, 4].Should().Be("Testville");
        data[0, 6].Should().Be("TE1 1ST");
        data[0, 7].Should().BeEmpty(); // Not non-member
    }

    [Fact]
    public async Task InactiveMember_IsExcludedFromOutput()
    {
        _context.Addresses.Add(CreateAddress(1));
        _context.ChurchMembers.AddRange(
            new ChurchMember { Id = 1, FirstName = "Active", LastName = "Person", ChurchMemberStatusId = 1, AddressId = 1, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow },
            new ChurchMember { Id = 2, FirstName = "Inactive", LastName = "Person", ChurchMemberStatusId = 2, AddressId = 1, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        var bytes = await CreateUseCase().ExecuteAsync(CancellationToken.None);
        var (_, data) = ReadExcel(bytes);

        data.GetLength(0).Should().Be(1);
        data[0, 0].Should().Be("Active Person");
    }

    // ─── Combined Names ───────────────────────────────────────────────────────

    [Fact]
    public async Task TwoMembersSameSurname_CombinesFirstNamesWithAmpersand()
    {
        _context.Addresses.Add(CreateAddress(1));
        _context.ChurchMembers.AddRange(
            new ChurchMember { Id = 1, FirstName = "Alice", LastName = "Smith", ChurchMemberStatusId = 1, AddressId = 1, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow },
            new ChurchMember { Id = 2, FirstName = "Bob", LastName = "Smith", ChurchMemberStatusId = 1, AddressId = 1, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        var bytes = await CreateUseCase().ExecuteAsync(CancellationToken.None);
        var (_, data) = ReadExcel(bytes);

        data[0, 0].Should().Be("Alice & Bob Smith");
    }

    [Fact]
    public async Task TwoMembersDifferentSurnames_CombinesFullNamesWithAmpersand()
    {
        _context.Addresses.Add(CreateAddress(1));
        _context.ChurchMembers.AddRange(
            new ChurchMember { Id = 1, FirstName = "Alice", LastName = "Smith", ChurchMemberStatusId = 1, AddressId = 1, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow },
            new ChurchMember { Id = 2, FirstName = "Bob", LastName = "Brown", ChurchMemberStatusId = 1, AddressId = 1, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        var bytes = await CreateUseCase().ExecuteAsync(CancellationToken.None);
        var (_, data) = ReadExcel(bytes);

        data[0, 0].Should().Be("Alice Smith & Bob Brown");
    }

    [Fact]
    public async Task ThreeMembersSameSurname_CombinesWithCommaAndAmpersand()
    {
        _context.Addresses.Add(CreateAddress(1));
        _context.ChurchMembers.AddRange(
            new ChurchMember { Id = 1, FirstName = "Alice", LastName = "Jones", ChurchMemberStatusId = 1, AddressId = 1, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow },
            new ChurchMember { Id = 2, FirstName = "Bob", LastName = "Jones", ChurchMemberStatusId = 1, AddressId = 1, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow },
            new ChurchMember { Id = 3, FirstName = "Carol", LastName = "Jones", ChurchMemberStatusId = 1, AddressId = 1, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        var bytes = await CreateUseCase().ExecuteAsync(CancellationToken.None);
        var (_, data) = ReadExcel(bytes);

        data[0, 0].Should().Be("Alice, Bob & Carol Jones");
    }

    // ─── Non-Member Flag ──────────────────────────────────────────────────────

    [Fact]
    public async Task AllResidentsNonMember_SetsNonMemberColumnToYes()
    {
        _context.Addresses.Add(CreateAddress(1));
        var m1 = new ChurchMember { Id = 1, FirstName = "Carol", LastName = "Green", ChurchMemberStatusId = 1, AddressId = 1, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow };
        _context.ChurchMembers.Add(m1);
        _context.ChurchMemberRoles.Add(
            new ChurchMemberRoles { Id = 1, ChurchMemberId = 1, ChurchMemberRoleTypeId = 2, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        var bytes = await CreateUseCase().ExecuteAsync(CancellationToken.None);
        var (_, data) = ReadExcel(bytes);

        data[0, 7].Should().Be("Yes");
    }

    [Fact]
    public async Task MixedMemberAndNonMember_AtSameAddress_NonMemberColumnIsEmpty()
    {
        _context.Addresses.Add(CreateAddress(1));
        var m1 = new ChurchMember { Id = 1, FirstName = "Eve", LastName = "Black", ChurchMemberStatusId = 1, AddressId = 1, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow };
        var m2 = new ChurchMember { Id = 2, FirstName = "Frank", LastName = "Black", ChurchMemberStatusId = 1, AddressId = 1, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow };
        _context.ChurchMembers.AddRange(m1, m2);
        _context.ChurchMemberRoles.AddRange(
            new ChurchMemberRoles { Id = 1, ChurchMemberId = 1, ChurchMemberRoleTypeId = 2, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow },
            new ChurchMemberRoles { Id = 2, ChurchMemberId = 2, ChurchMemberRoleTypeId = 1, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        var bytes = await CreateUseCase().ExecuteAsync(CancellationToken.None);
        var (_, data) = ReadExcel(bytes);

        data[0, 7].Should().BeEmpty();
    }

    [Fact]
    public async Task MemberWithNoRoles_NonMemberColumnIsEmpty()
    {
        _context.Addresses.Add(CreateAddress(1));
        _context.ChurchMembers.Add(new ChurchMember
        {
            Id = 1, FirstName = "Grace", LastName = "Hill",
            ChurchMemberStatusId = 1, AddressId = 1,
            CreatedBy = "system", CreatedDateTime = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        var bytes = await CreateUseCase().ExecuteAsync(CancellationToken.None);
        var (_, data) = ReadExcel(bytes);

        // No Roles collection → allSameSurname logic => isNonMember = false
        data[0, 7].Should().BeEmpty();
    }

    // ─── Address Grouping ─────────────────────────────────────────────────────

    [Fact]
    public async Task TwoMembersAtSameAddress_ProduceOneRow()
    {
        _context.Addresses.Add(CreateAddress(1));
        _context.ChurchMembers.AddRange(
            new ChurchMember { Id = 1, FirstName = "Alice", LastName = "White", ChurchMemberStatusId = 1, AddressId = 1, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow },
            new ChurchMember { Id = 2, FirstName = "Bob", LastName = "White", ChurchMemberStatusId = 1, AddressId = 1, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        var bytes = await CreateUseCase().ExecuteAsync(CancellationToken.None);
        var (_, data) = ReadExcel(bytes);

        data.GetLength(0).Should().Be(1);
    }

    [Fact]
    public async Task TwoMembersAtDifferentAddresses_ProduceTwoRows()
    {
        _context.Addresses.AddRange(CreateAddress(1, "AA1 1AA"), CreateAddress(2, "BB2 2BB"));
        _context.ChurchMembers.AddRange(
            new ChurchMember { Id = 1, FirstName = "Alice", LastName = "Alpha", ChurchMemberStatusId = 1, AddressId = 1, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow },
            new ChurchMember { Id = 2, FirstName = "Bob", LastName = "Beta", ChurchMemberStatusId = 1, AddressId = 2, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        var bytes = await CreateUseCase().ExecuteAsync(CancellationToken.None);
        var (_, data) = ReadExcel(bytes);

        data.GetLength(0).Should().Be(2);
    }

    [Fact]
    public async Task MemberWithNoAddress_ProducesSeparateRowPerMember()
    {
        // Two members with null address → each gets their own "noadd:{id}" key
        _context.ChurchMembers.AddRange(
            new ChurchMember { Id = 1, FirstName = "Alice", LastName = "Anon", ChurchMemberStatusId = 1, AddressId = null, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow },
            new ChurchMember { Id = 2, FirstName = "Bob", LastName = "Anon", ChurchMemberStatusId = 1, AddressId = null, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        var bytes = await CreateUseCase().ExecuteAsync(CancellationToken.None);
        var (_, data) = ReadExcel(bytes);

        data.GetLength(0).Should().Be(2);
    }

    // ─── Sorting ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task RowsAreSortedByLastNameThenFirstName()
    {
        _context.Addresses.AddRange(CreateAddress(1, "AA1 1AA"), CreateAddress(2, "BB2 2BB"), CreateAddress(3, "CC3 3CC"));
        _context.ChurchMembers.AddRange(
            new ChurchMember { Id = 1, FirstName = "Zach", LastName = "Brown", ChurchMemberStatusId = 1, AddressId = 1, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow },
            new ChurchMember { Id = 2, FirstName = "Anna", LastName = "Smith", ChurchMemberStatusId = 1, AddressId = 2, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow },
            new ChurchMember { Id = 3, FirstName = "Alan", LastName = "Adams", ChurchMemberStatusId = 1, AddressId = 3, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        var bytes = await CreateUseCase().ExecuteAsync(CancellationToken.None);
        var (_, data) = ReadExcel(bytes);

        data[0, 0].Should().Be("Alan Adams");
        data[1, 0].Should().Be("Zach Brown");
        data[2, 0].Should().Be("Anna Smith");
    }

    // ─── Alternating Row Colours (indirectly tested via content) ─────────────

    [Fact]
    public async Task MultipleRows_AllRowsContainCorrectData()
    {
        _context.Addresses.AddRange(
            CreateAddress(1, "AA1 1AA"),
            CreateAddress(2, "BB2 2BB"),
            CreateAddress(3, "CC3 3CC")
        );
        _context.ChurchMembers.AddRange(
            new ChurchMember { Id = 1, FirstName = "Alpha", LastName = "One", ChurchMemberStatusId = 1, AddressId = 1, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow },
            new ChurchMember { Id = 2, FirstName = "Beta", LastName = "Two", ChurchMemberStatusId = 1, AddressId = 2, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow },
            new ChurchMember { Id = 3, FirstName = "Gamma", LastName = "Three", ChurchMemberStatusId = 1, AddressId = 3, CreatedBy = "system", CreatedDateTime = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        var bytes = await CreateUseCase().ExecuteAsync(CancellationToken.None);
        var (_, data) = ReadExcel(bytes);

        data.GetLength(0).Should().Be(3);
        data[0, 0].Should().Be("Alpha One");
        data[1, 0].Should().Be("Gamma Three");
        data[2, 0].Should().Be("Beta Two");
    }
}
