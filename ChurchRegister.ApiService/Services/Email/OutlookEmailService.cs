using ChurchRegister.ApiService.Exceptions;
using ChurchRegister.ApiService.Models.MonthlyReportPack;
using System.Runtime.InteropServices;

namespace ChurchRegister.ApiService.Services.Email;

/// <summary>
/// Service for Outlook email integration using COM interop
/// Note: This requires Microsoft Outlook to be installed on the server
/// </summary>
public class OutlookEmailService : IEmailService
{
    private readonly ILogger<OutlookEmailService> _logger;

    public OutlookEmailService(ILogger<OutlookEmailService> logger)
    {
        _logger = logger;
    }

    public bool IsOutlookInstalled()
    {
        try
        {
            // Try to create Outlook application instance
            var outlookType = Type.GetTypeFromProgID("Outlook.Application");
            if (outlookType == null)
            {
                return false;
            }

            var outlook = Activator.CreateInstance(outlookType);
            if (outlook != null)
            {
                Marshal.ReleaseComObject(outlook);
                return true;
            }

            return false;
        }
        catch (COMException)
        {
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Unexpected error checking for Outlook installation");
            return false;
        }
    }

    public void CreateEmailWithAttachments(EmailTemplateData template)
    {
        if (!IsOutlookInstalled())
        {
            throw new OutlookNotInstalledException();
        }

        dynamic? outlook = null;
        dynamic? mailItem = null;
        var tempFiles = new List<string>();

        try
        {
            _logger.LogInformation("Creating Outlook email with {AttachmentCount} attachments", template.Attachments.Count);

            // Create Outlook application instance
            var outlookType = Type.GetTypeFromProgID("Outlook.Application");
            outlook = Activator.CreateInstance(outlookType!);

            // Create new mail item
            mailItem = outlook.CreateItem(0); // 0 = olMailItem

            // Set subject and body
            mailItem.Subject = template.Subject;
            mailItem.Body = template.Body;

            // Save attachments to temp files and attach them
            var tempPath = Path.GetTempPath();
            foreach (var attachment in template.Attachments)
            {
                var tempFilePath = Path.Combine(tempPath, attachment.FileName);
                File.WriteAllBytes(tempFilePath, attachment.FileData);
                tempFiles.Add(tempFilePath);

                mailItem.Attachments.Add(tempFilePath);
                _logger.LogInformation("Attached {FileName} ({Size} bytes)", attachment.FileName, attachment.FileData.Length);
            }

            // Display the email (user can edit before sending)
            mailItem.Display(false);

            _logger.LogInformation("Outlook email created successfully with {Count} attachments", template.Attachments.Count);

            // Note: Temp files will be cleaned up after a short delay to allow Outlook to load them
            Task.Run(async () =>
            {
                await Task.Delay(5000); // Wait 5 seconds
                foreach (var file in tempFiles)
                {
                    try
                    {
                        if (File.Exists(file))
                        {
                            File.Delete(file);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to delete temp file: {File}", file);
                    }
                }
            });
        }
        catch (COMException ex)
        {
            _logger.LogError(ex, "COM error creating Outlook email");
            throw new OutlookNotInstalledException("Failed to create Outlook email. Ensure Outlook is properly installed and configured.", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating Outlook email");
            throw;
        }
        finally
        {
            // Release COM objects
            if (mailItem != null)
            {
                Marshal.ReleaseComObject(mailItem);
            }
            if (outlook != null)
            {
                Marshal.ReleaseComObject(outlook);
            }
        }
    }
}
