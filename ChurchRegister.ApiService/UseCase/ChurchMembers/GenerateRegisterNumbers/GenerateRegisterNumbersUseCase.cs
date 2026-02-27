using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.ApiService.Services.ChurchMembers;
using ChurchRegister.ApiService.Exceptions;

namespace ChurchRegister.ApiService.UseCase.ChurchMembers.GenerateRegisterNumbers;

public class GenerateRegisterNumbersUseCase : IGenerateRegisterNumbersUseCase
{
    private readonly IRegisterNumberService _registerNumberService;
    private readonly ILogger<GenerateRegisterNumbersUseCase> _logger;

    public GenerateRegisterNumbersUseCase(
        IRegisterNumberService registerNumberService,
        ILogger<GenerateRegisterNumbersUseCase> logger)
    {
        _registerNumberService = registerNumberService;
        _logger = logger;
    }

    public async Task<GenerateRegisterNumbersResponse> ExecuteAsync(
        GenerateRegisterNumbersRequest request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Generating register numbers for year {Year}", request.TargetYear);
        
        ValidateRequest(request);
        
        if (await _registerNumberService.HasBeenGeneratedForYearAsync(request.TargetYear, cancellationToken))
        {
            throw new ValidationException($"Register numbers for year {request.TargetYear} have already been generated. Please use the existing numbers or contact an administrator.");
        }

        var result = await _registerNumberService.GenerateForYearAsync(request.TargetYear, cancellationToken);
        
        _logger.LogInformation("Successfully generated {Count} register numbers for year {Year}", 
            result.TotalMembersAssigned, request.TargetYear);
        
        return result;
    }

    private void ValidateRequest(GenerateRegisterNumbersRequest request)
    {
        if (!request.ConfirmGeneration)
            throw new ArgumentException("Generation must be confirmed");
        
        if (request.TargetYear < 2000 || request.TargetYear > 2100)
            throw new ArgumentException("Invalid target year");
    }
}
