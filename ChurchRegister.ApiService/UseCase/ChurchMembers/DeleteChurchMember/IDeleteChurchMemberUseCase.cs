namespace ChurchRegister.ApiService.UseCase.ChurchMembers.DeleteChurchMember;

public interface IDeleteChurchMemberUseCase
{
    Task ExecuteAsync(int memberId, CancellationToken cancellationToken = default);
}
