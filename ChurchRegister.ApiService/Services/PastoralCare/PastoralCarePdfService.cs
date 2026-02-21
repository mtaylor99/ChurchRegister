using ChurchRegister.ApiService.Models.PastoralCare;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace ChurchRegister.ApiService.Services.PastoralCare;

/// <summary>
/// Service for generating PDF reports for pastoral care
/// </summary>
public class PastoralCarePdfService : IPastoralCarePdfService
{
    private readonly ILogger<PastoralCarePdfService> _logger;

    public PastoralCarePdfService(ILogger<PastoralCarePdfService> logger)
    {
        _logger = logger;
        
        // Configure QuestPDF license (Community License for open-source projects)
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public Task<byte[]> GeneratePastoralCareReportAsync(PastoralCareReportDto reportData, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Generating pastoral care PDF report with {DistrictCount} districts and {MemberCount} members",
                reportData.Districts.Length, reportData.TotalMembers);

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(1.5f, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Arial"));

                    // Header
                    page.Header().Element(ComposeHeader);

                    // Content
                    page.Content().Element(content => ComposeContent(content, reportData));

                    // Footer
                    page.Footer().Element(footer => ComposeFooter(footer, reportData));
                });
            });

            var pdfBytes = document.GeneratePdf();
            
            _logger.LogInformation("Successfully generated pastoral care PDF report ({Size} bytes)", pdfBytes.Length);
            
            return Task.FromResult(pdfBytes);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating pastoral care PDF report");
            throw;
        }
    }

    private void ComposeHeader(IContainer container)
    {
        container.BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingBottom(10).Row(row =>
        {
            row.RelativeItem().Column(column =>
            {
                column.Item().Text("Pastoral Care Report").FontSize(20).Bold().FontColor(Colors.Blue.Darken2);
                column.Item().Text("Members Requiring Pastoral Care").FontSize(12).FontColor(Colors.Grey.Darken1);
            });

            row.ConstantItem(100).AlignRight().Column(column =>
            {
                column.Item().AlignRight().Text(text =>
                {
                    text.Span("Page ");
                    text.CurrentPageNumber();
                    text.Span(" of ");
                    text.TotalPages();
                });
            });
        });
    }

    private void ComposeContent(IContainer container, PastoralCareReportDto reportData)
    {
        container.PaddingVertical(10).Column(column =>
        {
            // Summary
            column.Item().PaddingBottom(15).Row(row =>
            {
                row.RelativeItem().Text($"Total Members Requiring Care: {reportData.TotalMembers}").Bold();
                row.RelativeItem().AlignRight().Text($"Generated: {reportData.GeneratedDate:dd/MM/yyyy HH:mm}").FontSize(9).FontColor(Colors.Grey.Darken1);
            });

            // Districts
            foreach (var district in reportData.Districts)
            {
                ComposeDistrict(column.Item(), district);
            }
        });
    }

    private void ComposeDistrict(IContainer container, PastoralCareDistrictDto district)
    {
        container.PaddingBottom(20).Column(column =>
        {
            // District header
            column.Item().Background(Colors.Blue.Lighten4).Padding(8).Row(row =>
            {
                row.RelativeItem().Text(district.DistrictName).FontSize(14).Bold().FontColor(Colors.Blue.Darken2);
                row.RelativeItem().AlignRight().Text($"Deacon: {district.DeaconName}").FontSize(11).Italic();
            });

            // Members in two-column layout
            column.Item().PaddingTop(10).Element(content => ComposeMemberList(content, district.Members));
        });
    }

    private void ComposeMemberList(IContainer container, PastoralCareMemberDto[] members)
    {
        // Calculate midpoint for two columns
        var halfCount = (int)Math.Ceiling(members.Length / 2.0);
        var leftColumn = members.Take(halfCount).ToArray();
        var rightColumn = members.Skip(halfCount).ToArray();

        container.Row(row =>
        {
            // Left column
            row.RelativeItem().PaddingRight(10).Column(column =>
            {
                foreach (var member in leftColumn)
                {
                    column.Item().PaddingBottom(4).Text($"• {member.FullName}");
                }
            });

            // Right column
            row.RelativeItem().PaddingLeft(10).Column(column =>
            {
                foreach (var member in rightColumn)
                {
                    column.Item().PaddingBottom(4).Text($"• {member.FullName}");
                }
            });
        });
    }

    private void ComposeFooter(IContainer container, PastoralCareReportDto reportData)
    {
        container.BorderTop(1).BorderColor(Colors.Grey.Lighten2).PaddingTop(10).Row(row =>
        {
            row.RelativeItem().Text("Church Register - Pastoral Care Report").FontSize(8).FontColor(Colors.Grey.Darken1);
            row.RelativeItem().AlignRight().Text($"Generated on {reportData.GeneratedDate:dddd, dd MMMM yyyy 'at' HH:mm}").FontSize(8).FontColor(Colors.Grey.Darken1);
        });
    }
}
