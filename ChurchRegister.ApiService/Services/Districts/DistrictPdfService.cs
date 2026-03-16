using ChurchRegister.ApiService.Models.Districts;
using ChurchRegister.ApiService.UseCase.Districts.ExportDistrictsMemberList;
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

    /// <summary>
    /// Generate PDF report listing active members per district
    /// </summary>
    /// <param name="sections">Ordered list of district sections</param>
    /// <returns>PDF as byte array</returns>
    public byte[] GenerateDistrictMemberListReport(List<DistrictMemberListSection> sections)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        var generatedDate = DateTime.Now.ToString("dd MMMM yyyy");

        var document = Document.Create(container =>
        {
            // Summary page
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(40);

                page.Header().Column(column =>
                {
                    column.Spacing(4);
                    column.Item().Text("District Summary")
                        .FontSize(24).Bold().FontColor(Colors.Blue.Darken2);
                    column.Item().PaddingTop(8).LineHorizontal(1).LineColor(Colors.Grey.Lighten1);
                });

                page.Content().PaddingTop(16).Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.RelativeColumn(1.5f); // District
                        columns.RelativeColumn(2.5f); // Deacon
                        columns.RelativeColumn(2.5f); // District Officer
                        columns.RelativeColumn(1.2f); // Residences
                        columns.RelativeColumn(1.2f); // Members
                    });

                    table.Header(header =>
                    {
                        header.Cell().Element(SummaryHeaderStyle).Text("District").SemiBold();
                        header.Cell().Element(SummaryHeaderStyle).Text("Deacon").SemiBold();
                        header.Cell().Element(SummaryHeaderStyle).Text("District Officer").SemiBold();
                        header.Cell().Element(SummaryHeaderStyle).Text("Residences").SemiBold();
                        header.Cell().Element(SummaryHeaderStyle).Text("Members").SemiBold();

                        static IContainer SummaryHeaderStyle(IContainer c) =>
                            c.Background(Colors.Grey.Lighten3)
                             .Padding(8)
                             .BorderBottom(1)
                             .BorderColor(Colors.Grey.Darken1);
                    });

                    for (int i = 0; i < sections.Count; i++)
                    {
                        var s = sections[i];
                        var isEven = i % 2 == 0;

                        IContainer SummaryRowStyle(IContainer c) =>
                            c.Background(isEven ? Colors.White : Colors.Grey.Lighten5)
                             .Padding(7)
                             .BorderBottom(1)
                             .BorderColor(Colors.Grey.Lighten2);

                        table.Cell().Element(SummaryRowStyle).Text(s.DistrictName).FontSize(10);
                        table.Cell().Element(SummaryRowStyle).Text(s.IsUnassigned ? "" : (s.DeaconName ?? "Not assigned")).FontSize(10);
                        table.Cell().Element(SummaryRowStyle).Text(s.IsUnassigned ? "" : (s.DistrictOfficerName ?? "Not assigned")).FontSize(10);
                        table.Cell().Element(SummaryRowStyle).Text(s.ResidenceCount.ToString()).FontSize(10);
                        table.Cell().Element(SummaryRowStyle).Text(s.Members.Count.ToString()).FontSize(10);
                    }
                });

                page.Footer().Row(row =>
                {
                    row.RelativeItem().Text($"Generated: {generatedDate}")
                        .FontSize(9)
                        .FontColor(Colors.Grey.Darken1);
                    row.RelativeItem().AlignRight().Text(text =>
                    {
                        text.Span("Page ").FontSize(9).FontColor(Colors.Grey.Darken1);
                        text.CurrentPageNumber().FontSize(9).FontColor(Colors.Grey.Darken1);
                        text.Span(" of ").FontSize(9).FontColor(Colors.Grey.Darken1);
                        text.TotalPages().FontSize(9).FontColor(Colors.Grey.Darken1);
                    });
                });
            });

            // Per-district pages
            foreach (var section in sections)
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(40);

                    page.Header().Element(c => ComposeMemberListHeader(c, section));
                    page.Content().Element(c => ComposeMemberListContent(c, section));
                    page.Footer().Row(row =>
                    {
                        row.RelativeItem().Text($"Generated: {generatedDate}")
                            .FontSize(9)
                            .FontColor(Colors.Grey.Darken1);
                        row.RelativeItem().AlignRight().Text(text =>
                        {
                            text.Span("Page ").FontSize(9).FontColor(Colors.Grey.Darken1);
                            text.CurrentPageNumber().FontSize(9).FontColor(Colors.Grey.Darken1);
                            text.Span(" of ").FontSize(9).FontColor(Colors.Grey.Darken1);
                            text.TotalPages().FontSize(9).FontColor(Colors.Grey.Darken1);
                        });
                    });
                });
            }
        });

        return document.GeneratePdf();
    }

    private void ComposeMemberListHeader(IContainer container, DistrictMemberListSection section)
    {
        container.Column(column =>
        {
            column.Spacing(4);

            column.Item().Text(section.DistrictName)
                .FontSize(22)
                .Bold()
                .FontColor(Colors.Blue.Darken2);

            if (!string.IsNullOrWhiteSpace(section.Description))
            {
                column.Item().Text(section.Description)
                    .FontSize(12)
                    .FontColor(Colors.Grey.Darken2);
            }

            if (!section.IsUnassigned)
            {
                column.Item().Text($"Deacon: {section.DeaconName ?? "Not assigned"}")
                    .FontSize(12)
                    .SemiBold();

                column.Item().Text($"District Officer: {section.DistrictOfficerName ?? "Not assigned"}")
                    .FontSize(12)
                    .SemiBold();
            }

            column.Item().PaddingTop(8).LineHorizontal(1).LineColor(Colors.Grey.Lighten1);
        });
    }

    private void ComposeMemberListContent(IContainer container, DistrictMemberListSection section)
    {
        container.PaddingTop(16).Column(column =>
        {
            column.Spacing(4);

            if (!section.Members.Any())
            {
                column.Item().Text("No active members in this district.")
                    .FontSize(11)
                    .Italic()
                    .FontColor(Colors.Grey.Darken1);
                return;
            }

            column.Item().Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn(2);    // Name
                    columns.RelativeColumn(3);    // Address
                    columns.RelativeColumn(1.5f); // Phone
                });

                table.Header(header =>
                {
                    header.Cell().Element(MemberHeaderCellStyle).Text("Name").SemiBold();
                    header.Cell().Element(MemberHeaderCellStyle).Text("Address").SemiBold();
                    header.Cell().Element(MemberHeaderCellStyle).Text("Phone Number").SemiBold();

                    static IContainer MemberHeaderCellStyle(IContainer c) =>
                        c.Background(Colors.Grey.Lighten3)
                         .Padding(8)
                         .BorderBottom(1)
                         .BorderColor(Colors.Grey.Darken1);
                });

                for (int rowIndex = 0; rowIndex < section.Members.Count; rowIndex++)
                {
                    var member = section.Members[rowIndex];
                    var isEven = rowIndex % 2 == 0;

                    IContainer RowCellStyle(IContainer c) =>
                        c.Background(isEven ? Colors.White : Colors.Grey.Lighten5)
                         .Padding(7)
                         .BorderBottom(1)
                         .BorderColor(Colors.Grey.Lighten2);

                    table.Cell().Element(RowCellStyle).Text(member.FullName).FontSize(10);
                    table.Cell().Element(RowCellStyle).Text(member.FormattedAddress).FontSize(10);
                    table.Cell().Element(RowCellStyle).Text(member.PhoneNumber ?? string.Empty).FontSize(10);
                }
            });

            column.Item().PaddingTop(8)
                .Text($"Total: {section.Members.Count} member{(section.Members.Count == 1 ? "" : "s")}")
                .FontSize(10).SemiBold();
        });
    }
}
