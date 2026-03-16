using ChurchRegister.ApiService.Models.Contributions;

namespace ChurchRegister.ApiService.UseCase.Contributions.ValidateRegisterNumber;

public interface IValidateRegisterNumberUseCase
{
    Task<ValidateRegisterNumberResponse> ExecuteAsync(int number, int year, CancellationToken cancellationToken = default);
}
