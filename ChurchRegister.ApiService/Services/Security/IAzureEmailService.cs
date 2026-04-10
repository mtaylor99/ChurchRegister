namespace ChurchRegister.ApiService.Services.Security;

/// <summary>
/// Interface for Azure Communication Services Email functionality
/// </summary>
public interface IAzureEmailService
{
    /// <summary>
    /// Send a user verification email
    /// </summary>
    /// <param name="toEmail">Recipient email address</param>
    /// <param name="firstName">User's first name</param>
    /// <param name="verificationLink">Email verification link</param>
    /// <returns>True if email was sent successfully</returns>
    Task<bool> SendUserVerificationEmailAsync(string toEmail, string firstName, string verificationLink);

    /// <summary>
    /// Send a password reset email
    /// </summary>
    /// <param name="toEmail">Recipient email address</param>
    /// <param name="firstName">User's first name</param>
    /// <param name="resetLink">Password reset link</param>
    /// <returns>True if email was sent successfully</returns>
    Task<bool> SendPasswordResetEmailAsync(string toEmail, string firstName, string resetLink);

    /// <summary>
    /// Send an account status notification email
    /// </summary>
    /// <param name="toEmail">Recipient email address</param>
    /// <param name="firstName">User's first name</param>
    /// <param name="statusChange">Description of the status change</param>
    /// <returns>True if email was sent successfully</returns>
    Task<bool> SendAccountStatusNotificationAsync(string toEmail, string firstName, string statusChange);

    /// <summary>
    /// Send a general notification email
    /// </summary>
    /// <param name="toEmail">Recipient email address</param>
    /// <param name="subject">Email subject</param>
    /// <param name="htmlContent">Email body in HTML format</param>
    /// <returns>True if email was sent successfully</returns>
    Task<bool> SendEmailAsync(string toEmail, string subject, string htmlContent);
}