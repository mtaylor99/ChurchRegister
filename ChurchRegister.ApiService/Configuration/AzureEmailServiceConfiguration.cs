namespace ChurchRegister.ApiService.Configuration
{
    /// <summary>
    /// Configuration for Azure Communication Services Email
    /// </summary>
    public class AzureEmailServiceConfiguration
    {
        public const string SectionName = "AzureEmailService";

        /// <summary>
        /// Azure Communication Services connection string
        /// </summary>
        public string ConnectionString { get; set; } = string.Empty;

        /// <summary>
        /// Email address used as the sender for all system emails
        /// </summary>
        public string SenderEmail { get; set; } = "noreply@churchregister.azurecomm.net";

        /// <summary>
        /// Display name for the sender
        /// </summary>
        public string SenderDisplayName { get; set; } = "ChurchRegister System";

        /// <summary>
        /// Whether email verification is enabled for new users
        /// </summary>
        public bool EnableEmailVerification { get; set; } = true;
    }
}