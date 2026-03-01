using ChurchRegister.ApiService.Configuration;
using ChurchRegister.ApiService.Services.Reminders;
using ChurchRegister.Database.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace ChurchRegister.ApiService.Services.BackgroundJobs;

/// <summary>
/// Background job that runs on application startup to check for risk assessments 
/// due for review and create/update reminders accordingly
/// </summary>
public class CheckDueRiskAssessmentReviewsJob : IHostedService
{
    private readonly IServiceScopeFactory _serviceScopeFactory;
    private readonly ILogger<CheckDueRiskAssessmentReviewsJob> _logger;
    private readonly RiskAssessmentConfiguration _config;

    public CheckDueRiskAssessmentReviewsJob(
        IServiceScopeFactory serviceScopeFactory,
        ILogger<CheckDueRiskAssessmentReviewsJob> logger,
        IOptions<RiskAssessmentConfiguration> config)
    {
        _serviceScopeFactory = serviceScopeFactory;
        _logger = logger;
        _config = config.Value;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Risk Assessment Review Check: Starting job");

        try
        {
            using var scope = _serviceScopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ChurchRegisterWebContext>();

            var today = DateTime.UtcNow.Date;
            var lookaheadDate = today.AddDays(_config.ReviewLookaheadDays);

            // Get risk assessments that are Approved and due for review within the lookahead period
            var dueAssessments = await context.RiskAssessments
                .Where(ra => ra.Status == "Approved" && ra.NextReviewDate <= lookaheadDate)
                .ToListAsync(cancellationToken);

            _logger.LogInformation("Risk Assessment Review Check: Found {Count} assessments due within {Days} days",
                dueAssessments.Count, _config.ReviewLookaheadDays);

            if (!dueAssessments.Any())
            {
                _logger.LogInformation("Risk Assessment Review Check: No assessments due for review");
                return;
            }

            // Get the "Risk Assessments" category
            var riskAssessmentCategory = await context.ReminderCategories
                .FirstOrDefaultAsync(rc => rc.Name == "Risk Assessments", cancellationToken);

            if (riskAssessmentCategory == null)
            {
                _logger.LogWarning("Risk Assessment Review Check: 'Risk Assessments' category not found in ReminderCategories");
                return;
            }

            int created = 0;
            int updated = 0;
            int skipped = 0;

            foreach (var assessment in dueAssessments)
            {
                var reminderDescription = $"Risk Assessment Review: {assessment.Title}";

                // Check if a reminder already exists for this assessment
                var existingReminder = await context.Reminders
                    .FirstOrDefaultAsync(r => r.Description == reminderDescription, cancellationToken);

                if (existingReminder == null)
                {
                    // Create new reminder
                    var newReminder = new Database.Entities.Reminder
                    {
                        CategoryId = riskAssessmentCategory.Id,
                        Description = reminderDescription,
                        DueDate = assessment.NextReviewDate,
                        AssignedToUserId = !string.IsNullOrEmpty(_config.DefaultReminderAssigneeUserId)
                            ? _config.DefaultReminderAssigneeUserId
                            : null,
                        Priority = assessment.NextReviewDate < today, // High priority if overdue
                        Status = "Pending",
                        CreatedBy = "System",
                        CreatedDateTime = DateTime.UtcNow
                    };

                    context.Reminders.Add(newReminder);
                    created++;

                    _logger.LogInformation("Risk Assessment Review Check: Created reminder for '{Title}'", assessment.Title);
                }
                else if (existingReminder.DueDate != assessment.NextReviewDate)
                {
                    // Update existing reminder's due date
                    existingReminder.DueDate = assessment.NextReviewDate;
                    existingReminder.Priority = assessment.NextReviewDate < today;
                    existingReminder.ModifiedBy = "System";
                    existingReminder.ModifiedDateTime = DateTime.UtcNow;

                    updated++;

                    _logger.LogInformation("Risk Assessment Review Check: Updated reminder due date for '{Title}'", assessment.Title);
                }
                else
                {
                    // Reminder is already current
                    skipped++;
                }
            }

            if (created > 0 || updated > 0)
            {
                await context.SaveChangesAsync(cancellationToken);
            }

            _logger.LogInformation("Risk Assessment Review Check: Created {Created}, Updated {Updated}, Skipped {Skipped} reminders",
                created, updated, skipped);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Risk Assessment Review Check: Error occurred during review check");
            // Don't throw - we don't want to crash application startup
        }
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Risk Assessment Review Check: Stopping job");
        return Task.CompletedTask;
    }
}
