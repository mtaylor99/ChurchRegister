namespace ChurchRegister.ApiService.Services.Labels;

/// <summary>
/// Generates an Avery L7163 (A4, 2 × 7) label PDF from a list of LabelData.
/// </summary>
public interface ILabelPdfService
{
    /// <summary>
    /// Renders all labels into a PDF byte array.
    /// Labels are placed in reading order (left-to-right, top-to-bottom).
    /// Empty slots on the final page are left blank.
    /// </summary>
    byte[] GenerateLabels(IReadOnlyList<LabelData> labels);
}
