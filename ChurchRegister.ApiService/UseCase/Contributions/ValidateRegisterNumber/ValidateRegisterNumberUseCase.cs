using ChurchRegister.ApiService.Models.Contributions;
using ChurchRegister.ApiService.Services.Contributions;

namespace ChurchRegister.ApiService.UseCase.Contributions.ValidateRegisterNumber;

public class ValidateRegisterNumberUseCase : IValidateRegisterNumberUseCase
{
    private readonly IEnvelopeContributionService _envelopeService;
    private readonly ILogger<ValidateRegisterNumberUseCase> _logger;

    public ValidateRegisterNumberUseCase(
        IEnvelopeContributionService envelopeService,
        ILogger<ValidateRegisterNumberUseCase> logger)
    {
        _envelopeService = envelopeService;
        _logger = logger;
    }

    public async Task<ValidateRegisterNumberResponse> ExecuteAsync(
        int number,
        int year,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Validate register number: number={Number}, year={Year}", number, year);

        if (number <= 0)
            throw new ArgumentException("Valid register number is required");

        if (year < 2000 || year > 2100)
            throw new ArgumentException("Invalid year");

        var result = await _envelopeService.ValidateRegisterNumberAsync(number, year, cancellationToken);

        _logger.LogInformation("Register number {Number} for year {Year} is {Status}",
            number, year, result.Valid ? "valid" : "invalid");

        return result;
    }
}
