using ChurchRegister.ApiService.Models.Reminders;
using ChurchRegister.Database.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace ChurchRegister.ApiService.Services.Reminders;

/// <summary>
/// Service for generating PDF reports for reminders
/// </summary>
public class RemindersPdfService : IRemindersPdfService
{
    private readonly ChurchRegisterWebContext _context;
    private readonly UserManager<ChurchRegisterWebUser> _userManager;
    private readonly ILogger<RemindersPdfService> _logger;

    public RemindersPdfService(
        ChurchRegisterWebContext context,
        UserManager<ChurchRegisterWebUser> userManager,
        ILogger<RemindersPdfService> logger)
    {
        _context = context;
        _userManager = userManager;
        _logger = logger;
        
        // Configure QuestPDF license (Community License for open-source projects)
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public async Task<byte[]> GenerateDueReportAsync(int daysAhead, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Generating reminders due report ({DaysAhead} days)", daysAhead);

            var dueDate = DateTime.UtcNow.AddDays(daysAhead);
            var now = DateTime.UtcNow;
            
            // Fetch due reminders
            var reminders = await _context.Reminders
                .Include(r => r.Category)
                .Where(r => r.DueDate <= dueDate && 
                           r.DueDate >= now &&
                           r.Status != "Completed")
                .OrderBy(r => r.DueDate)
                .ToListAsync(cancellationToken);

            var dueReminders = new List<DueReminder>();
            
            foreach (var reminder in reminders)
            {
                var assignedToName = "Unassigned";
                if (!string.IsNullOrEmpty(reminder.AssignedToUserId))
                {
                    var user = await _userManager.FindByIdAsync(reminder.AssignedToUserId);
                    if (user != null)
                    {
                        assignedToName = $"{user.FirstName} {user.LastName}";
                    }
                }

                dueReminders.Add(new DueReminder
                {
                    Description = reminder.Description,
                    DueDate = reminder.DueDate,
                    DaysUntilDue = (int)(reminder.DueDate - now).TotalDays,
                    AssignedTo = assignedToName,
                    Priority = reminder.Priority,
                    Status = reminder.Status,
                    Category = reminder.Category?.Name
                });
            }

            var reportData = new ReminderReportDto
            {
                Reminders = dueReminders.ToArray(),
                TotalCount = dueReminders.Count,
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
            
            _logger.LogInformation("Successfully generated reminders PDF report ({Size} bytes)", pdfBytes.Length);
            
            return pdfBytes;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating reminders PDF report");
            throw;
        }
    }

    private void ComposeHeader(IContainer container, ReminderReportDto reportData)
    {
        container.BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingBottom(10).Row(row =>
        {
            row.RelativeItem().Column(column =>
            {
                column.Item().Text("Reminders - Due Soon").FontSize(20).Bold().FontColor(Colors.Blue.Darken2);
                column.Item().Text($"Reminders due within {reportData.DaysAhead} days").FontSize(12).FontColor(Colors.Grey.Darken1);
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

    private void ComposeContent(IContainer container, ReminderReportDto reportData)
    {
        container.PaddingVertical(10).Column(column =>
        {
            // Summary
            column.Item().PaddingBottom(15).Row(row =>
            {
                row.RelativeItem().Text($"Total Due Reminders: {reportData.TotalCount}").Bold();
                row.RelativeItem().AlignRight().Text($"Generated: {reportData.GeneratedDate:dd/MM/yyyy HH:mm}").FontSize(9).FontColor(Colors.Grey.Darken1);
            });

            // Check if no reminders
            if (reportData.TotalCount == 0)
            {
                column.Item().PaddingTop(50).AlignCenter().Text("No reminders are due in the next 60 days.")
                    .FontSize(14).Italic().FontColor(Colors.Grey.Darken1);
                return;
            }

            // Table
            column.Item().Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn(4); // Description
                    columns.RelativeColumn(2); // Due Date
                    columns.RelativeColumn(1.5f); // Days Until
                    columns.RelativeColumn(2); // Assigned To
                    columns.RelativeColumn(1); // Priority
                });

                // Header
                table.Header(header =>
                {
                    header.Cell().Background(Colors.Blue.Lighten3).Padding(5).Text("Description").Bold();
                    header.Cell().Background(Colors.Blue.Lighten3).Padding(5).Text("Due Date").Bold();
                    header.Cell().Background(Colors.Blue.Lighten3).Padding(5).Text("Days Until").Bold();
                    header.Cell().Background(Colors.Blue.Lighten3).Padding(5).Text("Assigned To").Bold();
                    header.Cell().Background(Colors.Blue.Lighten3).Padding(5).Text("Priority").Bold();
                });

                // Rows
                foreach (var reminder in reportData.Reminders)
                {
                    table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(5).Text(reminder.Description);
                    table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(5).Text(reminder.DueDate.ToString("dd/MM/yyyy"));
                    
                    var daysColor = reminder.DaysUntilDue <= 7 ? Colors.Red.Medium : Colors.Orange.Medium;
                    table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(5).Text(reminder.DaysUntilDue.ToString()).FontColor(daysColor);
                    
                    table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(5).Text(reminder.AssignedTo);
                    
                    var priorityText = reminder.Priority == true ? "High" : "";
                    table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(5).Text(priorityText).FontColor(Colors.Red.Medium);
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
