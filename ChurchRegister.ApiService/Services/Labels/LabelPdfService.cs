using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace ChurchRegister.ApiService.Services.Labels;

/// <summary>
/// Generates Avery L7163 label PDFs (A4 portrait, 2 columns × 7 rows per page).
/// </summary>
public class LabelPdfService : ILabelPdfService
{
    private const int Columns = 2;
    private const int Rows = 7;

    // Avery L7163 dimensions (mm)
    private const float LabelWidth = 99.1f;
    private const float LabelHeight = 38.1f;
    private const float MarginTopBottom = 10.7f;
    private const float MarginLeftRight = 4.6f;
    private const float ColumnGutter = 2.54f;
    private const float InternalPadding = 2f;

    // Font sizes
    private const float Line1FontSize = 9f;
    private const float Lines24FontSize = 9f;
    private const float Line5FontSize = 8f;

    private const string NonMemberColour = "#CC0000";

    public LabelPdfService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public byte[] GenerateLabels(IReadOnlyList<LabelData> labels)
    {
        // Pair labels into rows of 2 (left, right), padding with null for odd counts
        var rows = new List<(LabelData? Left, LabelData? Right)>();
        for (int i = 0; i < labels.Count; i += Columns)
        {
            var left = i < labels.Count ? labels[i] : null;
            var right = (i + 1) < labels.Count ? labels[i + 1] : null;
            rows.Add((left, right));
        }

        // Pad to a full page (multiple of Rows=7) so each page is exactly 7 rows
        while (rows.Count % Rows != 0)
        {
            rows.Add((null, null));
        }

        var document = Document.Create(container =>
        {
            container.Page(p =>
            {
                p.Size(PageSizes.A4);
                p.MarginVertical(MarginTopBottom, Unit.Millimetre);
                p.MarginHorizontal(MarginLeftRight, Unit.Millimetre);
                p.PageColor(Colors.White);
                p.DefaultTextStyle(x => x.FontSize(Lines24FontSize));

                p.Content().Table(table =>
                {
                    table.ColumnsDefinition(cols =>
                    {
                        cols.ConstantColumn(LabelWidth, Unit.Millimetre);
                        cols.RelativeColumn(); // fills the 2.54mm gutter without floating-point overflow
                        cols.ConstantColumn(LabelWidth, Unit.Millimetre);
                    });

                    foreach (var (left, right) in rows)
                    {
                        table.Cell()
                            .MinHeight(LabelHeight, Unit.Millimetre)
                            .Padding(InternalPadding, Unit.Millimetre)
                            .Column(lc => BuildLabelContent(lc, left));

                        table.Cell()
                            .MinHeight(LabelHeight, Unit.Millimetre);

                        table.Cell()
                            .MinHeight(LabelHeight, Unit.Millimetre)
                            .Padding(InternalPadding, Unit.Millimetre)
                            .Column(lc => BuildLabelContent(lc, right));
                    }
                });
            });
        });

        return document.GeneratePdf();
    }

    private static void BuildLabelContent(ColumnDescriptor col, LabelData? label)
    {
        if (label == null) return;

        col.Spacing(0);

        // Line 1 — Name (bold 9pt)
        if (!string.IsNullOrEmpty(label.Name))
        {
            col.Item().Text(label.Name)
                .Bold()
                .FontSize(Line1FontSize)
                .ClampLines(1);
        }

        // Line 2 — NameNumber (regular 9pt)
        if (!string.IsNullOrEmpty(label.NameNumber))
        {
            col.Item().Text(label.NameNumber)
                .FontSize(Lines24FontSize)
                .ClampLines(1);
        }

        // Line 3 — AddressLineOne (regular 9pt)
        if (!string.IsNullOrEmpty(label.AddressLineOne))
        {
            col.Item().Text(label.AddressLineOne)
                .FontSize(Lines24FontSize)
                .ClampLines(1);
        }

        // Line 4 — GUD-006: if AddressLineTwo is null/empty → Town only; else AddressLineTwo + " " + Town
        var line4 = BuildLine4(label);
        if (!string.IsNullOrEmpty(line4))
        {
            col.Item().Text(line4)
                .FontSize(Lines24FontSize)
                .ClampLines(1);
        }

        // Postcode
        if (!string.IsNullOrEmpty(label.Postcode))
        {
            col.Item().Text(label.Postcode)
                .FontSize(Lines24FontSize)
                .ClampLines(1);
        }

        // Line 5 — optional (e.g. register number or ***NON-MEMBER***)
        if (!string.IsNullOrEmpty(label.Line5))
        {
            var line5Text = col.Item().Text(label.Line5)
                .Bold()
                .FontSize(Line5FontSize);

            if (label.Line5IsNonMember)
            {
                line5Text.FontColor(NonMemberColour);
            }
        }
    }

    private static string? BuildLine4(LabelData label)
    {
        if (string.IsNullOrWhiteSpace(label.AddressLineTwo))
        {
            return label.Town;
        }

        var parts = new List<string>();
        parts.Add(label.AddressLineTwo);
        if (!string.IsNullOrWhiteSpace(label.Town))
        {
            parts.Add(label.Town);
        }
        return string.Join(" ", parts);
    }

}
