namespace ChurchRegister.ApiService.Models.MonthlyReportPack;

public class MonthlyReportPackResult
{
    public List<ReportFile> SuccessfulReports { get; set; } = new();
    public List<ReportFailure> FailedReports { get; set; } = new();
    public DateTime GeneratedDate { get; set; }
    public string GeneratedBy { get; set; } = string.Empty;
}

public class ReportFile
{
    public string FileName { get; set; } = string.Empty;
    public byte[] FileData { get; set; } = Array.Empty<byte>();
    public string MimeType { get; set; } = "application/pdf";
}

public class ReportFailure
{
    public string ReportName { get; set; } = string.Empty;
    public string ErrorMessage { get; set; } = string.Empty;
}
