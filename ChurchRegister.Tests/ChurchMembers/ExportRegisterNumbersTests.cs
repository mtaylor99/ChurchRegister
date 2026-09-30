using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.ApiService.UseCase.ChurchMembers.ExportRegisterNumbers;
using ChurchRegister.ApiService.UseCase.ChurchMembers.PreviewRegisterNumbers;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using OfficeOpenXml;

namespace ChurchRegister.ApiService.Tests.ChurchMembers;

public class ExportRegisterNumbersTests
{
    private static RegisterNumberAssignment Assignment(int number, string name, int? current, DateTime? since, string type = "Member") => new()
    {
        RegisterNumber = number,
        MemberId = number,
        MemberName = name,
        CurrentNumber = current,
        MemberSince = since,
        MemberType = type
    };

    private static async Task<ExcelPackage> BuildAsync(PreviewRegisterNumbersResponse preview)
    {
        var previewUseCase = new Mock<IPreviewRegisterNumbersUseCase>();
        previewUseCase
            .Setup(x => x.ExecuteAsync(2027, It.IsAny<CancellationToken>()))
            .ReturnsAsync(preview);

        var useCase = new ExportRegisterNumbersUseCase(
            previewUseCase.Object,
            new Mock<ILogger<ExportRegisterNumbersUseCase>>().Object);

        var bytes = await useCase.ExecuteAsync(2027, CancellationToken.None);

        ExcelPackage.License.SetNonCommercialPersonal("ChurchRegister");
        return new ExcelPackage(new MemoryStream(bytes));
    }

    [Fact]
    public async Task ExecuteAsync_ProducesSingleWorksheetWithThreeBlocksSideBySide()
    {
        var preview = new PreviewRegisterNumbersResponse
        {
            Year = 2027,
            Members = { Assignment(1, "Anna Adams", 3, new DateTime(2010, 5, 1)) },
            NonBaptisedMembers = { Assignment(250, "Ben Brown", null, new DateTime(2020, 1, 2)) },
            NonMembers = { Assignment(500, "Cara Clark", 501, null, "Non-Member") }
        };

        using var pkg = await BuildAsync(preview);

        pkg.Workbook.Worksheets.Should().HaveCount(1);
        var ws = pkg.Workbook.Worksheets[0];

        ws.Cells[1, 1].Text.Should().Be("Members (Baptised) (1)");
        ws.Cells[1, 6].Text.Should().Be("Members (Non-Baptised) (1)");
        ws.Cells[1, 11].Text.Should().Be("Non-Members (1)");

        foreach (var start in new[] { 1, 6, 11 })
        {
            ws.Cells[2, start].Text.Should().Be("Name");
            ws.Cells[2, start + 1].Text.Should().Be("Since");
            ws.Cells[2, start + 2].Text.Should().Be("Current");
            ws.Cells[2, start + 3].Text.Should().Be("New");
        }

        ws.Cells[3, 1].Text.Should().Be("Anna Adams");
        ws.Cells[3, 2].Text.Should().Be("01/05/2010");
        ws.Cells[3, 3].Text.Should().Be("3");
        ws.Cells[3, 4].Text.Should().Be("1");

        ws.Cells[3, 6].Text.Should().Be("Ben Brown");
        ws.Cells[3, 8].Text.Should().Be("—");
        ws.Cells[3, 9].Text.Should().Be("250");

        ws.Cells[3, 11].Text.Should().Be("Cara Clark");
        ws.Cells[3, 12].Text.Should().Be("Missing");
        ws.Cells[3, 14].Text.Should().Be("500");
    }

    [Fact]
    public async Task ExecuteAsync_WithNoRows_StillWritesHeaders()
    {
        using var pkg = await BuildAsync(new PreviewRegisterNumbersResponse { Year = 2027 });

        var ws = pkg.Workbook.Worksheets[0];
        ws.Cells[1, 1].Text.Should().Be("Members (Baptised) (0)");
        ws.Cells[2, 14].Text.Should().Be("New");
    }
}
