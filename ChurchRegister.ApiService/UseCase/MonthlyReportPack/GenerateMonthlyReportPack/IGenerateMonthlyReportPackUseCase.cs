using ChurchRegister.ApiService.Models.MonthlyReportPack;

namespace ChurchRegister.ApiService.UseCase.MonthlyReportPack.GenerateMonthlyReportPack;

public interface IGenerateMonthlyReportPackUseCase
{
    Task<MonthlyReportPackResult> ExecuteAsync(CancellationToken cancellationToken = default);
}
