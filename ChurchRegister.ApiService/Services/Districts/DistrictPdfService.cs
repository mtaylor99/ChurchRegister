using ChurchRegister.ApiService.Models.Districts;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace ChurchRegister.ApiService.Services.Districts;

/// <summary>
/// Service for generating district reports as PDFs
/// </summary>
public class DistrictPdfService
{
    /// <summary>
    /// Generate PDF report for districts
    /// </summary>
    /// <param name="districts">District export data</param>
    /// <returns>PDF as byte array</returns>
    public byte[] GenerateDistrictReport(List<DistrictExportDto> districts)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        var document = Document.Create(container =>
        {
            foreach (var district in districts)
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(40);
                    
                    page.Header().Element(c => ComposeHeader(c, district));
                    page.Content().Element(c => ComposeContent(c, district));
                    page.Footer().AlignCenter().Text(text =>
                    {
                        text.Span("Generated on ");
                        text.Span(DateTime.Now.ToString("dd MMM yyyy")).SemiBold();
                    });
                });
            }
        });

        return document.GeneratePdf();
    }

    private void ComposeHeader(IContainer container, DistrictExportDto district)
    {
        container.Column(column =>
        {
            column.Spacing(5);
            
            column.Item().Text(district.DistrictName)
                .FontSize(24)
                .Bold()
                .FontColor(Colors.Blue.Darken2);
            
            column.Item().Text($"Deacon: {district.DeaconName}")
                .FontSize(14)
                .SemiBold();
            
            column.Item().Text($"District Officer: {district.DistrictOfficerName}")
                .FontSize(14)
                .SemiBold();
            
            column.Item().PaddingTop(10).LineHorizontal(1).LineColor(Colors.Grey.Lighten1);
        });
    }

    private void ComposeContent(IContainer container, DistrictExportDto district)
    {
        container.PaddingTop(20).Column(column =>
        {
            column.Spacing(5);

            if (!district.Members.Any())
            {
                column.Item().Text("No active members in this district.")
                    .FontSize(12)
                    .Italic()
                    .FontColor(Colors.Grey.Darken1);
                return;
            }

            column.Item().Table(table =>
            {
                // Define columns
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn(2); // Name
                    columns.RelativeColumn(3); // Address
                    columns.RelativeColumn(1.5f); // Phone
                    columns.RelativeColumn(2); // Email
                });

                // Header
                table.Header(header =>
                {
                    header.Cell().Element(CellStyle).Text("Name").SemiBold();
                    header.Cell().Element(CellStyle).Text("Address").SemiBold();
                    header.Cell().Element(CellStyle).Text("Phone").SemiBold();
                    header.Cell().Element(CellStyle).Text("Email").SemiBold();

                    static IContainer CellStyle(IContainer container)
                    {
                        return container
                            .Background(Colors.Grey.Lighten3)
                            .Padding(8)
                            .BorderBottom(1)
                            .BorderColor(Colors.Grey.Darken1);
                    }
                });

                // Rows
                foreach (var member in district.Members)
                {
                    table.Cell().Element(CellStyle).Text(member.Name);
                    table.Cell().Element(CellStyle).Text(member.Address);
                    table.Cell().Element(CellStyle).Text(member.Phone);
                    table.Cell().Element(CellStyle).Text(member.Email);

                    static IContainer CellStyle(IContainer container)
                    {
                        return container
                            .Padding(8)
                            .BorderBottom(1)
                            .BorderColor(Colors.Grey.Lighten2);
                    }
                }
            });

            column.Item().PaddingTop(10).Text($"Total Members: {district.Members.Count}")
                .FontSize(11)
                .SemiBold();
        });
    }
}
