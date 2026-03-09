using ChurchRegister.ApiService.Services.Labels;
using ChurchRegister.Database.Data;
using Microsoft.EntityFrameworkCore;

namespace ChurchRegister.ApiService.UseCase.ChurchMembers.ExportEnvelopeLabels;

/// <summary>
/// Queries active envelope recipients for the given year and generates an Avery L7163 label PDF.
/// </summary>
public class ExportEnvelopeLabelsUseCase : IExportEnvelopeLabelsUseCase
{
    private readonly ChurchRegisterWebContext _db;
    private readonly ILabelPdfService _labelPdfService;
    private readonly ILogger<ExportEnvelopeLabelsUseCase> _logger;

    public ExportEnvelopeLabelsUseCase(
        ChurchRegisterWebContext db,
        ILabelPdfService labelPdfService,
        ILogger<ExportEnvelopeLabelsUseCase> logger)
    {
        _db = db;
        _labelPdfService = labelPdfService;
        _logger = logger;
    }

    public async Task<byte[]> ExecuteAsync(int year, CancellationToken ct)
    {
        _logger.LogInformation("Generating envelope labels PDF for year {Year}", year);

        // Active envelope recipients = StatusId 1 AND Envelopes flag is true
        var members = await _db.ChurchMembers
            .Where(m => m.ChurchMemberStatusId == 1 && m.Envelopes)
            .Include(m => m.Address)
            .Include(m => m.District)
            .Include(m => m.RegisterNumbers)
            .AsNoTracking()
            .ToListAsync(ct);

        // Filter to those with a register number for the given year
        var labelled = new List<(int Number, LabelData Data)>();

        foreach (var member in members)
        {
            var reg = member.RegisterNumbers
                .Where(r => r.Year == year)
                .FirstOrDefault();

            if (reg == null)
            {
                _logger.LogWarning(
                    "Member {MemberId} ({FirstName} {LastName}) has no register number for year {Year} — excluded from envelope labels.",
                    member.Id, member.FirstName, member.LastName, year);
                continue;
            }

            // Format: "D-123" when district assigned, just "123" otherwise
            var displayNumber = member.District != null
                ? $"{member.District.Name}-{reg.Number}"
                : reg.Number.ToString();

            labelled.Add((reg.Number, new LabelData
            {
                Name = $"{member.FirstName} {member.LastName}",
                NameNumber = member.Address?.NameNumber,
                AddressLineOne = member.Address?.AddressLineOne,
                AddressLineTwo = member.Address?.AddressLineTwo,
                Town = member.Address?.Town,
                Postcode = member.Address?.Postcode,
                Line5 = displayNumber,
                Line5IsNonMember = false,
            }));
        }

        // Sort by register number ascending
        var sortedLabels = labelled
            .OrderBy(x => x.Number)
            .Select(x => x.Data)
            .ToList();

        _logger.LogInformation("Generating envelope labels PDF with {Count} labels for year {Year}", sortedLabels.Count, year);

        return _labelPdfService.GenerateLabels(sortedLabels);
    }
}
