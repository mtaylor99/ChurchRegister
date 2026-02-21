using ChurchRegister.ApiService.Models.Security;

namespace ChurchRegister.ApiService.UseCase.Authentication.Login;

public interface ILoginUseCase : IUseCase<LoginRequest, LoginResponse>
{
}