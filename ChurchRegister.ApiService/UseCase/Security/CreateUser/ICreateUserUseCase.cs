using ChurchRegister.ApiService.Models.Security;

namespace ChurchRegister.ApiService.UseCase.Security.CreateUser;

public interface ICreateUserUseCase
{
    Task<CreateUserResponse> ExecuteAsync(CreateUserRequest request, string createdBy, CancellationToken cancellationToken = default);
}
