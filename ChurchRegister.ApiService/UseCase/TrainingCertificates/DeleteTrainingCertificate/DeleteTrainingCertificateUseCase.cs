using ChurchRegister.Database.Data;

namespace ChurchRegister.ApiService.UseCase.TrainingCertificates.DeleteTrainingCertificate;

public class DeleteTrainingCertificateUseCase : IDeleteTrainingCertificateUseCase
{
    private readonly ChurchRegisterWebContext _context;
    private readonly ILogger<DeleteTrainingCertificateUseCase> _logger;

    public DeleteTrainingCertificateUseCase(
        ChurchRegisterWebContext context,
        ILogger<DeleteTrainingCertificateUseCase> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task ExecuteAsync(int id, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Deleting training certificate {Id}", id);

        var certificate = await _context.ChurchMemberTrainingCertificates.FindAsync(new object[] { id }, cancellationToken);
        if (certificate == null)
        {
            throw new KeyNotFoundException($"Training certificate with ID {id} not found.");
        }

        _context.ChurchMemberTrainingCertificates.Remove(certificate);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Deleted training certificate {Id}", id);
    }
}
