namespace ChurchRegister.ApiService.UseCase.Security.ResendInvitation;

public interface IResendInvitationUseCase
{
    Task<bool> ExecuteAsync(string userId, CancellationToken cancellationToken = default);
}
