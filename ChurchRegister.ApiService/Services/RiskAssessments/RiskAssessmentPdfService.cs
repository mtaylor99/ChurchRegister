using ChurchRegister.Database.Data;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace ChurchRegister.ApiService.Services.RiskAssessments;

/// <summary>
/// Service for generating PDF reports for risk assessments
/// </summary>
public class RiskAssessmentPdfService : IRiskAssessmentPdfService
{
    private readonly ChurchRegisterWebContext _context;
    private readonly ILogger<RiskAssessmentPdfService> _logger;

    public RiskAssessmentPdfService(
        ChurchRegisterWebContext context,
        ILogger<RiskAssessmentPdfService> logger)
    {
        _context = context;
        _logger = logger;

        QuestPDF.Settings.License = LicenseType.Community;
    }

    public async Task<byte[]> GenerateRiskAssessmentReportAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Generating risk assessments register report PDF");

            var assessments = await _context.RiskAssessments
                .Include(ra => ra.Category)
                .OrderBy(ra => ra.Title)
                .ToListAsync(cancellationToken);

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4.Landscape());
                    page.Margin(1.5f, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(9).FontFamily("Arial"));

                    page.Header().Element(ComposeHeader);
                    page.Content().Element(content => ComposeContent(content, assessments));
                    page.Footer().AlignCenter().Text(text =>
                    {
                        text.Span("Report generated on ");
                        text.Span(DateTime.UtcNow.ToString("dd MMMM yyyy")).SemiBold();
                    });
                });
            });

            var pdfBytes = document.GeneratePdf();
            _logger.LogInformation("Successfully generated risk assessments PDF report ({Size} bytes)", pdfBytes.Length);
            return pdfBytes;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating risk assessments PDF report");
            throw;
        }
    }

    private void ComposeHeader(IContainer container)
    {
        container.BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingBottom(10).Row(row =>
        {
            row.RelativeItem().Column(column =>
            {
                column.Item().Text("Risk Assessment Register").FontSize(20).Bold().FontColor(Colors.Blue.Darken2);
                column.Item().Text("Church Risk Assessments Overview").FontSize(12).FontColor(Colors.Grey.Darken1);
            });
        });
    }

    private void ComposeContent(IContainer container, List<Database.Entities.RiskAssessment> assessments)
    {
        container.PaddingVertical(10).Column(column =>
        {
            column.Item().PaddingBottom(15).Text($"Total Assessments: {assessments.Count}").Bold();

            if (!assessments.Any())
            {
                column.Item().PaddingTop(50).AlignCenter().Text("No risk assessments found.")
                    .FontSize(14).Italic().FontColor(Colors.Grey.Darken1);
                return;
            }

            column.Item().Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn(3);
                    columns.RelativeColumn(2);
                    columns.RelativeColumn(2);
                    columns.RelativeColumn(1.5f);
                    columns.RelativeColumn(1.5f);
                });

                table.Header(header =>
                {
                    header.Cell().Background(Colors.Blue.Lighten3).Padding(5).Text("Title").Bold();
                    header.Cell().Background(Colors.Blue.Lighten3).Padding(5).Text("Category").Bold();
                    header.Cell().Background(Colors.Blue.Lighten3).Padding(5).Text("Last Reviewed").Bold();
                    header.Cell().Background(Colors.Blue.Lighten3).Padding(5).Text("Next Review").Bold();
                    header.Cell().Background(Colors.Blue.Lighten3).Padding(5).Text("Status").Bold();
                });

                foreach (var assessment in assessments)
                {
                    table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(5)
                        .Text(assessment.Title);
                    table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(5)
                        .Text(assessment.Category?.Name ?? "N/A");
                    table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(5)
                        .Text(assessment.LastReviewDate?.ToString("dd/MM/yyyy") ?? "N/A");
                    table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(5)
                        .Text(assessment.NextReviewDate.ToString("dd/MM/yyyy"));
                    table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(5)
                        .Text(assessment.Status);
                }
            });
        });
    }
}
