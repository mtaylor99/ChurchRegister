$f = "C:\GitHub\ChurchRegister\ChurchRegister.Tests\TestResults\e80f72db-3d27-4d23-b97f-3bdee5872c1e\coverage.cobertura.xml"
$xml = [xml](Get-Content $f)
$out = [System.Collections.Generic.List[PSObject]]::new()
foreach ($pkg in $xml.coverage.packages.package) {
    foreach ($cls in $pkg.classes.class) {
        $fname = $cls.filename
        if ($fname -match '\\obj\\' -or $fname -match 'RegexGenerator') { continue }
        $lines = $cls.lines.line
        if ($null -eq $lines) { continue }
        $valid = $lines.Count
        $covered = ($lines | Where-Object { $_.hits -ne '0' }).Count
        $uncovered = $valid - $covered
        if ($uncovered -gt 20) {
            $out.Add([PSCustomObject]@{
                File = $fname.Split('\')[-1]
                Uncovered = $uncovered
                Valid = $valid
                Pct = [math]::Round($covered*100/$valid, 0)
            })
        }
    }
}
$out | Sort-Object Uncovered -Descending | Select-Object -First 35 | Format-Table -AutoSize | Out-File -FilePath "C:\GitHub\ChurchRegister\coverage_gaps.txt" -Encoding UTF8
Write-Host "Done. Lines written:" (Get-Content "C:\GitHub\ChurchRegister\coverage_gaps.txt").Count
