using Azure;
using Azure.Communication.Email;
using ChurchRegister.ApiService.Configuration;
using Microsoft.Extensions.Options;

namespace ChurchRegister.ApiService.Services.Security;

/// <summary>
/// Azure Communication Services Email implementation
/// </summary>
public class AzureEmailService : IAzureEmailService
{
    private readonly EmailClient _emailClient;
    private readonly AzureEmailServiceConfiguration _configuration;
    private readonly ILogger<AzureEmailService> _logger;

    public AzureEmailService(
        IOptions<AzureEmailServiceConfiguration> configuration,
        ILogger<AzureEmailService> logger)
    {
        _configuration = configuration.Value;
        _logger = logger;

        if (string.IsNullOrEmpty(_configuration.ConnectionString))
        {
            _logger.LogWarning("Azure Communication Services connection string is not configured. Email functionality will be disabled.");
            _emailClient = null!;
        }
        else
        {
            _emailClient = new EmailClient(_configuration.ConnectionString);
        }
    }

    public async Task<bool> SendUserVerificationEmailAsync(string toEmail, string firstName, string verificationLink)
    {
        if (!_configuration.EnableEmailVerification)
        {
            _logger.LogInformation("Email verification is disabled in configuration");
            return true; // Return true to not block user creation
        }

        var subject = "Welcome to ChurchRegister - Please verify your email";
        var htmlContent = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                    <h2 style='color: #1976d2;'>Welcome to ChurchRegister, {firstName}!</h2>
                    <p>Thank you for joining our church management system. To complete your account setup, please verify your email address by clicking the button below:</p>
                    
                    <div style='text-align: center; margin: 30px 0;'>
                        <a href='{verificationLink}' 
                           style='background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;'>
                            Verify Email Address
                        </a>
                    </div>
                    
                    <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                    <p style='word-break: break-all; color: #666;'>{verificationLink}</p>
                    
                    <hr style='margin: 30px 0; border: 1px solid #eee;'>
                    <p style='color: #666; font-size: 12px;'>
                        If you did not request this account, please ignore this email.<br>
                        This email was sent from the ChurchRegister system.
                    </p>
                </div>";

        return await SendEmailAsync(toEmail, subject, htmlContent);
    }

    public async Task<bool> SendPasswordResetEmailAsync(string toEmail, string firstName, string resetLink)
    {
        var subject = "ChurchRegister - Password Reset Request";
        var htmlContent = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                    <h2 style='color: #1976d2;'>Password Reset Request</h2>
                    <p>Hello {firstName},</p>
                    <p>We received a request to reset your password for your ChurchRegister account. Click the button below to create a new password:</p>
                    
                    <div style='text-align: center; margin: 30px 0;'>
                        <a href='{resetLink}' 
                           style='background-color: #d32f2f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;'>
                            Reset Password
                        </a>
                    </div>
                    
                    <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                    <p style='word-break: break-all; color: #666;'>{resetLink}</p>
                    
                    <p><strong>This link will expire in 1 hour for security reasons.</strong></p>
                    
                    <hr style='margin: 30px 0; border: 1px solid #eee;'>
                    <p style='color: #666; font-size: 12px;'>
                        If you did not request a password reset, please ignore this email and your password will remain unchanged.<br>
                        This email was sent from the ChurchRegister system.
                    </p>
                </div>";

        return await SendEmailAsync(toEmail, subject, htmlContent);
    }

    public async Task<bool> SendAccountStatusNotificationAsync(string toEmail, string firstName, string statusChange)
    {
        var subject = "ChurchRegister - Account Status Update";
        var htmlContent = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                    <h2 style='color: #1976d2;'>Account Status Update</h2>
                    <p>Hello {firstName},</p>
                    <p>Your ChurchRegister account status has been updated:</p>
                    
                    <div style='background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                        <strong>{statusChange}</strong>
                    </div>
                    
                    <p>If you have any questions about this change, please contact your system administrator.</p>
                    
                    <hr style='margin: 30px 0; border: 1px solid #eee;'>
                    <p style='color: #666; font-size: 12px;'>
                        This email was sent from the ChurchRegister system.
                    </p>
                </div>";

        return await SendEmailAsync(toEmail, subject, htmlContent);
    }

    public async Task<bool> SendEmailAsync(string toEmail, string subject, string htmlContent)
    {
        if (_emailClient == null)
        {
            _logger.LogWarning("Email client is not configured. Cannot send email to {Email}", toEmail);
            return false;
        }

        try
        {
            var emailMessage = new EmailMessage(
                _configuration.SenderEmail,
                toEmail,
                new EmailContent(subject)
                {
                    Html = htmlContent
                });

            var emailSendOperation = await _emailClient.SendAsync(
                WaitUntil.Started,
                emailMessage);

            _logger.LogInformation("Email sent successfully to {Email} with subject '{Subject}'. Operation ID: {OperationId}",
                toEmail, subject, emailSendOperation.Id);

            return true;
        }
        catch (RequestFailedException ex)
        {
            _logger.LogError(ex, "Failed to send email to {Email} with subject '{Subject}'. Error: {Error}",
                toEmail, subject, ex.Message);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error sending email to {Email} with subject '{Subject}'",
                toEmail, subject);
            return false;
        }
    }
}