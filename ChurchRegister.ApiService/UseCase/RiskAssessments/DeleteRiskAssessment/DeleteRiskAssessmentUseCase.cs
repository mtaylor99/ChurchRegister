using ChurchRegister.Database.Data;
using Microsoft.EntityFrameworkCore;

namespace ChurchRegister.ApiService.UseCase.RiskAssessments.DeleteRiskAssessment;

public class DeleteRiskAssessmentUseCase : IDeleteRiskAssessmentUseCase
{
    private readonly ChurchRegisterWebContext _context;
    private readonly ILogger<DeleteRiskAssessmentUseCase> _logger;

    public DeleteRiskAssessmentUseCase(
        ChurchRegisterWebContext context,
        ILogger<DeleteRiskAssessmentUseCase> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task ExecuteAsync(int id, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Deleting risk assessment {Id}", id);

        var assessment = await _context.RiskAssessments
            .Include(r => r.Approvals)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (assessment == null)
        {
            throw new KeyNotFoundException($"Risk assessment with ID {id} not found.");
        }

        // Remove approvals first (cascade delete should handle this, but being explicit)
        if (assessment.Approvals.Any())
        {
            _context.RiskAssessmentApprovals.RemoveRange(assessment.Approvals);
        }

        _context.RiskAssessments.Remove(assessment);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Deleted risk assessment {Id}", id);
    }
}
