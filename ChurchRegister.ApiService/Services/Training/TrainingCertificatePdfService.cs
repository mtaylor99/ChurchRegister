using ChurchRegister.ApiService.Models.Training;
using ChurchRegister.Database.Data;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace ChurchRegister.ApiService.Services.Training;

/// <summary>
/// Service for generating PDF reports for training certificates
/// </summary>
public class TrainingCertificatePdfService : ITrainingCertificatePdfService
{
    private readonly ChurchRegisterWebContext _context;
    private readonly ILogger<TrainingCertificatePdfService> _logger;

    public TrainingCertificatePdfService(
        ChurchRegisterWebContext context,
        ILogger<TrainingCertificatePdfService> logger)
    {
        _context = context;
        _logger = logger;
        
        //Configure QuestPDF license (Community License for open-source projects)
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public async Task<byte[]> GenerateExpiringReportAsync(int daysAhead, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Generating training certificates expiring report ({DaysAhead} days)", daysAhead);

            var expiringDate = DateTime.UtcNow.AddDays(daysAhead);
            var now = DateTime.UtcNow;
            
            // Fetch expiring certificates
            var certificates = await _context.ChurchMemberTrainingCertificates
                .Include(c => c.TrainingCertificateType)
                .Include(c => c.ChurchMember)
                .Where(c => c.Expires.HasValue && 
                           c.Expires.Value <= expiringDate && 
                           c.Expires.Value >= now)
                .OrderBy(c => c.Expires)
                .Select(c => new ExpiringCertificate
                {
                    MemberName = $"{c.ChurchMember.FirstName} {c.ChurchMember.LastName}",
                    CertificateType = c.TrainingCertificateType.Type,
                    ExpiryDate = c.Expires,
                    DaysUntilExpiry = (int)(c.Expires!.Value - now).TotalDays,
                    Status = c.Status
                })
                .ToArrayAsync(cancellationToken);

            var reportData = new TrainingCertificateReportDto
            {
                Certificates = certificates,
                TotalCount = certificates.Length,
                GeneratedDate = DateTime.UtcNow,
                DaysAhead = daysAhead
            };

            // Generate PDF
            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(1.5f, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Arial"));

                    page.Header().Element(header => ComposeHeader(header, reportData));
                    page.Content().Element(content => ComposeContent(content, reportData));
                    page.Footer().Element(ComposeFooter);
                });
            });

            var pdfBytes = document.GeneratePdf();
            
            _logger.LogInformation("Successfully generated training certificates PDF report ({Size} bytes)", pdfBytes.Length);
            
            return pdfBytes;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating training certificates PDF report");
            throw;
        }
    }

    private void ComposeHeader(IContainer container, TrainingCertificateReportDto reportData)
    {
        container.BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingBottom(10).Row(row =>
        {
            row.RelativeItem().Column(column =>
            {
                column.Item().Text("Training Certificates - Expiring Soon").FontSize(20).Bold().FontColor(Colors.Blue.Darken2);
                column.Item().Text($"Certificates expiring within {reportData.DaysAhead} days").FontSize(12).FontColor(Colors.Grey.Darken1);
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

    private void ComposeContent(IContainer container, TrainingCertificateReportDto reportData)
    {
        container.PaddingVertical(10).Column(column =>
        {
            // Summary
            column.Item().PaddingBottom(15).Row(row =>
            {
                row.RelativeItem().Text($"Total Expiring Certificates: {reportData.TotalCount}").Bold();
                row.RelativeItem().AlignRight().Text($"Generated: {reportData.GeneratedDate:dd/MM/yyyy HH:mm}").FontSize(9).FontColor(Colors.Grey.Darken1);
            });

            // Check if no certificates
            if (reportData.TotalCount == 0)
            {
                column.Item().PaddingTop(50).AlignCenter().Text("No training certificates are expiring in the next 60 days.")
                    .FontSize(14).Italic().FontColor(Colors.Grey.Darken1);
                return;
            }

            // Table header
            column.Item().Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn(3); // Member Name
                    columns.RelativeColumn(3); // Certificate Type
                    columns.RelativeColumn(2); // Expiry Date
                    columns.RelativeColumn(1.5f); // Days Until
                    columns.RelativeColumn(1.5f); // Status
                });

                // Header
                table.Header(header =>
                {
                    header.Cell().Background(Colors.Blue.Lighten3).Padding(5).Text("Member Name").Bold();
                    header.Cell().Background(Colors.Blue.Lighten3).Padding(5).Text("Certificate Type").Bold();
                    header.Cell().Background(Colors.Blue.Lighten3).Padding(5).Text("Expiry Date").Bold();
                    header.Cell().Background(Colors.Blue.Lighten3).Padding(5).Text("Days Until").Bold();
                    header.Cell().Background(Colors.Blue.Lighten3).Padding(5).Text("Status").Bold();
                });

                // Rows
                foreach (var cert in reportData.Certificates)
                {
                    table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(5).Text(cert.MemberName);
                    table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(5).Text(cert.CertificateType);
                    table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(5).Text(cert.ExpiryDate?.ToString("dd/MM/yyyy") ?? "N/A");
                    
                    var daysColor = cert.DaysUntilExpiry <= 30 ? Colors.Red.Medium : Colors.Orange.Medium;
                    table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(5).Text(cert.DaysUntilExpiry.ToString()).FontColor(daysColor);
                    
                    table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(5).Text(cert.Status);
                }
            });
        });
    }

    private void ComposeFooter(IContainer container)
    {
        container.AlignCenter().Text(text =>
        {
            text.Span("Report generated on ");
            text.Span(DateTime.UtcNow.ToString("dd MMMM yyyy")).SemiBold();
        });
    }
}
