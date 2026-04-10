using ChurchRegister.ApiService.Models.ChurchMembers;

namespace ChurchRegister.ApiService.UseCase.ChurchMembers.PreviewRegisterNumbers;

public interface IPreviewRegisterNumbersUseCase
{
    Task<PreviewRegisterNumbersResponse> ExecuteAsync(int year, CancellationToken cancellationToken = default);
}
