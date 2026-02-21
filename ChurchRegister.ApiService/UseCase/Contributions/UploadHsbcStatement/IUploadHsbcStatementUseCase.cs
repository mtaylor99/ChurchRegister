using ChurchRegister.ApiService.Models.Contributions;
using Microsoft.AspNetCore.Http;

namespace ChurchRegister.ApiService.UseCase.Contributions.UploadHsbcStatement;

public interface IUploadHsbcStatementUseCase
{
    Task<UploadHsbcStatementResponse> ExecuteAsync(IFormFile file, string uploadedBy, CancellationToken cancellationToken = default);
}
