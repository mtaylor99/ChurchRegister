using ChurchRegister.Database.Data;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace ChurchRegister.ApiService.Services.Attendance;

/// <summary>
/// Service for generating PDF reports for attendance
/// </summary>
public class AttendancePdfService : IAttendancePdfService
{
    private readonly ChurchRegisterWebContext _context;
    private readonly ILogger<AttendancePdfService> _logger;

    public AttendancePdfService(
        ChurchRegisterWebContext context,
        ILogger<AttendancePdfService> logger)
    {
        _context = context;
        _logger = logger;

        QuestPDF.Settings.License = LicenseType.Community;
    }

    public async Task<byte[]> GenerateAttendanceReportAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Generating attendance summary report PDF");

            // Get recent attendance data (last 30 days)
            var startDate = DateTime.UtcNow.AddDays(-30);
            var attendanceData = await _context.EventAttendances
                .Include(ea => ea.Event)
                .Where(ea => ea.Date >= startDate)
                .OrderByDescending(ea => ea.Date)
                .Take(50)
                .ToListAsync(cancellationToken);

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(1.5f, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Arial"));

                    page.Header().Element(ComposeHeader);
                    page.Content().Element(content => ComposeContent(content, attendanceData));
                    page.Footer().AlignCenter().Text(text =>
                    {
                        text.Span("Report generated on ");
                        text.Span(DateTime.UtcNow.ToString("dd MMMM yyyy")).SemiBold();
                    });
                });
            });

            var pdfBytes = document.GeneratePdf();
            _logger.LogInformation("Successfully generated attendance PDF report ({Size} bytes)", pdfBytes.Length);
            return pdfBytes;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating attendance PDF report");
            throw;
        }
    }

    private void ComposeHeader(IContainer container)
    {
        container.BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingBottom(10).Row(row =>
        {
            row.RelativeItem().Column(column =>
            {
                column.Item().Text("Attendance Summary Report").FontSize(20).Bold().FontColor(Colors.Blue.Darken2);
                column.Item().Text("Recent Event Attendance").FontSize(12).FontColor(Colors.Grey.Darken1);
            });
        });
    }

    private void ComposeContent(IContainer container, List<Database.Entities.EventAttendance> attendanceData)
    {
        container.PaddingVertical(10).Column(column =>
        {
            column.Item().PaddingBottom(15).Text($"Total Records: {attendanceData.Count}").Bold();

            if (!attendanceData.Any())
            {
                column.Item().PaddingTop(50).AlignCenter().Text("No attendance records found.")
                    .FontSize(14).Italic().FontColor(Colors.Grey.Darken1);
                return;
            }

            column.Item().Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn(2);
                    columns.RelativeColumn(4);
                    columns.RelativeColumn(1);
                });

                table.Header(header =>
                {
                    header.Cell().Background(Colors.Blue.Lighten3).Padding(5).Text("Date").Bold();
                    header.Cell().Background(Colors.Blue.Lighten3).Padding(5).Text("Event").Bold();
                    header.Cell().Background(Colors.Blue.Lighten3).Padding(5).Text("Attendance").Bold();
                });

                foreach (var record in attendanceData)
                {
                    table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(5)
                        .Text(record.Date.ToString("dd/MM/yyyy"));
                    table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(5)
                        .Text(record.Event?.Name ?? "N/A");
                    table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(5)
                        .Text(record.Attendance.ToString());
                }
            });
        });
    }
}
