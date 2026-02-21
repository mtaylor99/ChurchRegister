namespace ChurchRegister.ApiService.Models.Training;

public class TrainingCertificateReportDto
{
    public ExpiringCertificate[] Certificates { get; set; } = Array.Empty<ExpiringCertificate>();
    public int TotalCount { get; set; }
    public DateTime GeneratedDate { get; set; }
    public int DaysAhead { get; set; }
}

public class ExpiringCertificate
{
    public string MemberName { get; set; } = string.Empty;
    public string CertificateType { get; set; } = string.Empty;
    public DateTime? ExpiryDate { get; set; }
    public int DaysUntilExpiry { get; set; }
    public string Status { get; set; } = string.Empty;
}
