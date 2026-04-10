using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.ApiService.Services.ChurchMembers;
using ChurchRegister.ApiService.Exceptions;

namespace ChurchRegister.ApiService.UseCase.ChurchMembers.PreviewRegisterNumbers;

public class PreviewRegisterNumbersUseCase : IPreviewRegisterNumbersUseCase
{
    private readonly IRegisterNumberService _registerNumberService;
    private readonly ILogger<PreviewRegisterNumbersUseCase> _logger;

    public PreviewRegisterNumbersUseCase(
        IRegisterNumberService registerNumberService,
        ILogger<PreviewRegisterNumbersUseCase> logger)
    {
        _registerNumberService = registerNumberService;
        _logger = logger;
    }

    public async Task<PreviewRegisterNumbersResponse> ExecuteAsync(
        int year,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Previewing register numbers for year {Year}", year);

        if (year < 2000 || year > 2100)
            throw new ArgumentException("Invalid year");

        var result = await _registerNumberService.PreviewForYearAsync(year, cancellationToken);

        _logger.LogInformation("Preview returned {MemberCount} Members and {NonMemberCount} Non-Members for year {Year}",
            result.TotalMembers, result.TotalNonMembers, year);

        return result;
    }
}
