namespace ChurchRegister.ApiService.Exceptions;

/// <summary>
/// Exception thrown when Microsoft Outlook is not installed on the system
/// </summary>
public class OutlookNotInstalledException : Exception
{
    public OutlookNotInstalledException()
        : base("Microsoft Outlook is required to use the Monthly Report Pack feature. Please ensure Outlook is installed and configured on your machine.")
    {
    }

    public OutlookNotInstalledException(string message)
        : base(message)
    {
    }

    public OutlookNotInstalledException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
