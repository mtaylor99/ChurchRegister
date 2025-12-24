using ChurchRegister.ApiService.Models.Authentication;

namespace ChurchRegister.ApiService.UseCase.Authentication.Login;

public interface ILoginUseCase : IUseCase<LoginRequest, LoginResponse>
{
}