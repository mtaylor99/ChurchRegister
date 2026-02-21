namespace ChurchRegister.ApiService.Configuration
{
    /// <summary>
    /// Configuration for Risk Assessment feature
    /// </summary>
    public class RiskAssessmentConfiguration
    {
        public const string SectionName = "RiskAssessment";

        /// <summary>
        /// Minimum number of deacon approvals required before risk assessment status changes to Approved
        /// </summary>
        public int MinimumApprovalsRequired { get; set; } = 3;

        /// <summary>
        /// Number of days to look ahead when checking for due reviews in the background job
        /// </summary>
        public int ReviewLookaheadDays { get; set; } = 60;
        
        /// <summary>
        /// Default user ID to assign reminders to if no specific user is configured
        /// </summary>
        public string? DefaultReminderAssigneeUserId { get; set; }
    }
}
